const API_BASE = window.API_BASE_URL || '{{API_BASE_URL}}';
let currentCursor = null;
let cursorHistory = [null];
let currentPuzzleCursor = null;
let puzzleCursorHistory = [null];

async function fetchApi(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'API Error');
    return data.data;
}

function showStatus(id, message, isError = false) {
    const el = document.getElementById(id);
    el.textContent = message;
    el.className = 'status ' + (isError ? 'error' : 'success');
    setTimeout(() => el.textContent = '', 5000);
}

// --- Redirect URLs ---
async function loadRedirectUrls() {
    try {
        const urls = await fetchApi('/admin/redirectUrl');
        const list = document.getElementById('redirectList');
        list.innerHTML = urls.map(u => `
            <tr>
                <td>${u.type}</td>
                <td style="word-break: break-all;">${u.url}</td>
                <td>
                    <button class="btn" onclick="editRedirectUrl('${u.type}', '${u.url}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteRedirectUrl('${u.type}')">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

function editRedirectUrl(type, url) {
    document.getElementById('urlInput').value = url;
    document.getElementById('typeInput').value = type;
    document.getElementById('typeInput').readOnly = true;
    document.getElementById('saveRedirectBtn').textContent = 'Update URL';
    document.getElementById('cancelRedirectBtn').style.display = 'inline-block';
}

function resetRedirectForm() {
    document.getElementById('urlInput').value = '';
    document.getElementById('typeInput').value = '';
    document.getElementById('typeInput').readOnly = false;
    document.getElementById('saveRedirectBtn').textContent = 'Save URL';
    document.getElementById('cancelRedirectBtn').style.display = 'none';
}

async function saveRedirectUrl() {
    const url = document.getElementById('urlInput').value;
    const type = document.getElementById('typeInput').value;
    try {
        await fetchApi('/admin/redirectUrl', {
            method: 'POST',
            body: JSON.stringify({ url, type })
        });
        showStatus('redirectStatus', 'URL saved successfully');
        resetRedirectForm();
        loadRedirectUrls();
    } catch (err) {
        showStatus('redirectStatus', err.message, true);
    }
}

async function deleteRedirectUrl(type) {
    if (!confirm(`Delete redirect URL for type "${type}"?`)) return;
    try {
        await fetchApi(`/admin/redirectUrl/${type}`, { method: 'DELETE' });
        loadRedirectUrls();
    } catch (err) {
        showStatus('redirectStatus', err.message, true);
    }
}

// --- Service Mappings ---
async function loadServiceMappings() {
    try {
        const mappings = await fetchApi('/admin/serviceMapping');
        const list = document.getElementById('mappingList');
        list.innerHTML = mappings.map(m => `
            <tr>
                <td>${m.serviceName}</td>
                <td>${m.redirectUrlType}</td>
                <td>
                    <button class="btn" onclick="editServiceMapping('${m.serviceName}', '${m.redirectUrlType}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteServiceMapping('${m.serviceName}')">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

function editServiceMapping(serviceName, redirectUrlType) {
    document.getElementById('serviceNameInput').value = serviceName;
    document.getElementById('serviceNameInput').readOnly = true;
    document.getElementById('redirectTypeInput').value = redirectUrlType;
    document.getElementById('saveMappingBtn').textContent = 'Update Mapping';
    document.getElementById('cancelMappingBtn').style.display = 'inline-block';
}

function resetMappingForm() {
    document.getElementById('serviceNameInput').value = '';
    document.getElementById('serviceNameInput').readOnly = false;
    document.getElementById('redirectTypeInput').value = '';
    document.getElementById('saveMappingBtn').textContent = 'Save Mapping';
    document.getElementById('cancelMappingBtn').style.display = 'none';
}

async function saveServiceMapping() {
    const serviceName = document.getElementById('serviceNameInput').value;
    const redirectUrlType = document.getElementById('redirectTypeInput').value;
    try {
        await fetchApi('/admin/serviceMapping', {
            method: 'POST',
            body: JSON.stringify({ serviceName, redirectUrlType })
        });
        showStatus('mappingStatus', 'Mapping saved successfully');
        resetMappingForm();
        loadServiceMappings();
    } catch (err) {
        showStatus('mappingStatus', err.message, true);
    }
}

async function deleteServiceMapping(serviceName) {
    if (!confirm(`Delete mapping for service "${serviceName}"?`)) return;
    try {
        await fetchApi(`/admin/serviceMapping/${serviceName}`, { method: 'DELETE' });
        loadServiceMappings();
    } catch (err) {
        showStatus('mappingStatus', err.message, true);
    }
}

// --- Dictionary ---
async function loadDictionary(cursor = null, direction = 1) {
    try {
        const query = cursor ? `?cursor=${cursor}` : '';
        const data = await fetchApi(`/dictionary${query}`);
        
        const list = document.getElementById('dictionaryList');
        list.innerHTML = data.items.map(w => `
            <tr>
                <td>${w.id}</td>
                <td>${w.word}</td>
                <td>${w.question}</td>
                <td>
                    <button class="btn" onclick="editWord('${w.id}', '${w.word}', \`${w.question.replace(/`/g, '\\`')}\`)">Edit</button>
                </td>
            </tr>
        `).join('');

        if (direction === 1 && cursor) {
            cursorHistory.push(cursor);
        } else if (direction === -1) {
            cursorHistory.pop();
        }

        currentCursor = data.continueCursor;
        document.getElementById('nextBtn').disabled = !currentCursor;
        document.getElementById('prevBtn').disabled = cursorHistory.length <= 1;
    } catch (err) {
        console.error(err);
    }
}

function editWord(id, word, question) {
    document.getElementById('wordIdInput').value = id;
    document.getElementById('wordInput').value = word;
    document.getElementById('questionInput').value = question;
    document.getElementById('saveWordBtn').textContent = 'Update Word';
    document.getElementById('cancelWordBtn').style.display = 'inline-block';
}

function resetWordForm() {
    document.getElementById('wordIdInput').value = '';
    document.getElementById('wordInput').value = '';
    document.getElementById('questionInput').value = '';
    document.getElementById('saveWordBtn').textContent = 'Save Word';
    document.getElementById('cancelWordBtn').style.display = 'none';
}

async function saveWord() {
    const id = document.getElementById('wordIdInput').value;
    const word = document.getElementById('wordInput').value;
    const question = document.getElementById('questionInput').value;
    try {
        if (id) {
            await fetchApi(`/dictionary/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ word, question })
            });
            showStatus('dictionaryStatus', 'Word updated successfully');
        } else {
            await fetchApi('/dictionary', {
                method: 'POST',
                body: JSON.stringify({ word, question })
            });
            showStatus('dictionaryStatus', 'Word added successfully');
        }
        resetWordForm();
        loadDictionary();
    } catch (err) {
        showStatus('dictionaryStatus', err.message, true);
    }
}

// --- Puzzles ---
async function loadPuzzles(cursor = null, direction = 1) {
    try {
        const query = cursor ? `?cursor=${cursor}` : '';
        const data = await fetchApi(`/admin/puzzles${query}`);
        
        const list = document.getElementById('puzzleList');
        list.innerHTML = data.items.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.userId}</td>
                <td class="${p.completed ? 'success' : ''}">${p.completed ? 'COMPLETE' : 'ACTIVE'}</td>
            </tr>
        `).join('');

        if (direction === 1 && cursor) {
            puzzleCursorHistory.push(cursor);
        } else if (direction === -1) {
            puzzleCursorHistory.pop();
        }

        currentPuzzleCursor = data.continueCursor;
        document.getElementById('nextPuzzleBtn').disabled = !currentPuzzleCursor;
        document.getElementById('prevPuzzleBtn').disabled = puzzleCursorHistory.length <= 1;
    } catch (err) {
        console.error(err);
        showStatus('puzzleStatus', err.message, true);
    }
}

// --- Short URLs ---
async function loadShortUrls() {
    try {
        const urls = await fetchApi('/admin/shortUrls');
        const list = document.getElementById('shortUrlList');
        list.innerHTML = urls.map(u => `
            <tr>
                <td><code>${u.shortCode}</code></td>
                <td>${u.userId}</td>
                <td style="word-break: break-all;">${u.redirectUrl}</td>
                <td>${u.type || '-'}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
        showStatus('shortUrlStatus', err.message, true);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    loadRedirectUrls();
    loadServiceMappings();
    loadDictionary();
    loadPuzzles();
    loadShortUrls();
});
