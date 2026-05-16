/* =========================
   API INTEGRATION
========================= */
const API_BASE_URL = window.API_BASE_URL || "{{API_BASE_URL}}";

async function fetchPuzzle() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserId = urlParams.get('userId');
    
    if (!urlUserId) {
        throw new Error("Missing required 'userId' in URL parameters.");
    }
    
    const storedUserId = localStorage.getItem('wordsearch_userId');
    
    const userIdToUse = urlUserId || storedUserId;
    const url = `${API_BASE_URL}/puzzle/wordSearch?userId=${userIdToUse}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to fetch puzzle from backend");
    }
    const result = await response.json();
    
    // Save user ID for next time
    if (result.data.userId) {
        localStorage.setItem('wordsearch_userId', result.data.userId);
    }
    
    return result.data;
}

async function validateWordOnBackend(word, cells = []) {
    const response = await fetch(`${API_BASE_URL}/puzzle/wordSearch/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            puzzleId,
            word,
            userId,
            cells: cells.map(c => ({ x: Number(c.dataset.x), y: Number(c.dataset.y) }))
        })
    });
    
    if (!response.ok) {
        return { success: false };
    }
    
    const result = await response.json();
    return result.data;
}

async function fetchCompletionData() {
    const response = await fetch(`${API_BASE_URL}/puzzle/wordSearch/complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            puzzleId,
            userId
        })
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.data;
}

function redirectToShortUrl(shortCode) {
    window.location.href = `${API_BASE_URL}/shortUrl/${shortCode}`;
}

/* =========================
   GAME STATE
========================= */

let SIZE;
let grid = [];
let words = [];
let clues = [];
let puzzleId = null;
let userId = null;
let revealLetters = [];

let selectedCells = [];
let isDragging = false;
let foundWords = new Map(); // Map of word -> first letter

const directions = [
    [1,0],[0,1],[1,1],[-1,0],[0,-1],[-1,-1],[1,-1],[-1,1]
];

/* =========================
   UTIL
========================= */

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}


/* =========================
   RENDER
========================= */

function render() {
    const container = document.getElementById("grid");
    const canvas = document.getElementById("lineCanvas");
    const cluesContainer = document.querySelector(".clues");

    container.innerHTML = "";
    container.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;

    grid.forEach((row, y) => {
        row.forEach((cell, x) => {
            const div = document.createElement("div");
            div.className = "cell";
            div.textContent = cell;
            div.dataset.x = x;
            div.dataset.y = y;

            div.addEventListener("mousedown", (e) => {
                e.preventDefault(); // Prevent text selection
                startSelection(div);
            });
            div.addEventListener("mouseenter", () => dragSelection(div));
            
            // Touch events for mobile
            div.addEventListener("touchstart", (e) => {
                e.preventDefault();
                startSelection(div);
            }, { passive: false });

            container.appendChild(div);
        });
    });

    // Global touchmove handler to support dragging on mobile
    container.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if (!isDragging) return;
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.classList.contains("cell")) {
            dragSelection(target);
        }
    }, { passive: false });

    document.addEventListener("touchend", endSelection);

    // Render clues
    cluesContainer.innerHTML = "<b>Clues</b>";
    clues.forEach((clue, index) => {
        if (!clue) return;
        const clueDiv = document.createElement("div");
        clueDiv.id = `clue-${clue.id}`;
        clueDiv.innerHTML = `${index + 1}. ${clue.question} (${clue.length})`;
        cluesContainer.appendChild(clueDiv);
    });

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

/* =========================
   GAME LOGIC
========================= */

function startSelection(cell) {
    clearSelection();
    isDragging = true;
    selectCell(cell);
}

function dragSelection(cell) {
    if (isDragging) selectCell(cell);
}

async function endSelection() {
    if (!isDragging) return;
    isDragging = false;

    let word = selectedCells.map(c => c.textContent).join("");
    // Remove any non-alphanumeric characters from the word string extracted from the grid
    word = word.replace(/[^a-z0-9]/g, "");
    let reversed = word.split("").reverse().join("");

    // Optimization: check if word is already found locally
    const wordId = btoa(word.toLowerCase()).replace(/=/g, '');
    const revId = btoa(reversed.toLowerCase()).replace(/=/g, '');
    if (foundWords.has(wordId) || foundWords.has(revId)) {
        clearSelection();
        selectedCells = [];
        return;
    }

    // Validation on backend - we don't check locally anymore to prevent word list exposure
    // Backend now checks both forward and reverse
    const validation = await validateWordOnBackend(word, selectedCells);
    
    if (validation.success) {
        handleFoundWord(validation.word, validation.cells);
    } else {
        clearSelection();
    }

    selectedCells = [];
}

function handleFoundWord(word, cells) {
    const wordLower = word.toLowerCase();
    const wordObfuscatedId = btoa(wordLower).replace(/=/g, "");
    if (foundWords.has(wordObfuscatedId)) return;
    
    foundWords.set(wordObfuscatedId, wordLower[0]);
    
    // Highlight cells in grid using the coordinates from cells array
    cells.forEach(pos => {
        const cellEl = document.querySelector(`.cell[data-x="${pos.x}"][data-y="${pos.y}"]`);
        if (cellEl) {
            cellEl.classList.add("found");
        }
    });
    
    const foundIndex = clues.findIndex(c => c.id === wordObfuscatedId);
    if (foundIndex !== -1) {
        revealLetters[foundIndex] = wordLower[0];
        updateRevealUI();
    }
    
    // Strike through clue
    const clueId = `clue-${wordObfuscatedId}`;
    const clueEl = document.getElementById(clueId);
    if (clueEl) {
        clueEl.style.textDecoration = "line-through";
        clueEl.style.opacity = "0.5";
    }
    
    // Clear selection so the "selected" color is replaced by "found"
    clearSelection();

    if (foundWords.size === clues.length) {
        setTimeout(async () => {
            const data = await fetchCompletionData();
            if (data && data.shortUrl) {
                showMysteriousReveal(data.shortUrl);
            }
        }, 500);
    }
}

async function showMysteriousReveal(shortCode) {
    const overlay = document.getElementById("mysteriousOverlay");
    const messageEl = document.getElementById("mysteriousMessage");
    const finalRevealEl = document.getElementById("finalReveal");
    
    overlay.style.display = "flex";
    
    const messages = [
        "CONGRATULATIONS...",
        "DECRYPTING SEQUENCE...",
        "STABILIZING CORE...",
        "ACCESS GRANTED."
    ];
    
    for (const msg of messages) {
        messageEl.textContent = "";
        messageEl.classList.add("glitch");
        for (let i = 0; i < msg.length; i++) {
            messageEl.textContent += msg[i];
            await new Promise(r => setTimeout(r, 50));
        }
        await new Promise(r => setTimeout(r, 800));
        messageEl.classList.remove("glitch");
    }
    
    finalRevealEl.textContent = shortCode.toUpperCase();
    finalRevealEl.style.opacity = "1";
    
    await new Promise(r => setTimeout(r, 3000));
    redirectToShortUrl(shortCode);
}

function updateRevealUI() {
    const container = document.getElementById("revealContainer");
    const titleEl = container.querySelector(".reveal-title");
    const codeEl = document.getElementById("revealCode");
    container.style.display = "block";
    
    const isComplete = revealLetters.every(l => l !== null);
    if (isComplete) {
        titleEl.textContent = "SEQUENCE STABILIZED";
        container.style.boxShadow = "0 0 30px rgba(0, 255, 150, 0.4)";
        container.style.borderColor = "#00ff96";
    } else {
        titleEl.textContent = "SEQUENCE INCOMPLETE";
    }
    
    codeEl.textContent = revealLetters.map(l => l || "_").join(" ");
}

function selectCell(cell) {
    if (selectedCells.length === 0) {
        selectedCells.push(cell);
        cell.classList.add("selected");
        return;
    }

    let first = selectedCells[0];
    let last = selectedCells[selectedCells.length - 1];

    let dx = Math.sign(cell.dataset.x - first.dataset.x);
    let dy = Math.sign(cell.dataset.y - first.dataset.y);

    // Check if it's the same direction as the previous selection
    if (selectedCells.length > 1) {
        let prevDx = Math.sign(last.dataset.x - first.dataset.x);
        let prevDy = Math.sign(last.dataset.y - first.dataset.y);
        if (dx !== prevDx || dy !== prevDy) {
            // Changed direction, ignore or reset? 
            // For now, let's just stick to the initial direction
            dx = prevDx;
            dy = prevDy;
        }
    }

    let ex = Number(first.dataset.x) + dx * selectedCells.length;
    let ey = Number(first.dataset.y) + dy * selectedCells.length;

    if (+cell.dataset.x === ex && +cell.dataset.y === ey) {
        if (!selectedCells.includes(cell)) {
            selectedCells.push(cell);
            cell.classList.add("selected");
        }
    }
}

function clearSelection() {
    selectedCells.forEach(c => c.classList.remove("selected"));
    selectedCells = [];
}

document.addEventListener("mouseup", endSelection);

/* =========================
   INIT
========================= */

async function init() {
    try {
        foundWords = new Map();

        const data = await fetchPuzzle();

        puzzleId = data.id;
        userId = data.userId || "guest";
        clues = data.clues;
        grid = data.grid;
        SIZE = data.size;

        revealLetters = new Array(data.clues.length).fill(null);
        render();

        // Restore progress if any
        if (data.foundWords && data.foundWords.length > 0) {
            data.foundWords.forEach(foundData => {
                const wordObfuscatedId = foundData.id;
                const firstLetter = foundData.firstLetter;
                const foundCells = foundData.cells || [];
                
                const clue = clues.find(c => c.id === wordObfuscatedId);
                if (clue) {
                    // Strike through clue
                    const clueEl = document.getElementById(`clue-${wordObfuscatedId}`);
                    if (clueEl) {
                        clueEl.style.textDecoration = "line-through";
                        clueEl.style.opacity = "0.5";
                    }
                    
                    // Restore reveal letter
                    const foundIndex = clues.findIndex(c => c.id === wordObfuscatedId);
                    if (foundIndex !== -1) {
                        revealLetters[foundIndex] = firstLetter;
                    }
                    
                    // Highlight cells in grid
                    foundCells.forEach(pos => {
                        const cellEl = document.querySelector(`.cell[data-x="${pos.x}"][data-y="${pos.y}"]`);
                        if (cellEl) {
                            cellEl.classList.add("found");
                        }
                    });
                    
                    // Track in foundWords
                    foundWords.set(wordObfuscatedId, firstLetter);
                }
            });
            updateRevealUI();
        }
    } catch (error) {
        console.error("Error initializing game:", error);
        document.getElementById("gameContent").style.display = "none";
        const errorPage = document.getElementById("errorPage");
        errorPage.style.display = "block";
        document.getElementById("errorMessage").textContent = error.message;
    }
}

init();
