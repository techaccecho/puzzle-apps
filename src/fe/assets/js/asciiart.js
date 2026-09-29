/* ==========================================================================
   Echo Archive // Sector 07 Terminal - ASCII Art Passcode Decoder Logic
   ========================================================================== */

(() => {
	const API_BASE_URL = window.API_BASE_URL || "{{API_BASE_URL}}";

	// Elements
	const sysClock = document.getElementById("sysClock");
	const lockoutBanner = document.getElementById("lockoutBanner");
	const lockoutAttemptsDisplay = document.getElementById(
		"lockoutAttemptsDisplay",
	);
	const resetStepTitle = document.getElementById("resetStepTitle");
	const decoderControl = document.getElementById("decoderControl");
	const attemptDots = document.getElementById("attemptDots");
	const attemptCounter = document.getElementById("attemptCounter");
	const passcodeForm = document.getElementById("passcodeForm");
	const letter1 = document.getElementById("letter1");
	const letter2 = document.getElementById("letter2");
	const letter3 = document.getElementById("letter3");
	const letterInputs = [letter1, letter2, letter3];
	const verifyBtn = document.getElementById("verifyBtn");
	const clearBtn = document.getElementById("clearBtn");
	const feedbackBox = document.getElementById("feedbackBox");
	const feedbackMessage = document.getElementById("feedbackMessage");
	const lockoutScreen = document.getElementById("lockoutScreen");
	const recalibrateBtn = document.getElementById("recalibrateBtn");
	const successScreen = document.getElementById("successScreen");
	const proceedBtn = document.getElementById("proceedBtn");
	const verifiedSequence = document.getElementById("verifiedSequence");
	const destinationTitle = document.getElementById("destinationTitle");
	const playerUserIdTag = document.getElementById("playerUserIdTag");

	let currentUserId = "guest";
	let currentStepId = null;
	let dynamicMaxAttempts = 4;
	let dynamicRecalibrateUrl = null;
	let dynamicDestinationUrl = null;
	let isSubmitting = false;

	/* ==========================================================================
     Clock Routine (UTC)
     ========================================================================== */
	function startClock() {
		function updateClock() {
			const now = new Date();
			const hours = String(now.getUTCHours()).padStart(2, "0");
			const minutes = String(now.getUTCMinutes()).padStart(2, "0");
			const seconds = String(now.getUTCSeconds()).padStart(2, "0");
			if (sysClock) {
				sysClock.textContent = `${hours}:${minutes}:${seconds} UTC`;
			}
		}
		updateClock();
		setInterval(updateClock, 1000);
	}

	/* ==========================================================================
     User ID & Step ID Resolution
     ========================================================================== */
	function appendUserIdToUrl(url, userId) {
		if (!url || !userId || userId.trim() === "") return url;
		try {
			const parsed = new URL(url, window.location.origin);
			parsed.searchParams.set("userId", userId.trim());
			return parsed.origin === window.location.origin && !url.startsWith("http")
				? `${parsed.pathname}${parsed.search}`
				: parsed.toString();
		} catch {
			const sep = url.includes("?") ? "&" : "?";
			return `${url}${sep}userId=${encodeURIComponent(userId.trim())}`;
		}
	}

	function resolveParams() {
		const params = new URLSearchParams(window.location.search);
		const urlUserId = params.get("userId");
		const urlStepId = params.get("stepId");
		const injectedUserId =
			window.USER_ID &&
			window.USER_ID !== "{{USER_ID}}" &&
			window.USER_ID.trim() !== ""
				? window.USER_ID.trim()
				: null;
		const storedUserId =
			localStorage.getItem("asciiart_userId") ||
			localStorage.getItem("wordsearch_userId");

		if (urlUserId && urlUserId.trim() !== "") {
			currentUserId = urlUserId.trim();
		} else if (injectedUserId) {
			currentUserId = injectedUserId;
		} else if (storedUserId && storedUserId.trim() !== "") {
			currentUserId = storedUserId.trim();
		} else {
			currentUserId = "guest";
		}

		if (currentUserId && currentUserId !== "guest") {
			localStorage.setItem("asciiart_userId", currentUserId);
			localStorage.setItem("wordsearch_userId", currentUserId);
		}

		if (urlStepId && urlStepId.trim() !== "") {
			currentStepId = urlStepId.trim();
		}

		if (playerUserIdTag) {
			playerUserIdTag.textContent = `USER: ${currentUserId.toUpperCase()}`;
		}

		dynamicRecalibrateUrl = `/wordsearch/puzzle?userId=${encodeURIComponent(currentUserId)}`;
		if (recalibrateBtn) {
			recalibrateBtn.href = dynamicRecalibrateUrl;
		}
	}

	/* ==========================================================================
     UI State Updaters
     ========================================================================== */
	function updateAttemptUI(attempts, maxAttempts = dynamicMaxAttempts) {
		dynamicMaxAttempts = maxAttempts;
		if (attemptDots) {
			while (attemptDots.children.length < maxAttempts) {
				const span = document.createElement("span");
				span.className = "dot";
				span.setAttribute(
					"data-attempt",
					(attemptDots.children.length + 1).toString(),
				);
				attemptDots.appendChild(span);
			}
			while (attemptDots.children.length > maxAttempts) {
				attemptDots.removeChild(attemptDots.lastChild);
			}
			const dots = attemptDots.querySelectorAll(".dot");
			dots.forEach((dot, index) => {
				if (index < attempts) {
					dot.classList.add("used");
				} else {
					dot.classList.remove("used");
				}
			});
		}

		if (attemptCounter) {
			attemptCounter.textContent = `${attempts} / ${maxAttempts} ATTEMPTS`;
		}
		if (lockoutAttemptsDisplay) {
			lockoutAttemptsDisplay.textContent = `${attempts}/${maxAttempts}`;
		}
	}

	function setFeedback(message, type = "normal") {
		if (!feedbackMessage || !feedbackBox) return;
		feedbackMessage.textContent = message;

		feedbackBox.classList.remove("error", "success");
		if (type === "error") {
			feedbackBox.classList.add("error");
		} else if (type === "success") {
			feedbackBox.classList.add("success");
		}
	}

	function showLockoutView(options = {}) {
		if (lockoutBanner) lockoutBanner.classList.remove("hidden");
		if (decoderControl) decoderControl.classList.add("hidden");
		if (lockoutScreen) lockoutScreen.classList.remove("hidden");
		if (successScreen) successScreen.classList.add("hidden");

		const rawRecalibrate = options.recalibrateUrl || dynamicRecalibrateUrl;
		if (rawRecalibrate && recalibrateBtn) {
			recalibrateBtn.href = appendUserIdToUrl(rawRecalibrate, currentUserId);
		}
		if (options.resetPrerequisiteTitle && resetStepTitle) {
			resetStepTitle.textContent = options.resetPrerequisiteTitle;
		}
		if (options.maxAttempts) {
			updateAttemptUI(
				options.attempts || dynamicMaxAttempts,
				options.maxAttempts,
			);
		}

		setFeedback("SECURITY LOCKOUT ACTIVE: Recalibration required.", "error");
	}

	function showSuccessView(options = {}) {
		const url = options.redirectUrl || dynamicDestinationUrl;
		if (lockoutBanner) lockoutBanner.classList.add("hidden");
		if (decoderControl) decoderControl.classList.add("hidden");
		if (lockoutScreen) lockoutScreen.classList.add("hidden");
		if (successScreen) successScreen.classList.remove("hidden");

		if (url && proceedBtn) {
			proceedBtn.href = appendUserIdToUrl(url, currentUserId);
		}
		if (options.passcode && verifiedSequence) {
			verifiedSequence.textContent = `[ ${options.passcode.split("").join(" - ")} ]`;
		}
		if (options.destinationTitle && destinationTitle) {
			destinationTitle.textContent = options.destinationTitle;
		}

		setFeedback("ACCESS GRANTED // Passcode sequence accepted.", "success");
	}

	function showDecoderView() {
		if (lockoutBanner) lockoutBanner.classList.add("hidden");
		if (decoderControl) decoderControl.classList.remove("hidden");
		if (lockoutScreen) lockoutScreen.classList.add("hidden");
		if (successScreen) successScreen.classList.add("hidden");
	}

	/* ==========================================================================
     Passcode Input Control & Auto-tabbing
     ========================================================================== */
	function setupInputs() {
		letterInputs.forEach((input, index) => {
			if (!input) return;

			input.addEventListener("input", () => {
				// Enforce single uppercase letter [A-Z]
				const cleanVal = input.value.replace(/[^a-zA-Z]/g, "").toUpperCase();
				input.value = cleanVal.slice(0, 1);

				if (input.value && index < letterInputs.length - 1) {
					letterInputs[index + 1].focus();
					letterInputs[index + 1].select();
				}
			});

			input.addEventListener("keydown", (e) => {
				if (e.key === "Backspace") {
					if (!input.value && index > 0) {
						letterInputs[index - 1].focus();
						letterInputs[index - 1].select();
					}
				} else if (e.key === "ArrowLeft" && index > 0) {
					letterInputs[index - 1].focus();
				} else if (e.key === "ArrowRight" && index < letterInputs.length - 1) {
					letterInputs[index + 1].focus();
				}
			});

			input.addEventListener("focus", () => {
				input.select();
			});
		});

		if (clearBtn) {
			clearBtn.addEventListener("click", () => {
				letterInputs.forEach((inp) => {
					if (inp) inp.value = "";
				});
				if (letter1) letter1.focus();
				setFeedback("Input sequence cleared. Awaiting operator input...");
			});
		}

		if (passcodeForm) {
			passcodeForm.addEventListener("submit", handlePasscodeSubmit);
		}
	}

	/* ==========================================================================
     Submission & Validation Handler
     ========================================================================== */
	async function handlePasscodeSubmit(e) {
		if (e) e.preventDefault();
		if (isSubmitting) return;

		const val1 = letter1 ? letter1.value.trim().toUpperCase() : "";
		const val2 = letter2 ? letter2.value.trim().toUpperCase() : "";
		const val3 = letter3 ? letter3.value.trim().toUpperCase() : "";
		const passcode = val1 + val2 + val3;

		if (passcode.length < 3) {
			setFeedback("INCOMPLETE SEQUENCE: Please enter all 3 letters.", "error");
			if (!val1 && letter1) letter1.focus();
			else if (!val2 && letter2) letter2.focus();
			else if (!val3 && letter3) letter3.focus();
			return;
		}

		isSubmitting = true;
		if (verifyBtn) {
			verifyBtn.disabled = true;
			verifyBtn.textContent = "[ VERIFYING... ]";
		}
		setFeedback("Transmitting sequence to central security core...", "normal");

		try {
			const payload = {
				userId: currentUserId,
				passcode: passcode,
			};
			if (currentStepId) {
				payload.stepId = currentStepId;
			}

			const response = await fetch(`${API_BASE_URL}/puzzle/asciiArt/validate`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			const data = await response.json();
			const result = data.data || {};

			if (result.maxAttempts) {
				dynamicMaxAttempts = result.maxAttempts;
			}
			updateAttemptUI(result.attempts || 0, dynamicMaxAttempts);

			if (response.ok && data.success && result.success) {
				if (result.redirectUrl) {
					dynamicDestinationUrl = result.redirectUrl;
				}
				showSuccessView({
					redirectUrl: result.redirectUrl,
					passcode: passcode,
					destinationTitle: result.title,
				});
			} else {
				if (result.isLockedOut) {
					showLockoutView({
						recalibrateUrl: result.recalibrateUrl,
						resetPrerequisiteTitle: result.resetPrerequisiteStepId,
						attempts: result.attempts,
						maxAttempts: result.maxAttempts,
					});
				} else {
					setFeedback(
						data.message ||
							result.message ||
							"ACCESS DENIED: Sequence invalid.",
						"error",
					);
					// Clear inputs on failure
					letterInputs.forEach((inp) => {
						if (inp) inp.value = "";
					});
					if (letter1) letter1.focus();
				}
			}
		} catch (err) {
			console.error("[AsciiArt] Error during validation:", err);
			setFeedback(
				"COMMUNICATION ERROR: Unable to verify sequence with central system.",
				"error",
			);
		} finally {
			isSubmitting = false;
			if (verifyBtn) {
				verifyBtn.disabled = false;
				verifyBtn.textContent = "[ VERIFY SEQUENCE ]";
			}
		}
	}

	/* ==========================================================================
     Initialization
     ========================================================================== */
	async function init() {
		startClock();
		resolveParams();
		setupInputs();

		try {
			let queryUrl = `${API_BASE_URL}/puzzle/asciiArt?userId=${encodeURIComponent(currentUserId)}`;
			if (currentStepId) {
				queryUrl += `&stepId=${encodeURIComponent(currentStepId)}`;
			}

			const res = await fetch(queryUrl);
			if (res.ok) {
				const json = await res.json();
				const state = json.data;
				if (state) {
					if (state.maxAttempts) {
						dynamicMaxAttempts = state.maxAttempts;
					}
					if (state.recalibrateUrl) {
						dynamicRecalibrateUrl = state.recalibrateUrl;
					}
					if (state.redirectUrl) {
						dynamicDestinationUrl = state.redirectUrl;
					}

					updateAttemptUI(state.attempts || 0, dynamicMaxAttempts);

					if (state.isCompleted) {
						showSuccessView({
							redirectUrl: state.redirectUrl,
							destinationTitle: state.title,
						});
						return;
					}

					if (state.isLockedOut) {
						showLockoutView({
							recalibrateUrl: state.recalibrateUrl,
							resetPrerequisiteTitle: state.resetPrerequisiteStepId,
							attempts: state.attempts,
							maxAttempts: dynamicMaxAttempts,
						});
						return;
					}
				}
			}
		} catch (err) {
			console.warn(
				"[AsciiArt] Initial state fetch failed, proceeding with default state:",
				err,
			);
		}

		showDecoderView();
		if (letter1) letter1.focus();
	}

	// Run on DOM ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
