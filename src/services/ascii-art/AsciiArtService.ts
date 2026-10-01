import { env } from "../../config/env.js";
import { BaseApiService } from "../BaseApiService.js";
import convexService from "../convex/ConvexService.js";
import wordSearchService from "../word-search/WordSearchService.js";

export interface AsciiArtPuzzleState {
	userId: string;
	stepId: string;
	title: string;
	status: "UNLOCKED" | "IN_PROGRESS" | "LOCKED_OUT" | "COMPLETED";
	attempts: number;
	maxAttempts: number;
	isLockedOut: boolean;
	isCompleted: boolean;
	isPrerequisiteMet: boolean;
	hint: string;
	asciiArt: string;
	redirectUrl?: string;
	resetPrerequisiteStepId?: string;
	recalibrateUrl?: string;
}

export interface ValidatePasscodeResult {
	success: boolean;
	completed: boolean;
	stepId: string;
	attempts: number;
	maxAttempts: number;
	isLockedOut: boolean;
	isPrerequisiteMet?: boolean;
	message: string;
	redirectUrl?: string;
	resetPrerequisiteStepId?: string;
	recalibrateUrl?: string;
}

export interface StepDefinitionMetadata {
	id: string;
	title: string;
	maxAttempts: number;
	resetPrerequisiteStepId: string;
	passcode?: string;
}

interface PlayerStateResponse {
	completedStepIds?: string[];
	activeStep?: {
		id: string;
		status: "UNLOCKED" | "IN_PROGRESS" | "LOCKED_OUT" | "COMPLETED";
		attempts?: number;
		maxAttempts?: number;
		resetPrerequisiteStepId?: string;
	};
	nextAvailableSteps?: Array<{
		id: string;
		status: "UNLOCKED" | "IN_PROGRESS" | "LOCKED_OUT" | "COMPLETED";
		title?: string;
	}>;
	unlockedPayloads?: Record<string, unknown>;
}

interface StepFailResponse {
	activeStep?: {
		id: string;
		status: "UNLOCKED" | "IN_PROGRESS" | "LOCKED_OUT" | "COMPLETED";
		attempts: number;
		maxAttempts?: number;
	};
	unlockedPayloads?: Record<string, unknown>;
}

export interface StepDefinitionDoc {
	id?: string;
	title?: string;
	type?: string;
	lockoutPolicy?: {
		maxAttempts?: number;
		resetPrerequisiteStepId?: string;
	};
	unlockPayload?: {
		passcode?: string;
		url?: string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export class AsciiArtService extends BaseApiService {
	private static instance: AsciiArtService;

	// Configurable defaults used as safety fallbacks when external services and env vars are unset
	public readonly defaultStepId = "step_07_passcode";
	public readonly defaultNextStepId = "step_08_haven_redirect";
	public readonly defaultRedirectUrl =
		"https://echoarchive.org/unlisted_lagoon.html";
	public readonly defaultPasscode = "WHN";
	public readonly defaultMaxAttempts = 4;

	// In-memory fallback if state-service is temporarily offline
	private localAttempts = new Map<string, number>();
	private localCompleted = new Set<string>();

	// Backward-compatible dynamic getters
	public get stepId(): string {
		return this.getStepId();
	}

	public get correctPasscode(): string {
		return process.env.ASCII_ART_PASSCODE || this.defaultPasscode;
	}

	public get maxAttempts(): number {
		return parseInt(
			process.env.ASCII_ART_MAX_ATTEMPTS || String(this.defaultMaxAttempts),
			10,
		);
	}

	public get redirectUrl(): string {
		return (
			process.env.ASCII_ART_REDIRECT_URL ||
			process.env.PUZZLE_REDIRECT_URL ||
			this.defaultRedirectUrl
		);
	}

	public static getInstance(): AsciiArtService {
		if (!AsciiArtService.instance) {
			AsciiArtService.instance = new AsciiArtService();
		}
		return AsciiArtService.instance;
	}

	public getStateServiceUrl(): string {
		return process.env.STATE_SERVICE_URL || env.STATE_SERVICE_URL;
	}

	public getStepId(overrideStepId?: string): string {
		return (
			overrideStepId || process.env.ASCII_ART_STEP_ID || this.defaultStepId
		);
	}

	public getNextStepId(overrideNextStepId?: string): string {
		return (
			overrideNextStepId ||
			process.env.ASCII_ART_NEXT_STEP_ID ||
			this.defaultNextStepId
		);
	}

	public clearCache(): void {
		this.localAttempts.clear();
		this.localCompleted.clear();
		this.localWordsearchCompleted.clear();
	}

	private localWordsearchCompleted = new Set<string>();

	public setWordsearchCompleted(userId: string, completed = true): void {
		if (!userId || userId.trim() === "") return;
		const cleanUserId = userId.trim();
		if (completed) {
			this.localWordsearchCompleted.add(cleanUserId);
			this.localAttempts.set(cleanUserId, 0);
		} else {
			this.localWordsearchCompleted.delete(cleanUserId);
		}
	}

	public async isWordsearchCompleted(userId: string): Promise<boolean> {
		if (!userId || userId.trim() === "") {
			return false;
		}

		const cleanUserId = userId.trim();

		// 1. Check local in-memory override
		if (this.localWordsearchCompleted.has(cleanUserId)) {
			return true;
		}

		const wordsearchStepId =
			process.env.WORDSEARCH_STEP_ID || "step_02_wordsearch";

		// 2. Check central state-service authority
		try {
			const stateUrl = `${this.getStateServiceUrl()}/state-api/player/state?userId=${encodeURIComponent(
				cleanUserId,
			)}`;
			const res = await fetch(stateUrl);
			if (res.ok) {
				const data = (await res.json()) as PlayerStateResponse;
				const completedIds: string[] = data.completedStepIds || [];
				if (completedIds.includes(wordsearchStepId)) {
					this.localWordsearchCompleted.add(cleanUserId);
					return true;
				}
			}
		} catch {
			// state-service unreachable or running offline/isolated
		}

		// 3. Check local WordSearchService / Convex DB fallback
		try {
			const isCompleted =
				await wordSearchService.isPuzzleCompletedForUser(cleanUserId);
			if (isCompleted) {
				this.localWordsearchCompleted.add(cleanUserId);
				return true;
			}
		} catch {
			// ignore
		}

		return false;
	}

	public setPasscodeCompleted(userId: string, completed = true): void {
		if (!userId || userId.trim() === "") return;
		const cleanUserId = userId.trim();
		if (completed) {
			this.localCompleted.add(cleanUserId);
		} else {
			this.localCompleted.delete(cleanUserId);
		}
	}

	public async isPasscodeCompleted(userId: string): Promise<boolean> {
		if (!userId || userId.trim() === "") {
			return false;
		}

		const cleanUserId = userId.trim();

		// 1. Check local in-memory override/cache
		if (this.localCompleted.has(cleanUserId)) {
			return true;
		}

		const stepId = this.getStepId();

		// 2. Check central state-service authority
		try {
			const stateUrl = `${this.getStateServiceUrl()}/state-api/player/state?userId=${encodeURIComponent(
				cleanUserId,
			)}`;
			const res = await fetch(stateUrl);
			if (res.ok) {
				const data = (await res.json()) as PlayerStateResponse;
				const completedIds: string[] = data.completedStepIds || [];
				if (completedIds.includes(stepId)) {
					this.localCompleted.add(cleanUserId);
					return true;
				}
			}
		} catch {
			// state-service unreachable or running offline/isolated
		}

		return false;
	}

	public async getStepDefinition(
		stepId: string,
	): Promise<StepDefinitionDoc | null> {
		try {
			const stepDef = await convexService.query("stepDefinitions:getById", {
				id: stepId,
			});
			if (stepDef) return stepDef as StepDefinitionDoc;
		} catch {
			// convexService query failed or running in mock mode
		}
		return null;
	}

	public async resolveStepMetadata(
		stepId: string,
	): Promise<StepDefinitionMetadata> {
		let title = "BlogNET Passcode Input Block";
		let maxAttempts = this.maxAttempts;
		let resetPrerequisiteStepId =
			process.env.RESET_PREREQUISITE_STEP_ID || "step_02_wordsearch";
		let passcode = process.env.ASCII_ART_PASSCODE;

		try {
			const stepDef = await this.getStepDefinition(stepId);
			if (stepDef) {
				if (stepDef.title) title = stepDef.title;
				if (
					stepDef.lockoutPolicy?.maxAttempts &&
					!process.env.ASCII_ART_MAX_ATTEMPTS
				) {
					maxAttempts = stepDef.lockoutPolicy.maxAttempts;
				}
				if (
					stepDef.lockoutPolicy?.resetPrerequisiteStepId &&
					!process.env.RESET_PREREQUISITE_STEP_ID
				) {
					resetPrerequisiteStepId =
						stepDef.lockoutPolicy.resetPrerequisiteStepId;
				}
				if (stepDef.unlockPayload?.passcode && !passcode) {
					passcode = String(stepDef.unlockPayload.passcode)
						.trim()
						.toUpperCase();
				}
			}
		} catch {
			// ignore
		}

		if (!passcode) {
			passcode = this.defaultPasscode;
		}

		return {
			id: stepId,
			title,
			maxAttempts,
			resetPrerequisiteStepId,
			passcode,
		};
	}

	public appendUserId(url: string, userId?: string): string {
		if (!userId || userId.trim() === "") {
			return url;
		}
		try {
			const isRelative =
				!url.startsWith("http://") && !url.startsWith("https://");
			const parsed = new URL(url, "http://localhost");
			parsed.searchParams.set("userId", userId.trim());
			if (isRelative) {
				return `${parsed.pathname}${parsed.search}`;
			}
			return parsed.toString();
		} catch {
			const sep = url.includes("?") ? "&" : "?";
			return `${url}${sep}userId=${encodeURIComponent(userId.trim())}`;
		}
	}

	public async resolveDestinationUrl(options: {
		userId?: string;
		nextStepId?: string;
		unlockedPayloads?: Record<string, unknown>;
	}): Promise<string> {
		// Environment override takes highest priority for deployment customization
		const envUrl =
			process.env.ASCII_ART_REDIRECT_URL || process.env.PUZZLE_REDIRECT_URL;
		if (envUrl) {
			return this.appendUserId(envUrl, options.userId);
		}

		const nextStepId = options.nextStepId || this.getNextStepId();

		// 1. Check unlockedPayloads from state-service complete / projection
		if (options.unlockedPayloads) {
			const direct = options.unlockedPayloads[nextStepId] as
				| { url?: string }
				| undefined;
			if (
				direct &&
				typeof direct === "object" &&
				typeof direct.url === "string"
			) {
				return this.appendUserId(direct.url, options.userId);
			}
			for (const val of Object.values(options.unlockedPayloads)) {
				if (
					val &&
					typeof val === "object" &&
					"url" in val &&
					typeof (val as { url: unknown }).url === "string"
				) {
					return this.appendUserId(
						(val as { url: string }).url,
						options.userId,
					);
				}
			}
		}

		// 2. Query player state from state-service if userId provided
		if (options.userId) {
			try {
				const stateUrl = `${this.getStateServiceUrl()}/state-api/player/state?userId=${encodeURIComponent(
					options.userId,
				)}`;
				const res = await fetch(stateUrl);
				if (res.ok) {
					const state = (await res.json()) as PlayerStateResponse;
					if (state.unlockedPayloads) {
						const direct = state.unlockedPayloads[nextStepId] as
							| { url?: string }
							| undefined;
						if (
							direct &&
							typeof direct === "object" &&
							typeof direct.url === "string"
						) {
							return this.appendUserId(direct.url, options.userId);
						}
						for (const val of Object.values(state.unlockedPayloads)) {
							if (
								val &&
								typeof val === "object" &&
								"url" in val &&
								typeof (val as { url: unknown }).url === "string"
							) {
								return this.appendUserId(
									(val as { url: string }).url,
									options.userId,
								);
							}
						}
					}
				}
			} catch {
				// state-service unreachable
			}
		}

		// 3. Query next step definition directly from Convex/manifest
		try {
			const nextStepDef = await this.getStepDefinition(nextStepId);
			if (nextStepDef?.unlockPayload?.url) {
				return this.appendUserId(nextStepDef.unlockPayload.url, options.userId);
			}
		} catch {
			// ignore
		}

		// 4. Query redirectUrl table in Convex
		try {
			const redirectData = (await convexService.query("redirectUrl:get", {
				type: "puzzle-asciiart",
			})) as { url?: string } | null;
			if (redirectData?.url) {
				return this.appendUserId(redirectData.url, options.userId);
			}
		} catch {
			// ignore
		}

		// 5. Fallback default
		return this.appendUserId(this.defaultRedirectUrl, options.userId);
	}

	public getAsciiArtDiagram(): string {
		return [
			"  SCORE: 01980          HI-SCORE: 99990          WAVES: 03",
			" =========================================================",
			"",
			" WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
			" WWWWWW                  WWWWWWWWWWWW                  WW",
			" WWWWWWWWWW              WWWWWWWWWW",
			"",
			"                     NNNNNNNNNNNNNNNNNNNN",
			"                 NNNNNNNNNNNNNNNNNNNNNNNNNNNN",
			"                 NNNNNNNN            NNNNNNNN",
			"                 NNNNNNNN            NNNNNNNN",
			"                 NNNNNNNNNNNNNNNNNNNNNNNNNNNN",
			"                     NNNNNNNN    NNNNNNNN",
			"                     NNNNNNNN    NNNNNNNN",
			"",
			"                             HHHHHHHHHHHH",
			"                     HHHHHHHHHHHHHHHHHHHHHHHHHHHH",
			"                     HHHHHHHH            HHHHHHHH",
			"                     HHHHHHHHHHHHHHHHHHHHHHHHHHHH",
			" =========================================================",
			" LIVES: [♥] [♥] [ ] (2 LEFT)                    CREDITS: 00",
		].join("\n");
	}

	async getPuzzleState(
		userId: string,
		overrideStepId?: string,
	): Promise<AsciiArtPuzzleState> {
		const stepId = this.getStepId(overrideStepId);
		const metadata = await this.resolveStepMetadata(stepId);

		let status: "UNLOCKED" | "IN_PROGRESS" | "LOCKED_OUT" | "COMPLETED" =
			"UNLOCKED";
		let attempts = this.localAttempts.get(userId) || 0;
		let isCompleted = this.localCompleted.has(userId);
		let dynamicUnlockedPayloads: Record<string, unknown> | undefined;

		try {
			const stateUrl = `${this.getStateServiceUrl()}/state-api/player/state?userId=${encodeURIComponent(
				userId,
			)}`;
			const res = await fetch(stateUrl);
			if (res.ok) {
				const data = (await res.json()) as PlayerStateResponse;
				dynamicUnlockedPayloads = data.unlockedPayloads;
				const completedIds: string[] = data.completedStepIds || [];
				if (completedIds.includes(stepId)) {
					isCompleted = true;
					status = "COMPLETED";
					this.localCompleted.add(userId);
				} else if (data.activeStep && data.activeStep.id === stepId) {
					status = data.activeStep.status;
					attempts = data.activeStep.attempts || 0;
					this.localAttempts.set(userId, attempts);
					if (data.activeStep.maxAttempts) {
						metadata.maxAttempts = data.activeStep.maxAttempts;
					}
				} else if (data.nextAvailableSteps) {
					const step = data.nextAvailableSteps.find((s) => s.id === stepId);
					if (step) {
						status = step.status;
					}
				}
			}
		} catch (err) {
			console.warn(
				`[AsciiArtService] Could not reach state-service for user ${userId}, using local state fallback:`,
				err,
			);
		}

		const isLockedOut =
			status === "LOCKED_OUT" || attempts >= metadata.maxAttempts;

		const recalibrateUrl =
			metadata.resetPrerequisiteStepId === "step_02_wordsearch"
				? `/wordsearch/puzzle?userId=${encodeURIComponent(userId)}`
				: `/wordsearch/puzzle?userId=${encodeURIComponent(
						userId,
					)}&resetStep=${encodeURIComponent(metadata.resetPrerequisiteStepId)}`;

		let redirectUrl: string | undefined;
		if (isCompleted) {
			redirectUrl = await this.resolveDestinationUrl({
				userId,
				nextStepId: this.getNextStepId(),
				unlockedPayloads: dynamicUnlockedPayloads,
			});
		}

		const isPrerequisiteMet =
			!isLockedOut && (await this.isWordsearchCompleted(userId));

		return {
			userId,
			stepId,
			title: metadata.title,
			status: isLockedOut ? "LOCKED_OUT" : isCompleted ? "COMPLETED" : status,
			attempts,
			maxAttempts: metadata.maxAttempts,
			isLockedOut,
			isCompleted,
			isPrerequisiteMet,
			hint: "Examine the alien sprite tiers in the ASCII diagram. Notice the dominant characters forming each invader wave.",
			asciiArt: this.getAsciiArtDiagram(),
			redirectUrl,
			resetPrerequisiteStepId: metadata.resetPrerequisiteStepId,
			recalibrateUrl,
		};
	}

	async validatePasscode(
		userId: string,
		passcode: string,
		overrideStepId?: string,
	): Promise<ValidatePasscodeResult> {
		const stepId = this.getStepId(overrideStepId);
		const metadata = await this.resolveStepMetadata(stepId);
		const currentState = await this.getPuzzleState(userId, stepId);

		const recalibrateUrl =
			currentState.recalibrateUrl ||
			`/wordsearch/puzzle?userId=${encodeURIComponent(userId)}`;

		if (!currentState.isPrerequisiteMet) {
			return {
				success: false,
				completed: false,
				stepId,
				attempts: currentState.attempts,
				maxAttempts: metadata.maxAttempts,
				isLockedOut: currentState.isLockedOut,
				isPrerequisiteMet: false,
				message: currentState.isLockedOut
					? `SECURITY LOCKOUT: Maximum attempts exceeded (${metadata.maxAttempts}/${metadata.maxAttempts}). You must re-solve the prerequisite puzzle to clear lockout.`
					: "Access Denied: Prerequisite investigation (Recovered Notebook Wordsearch) has not been completed.",
				resetPrerequisiteStepId: metadata.resetPrerequisiteStepId,
				recalibrateUrl,
			};
		}

		if (currentState.isLockedOut) {
			this.localWordsearchCompleted.delete(userId);
			await wordSearchService.resetPuzzleForUser(userId);
			return {
				success: false,
				completed: false,
				stepId,
				attempts: metadata.maxAttempts,
				maxAttempts: metadata.maxAttempts,
				isLockedOut: true,
				isPrerequisiteMet: false,
				message: `SECURITY LOCKOUT: Maximum attempts exceeded (${metadata.maxAttempts}/${metadata.maxAttempts}). You must re-solve the prerequisite puzzle to clear lockout.`,
				resetPrerequisiteStepId: metadata.resetPrerequisiteStepId,
				recalibrateUrl,
			};
		}

		const cleanInput = (passcode || "").trim().toUpperCase();
		const correctCode = (metadata.passcode || this.correctPasscode)
			.trim()
			.toUpperCase();
		const isMatch = cleanInput === correctCode;

		if (isMatch) {
			this.localCompleted.add(userId);
			this.localAttempts.delete(userId);

			let returnedPayloads: Record<string, unknown> | undefined;

			// Notify central state-service of Step completion
			try {
				const completeRes = await fetch(
					`${this.getStateServiceUrl()}/state-api/player/step/complete`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							userId,
							stepId,
							customData: { passcode: correctCode },
						}),
					},
				);
				if (completeRes.ok) {
					const compData = (await completeRes.json()) as PlayerStateResponse;
					returnedPayloads = compData.unlockedPayloads;
				}
			} catch (err) {
				console.warn(
					`[AsciiArtService] Error notifying state-service of completion:`,
					err,
				);
			}

			const redirectUrl = await this.resolveDestinationUrl({
				userId,
				nextStepId: this.getNextStepId(),
				unlockedPayloads: returnedPayloads,
			});

			return {
				success: true,
				completed: true,
				stepId,
				attempts: currentState.attempts,
				maxAttempts: metadata.maxAttempts,
				isLockedOut: false,
				message: `ACCESS GRANTED // Passcode sequence [${correctCode.split("").join(" - ")}] accepted. Next sector unlocked.`,
				redirectUrl,
			};
		} else {
			let newAttempts = currentState.attempts + 1;
			this.localAttempts.set(userId, newAttempts);
			let isNowLockedOut = newAttempts >= metadata.maxAttempts;

			// Notify central state-service of failure to increment attempt counter
			try {
				const failRes = await fetch(
					`${this.getStateServiceUrl()}/state-api/player/step/fail`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ userId, stepId }),
					},
				);
				if (failRes.ok) {
					const failData = (await failRes.json()) as StepFailResponse;
					if (failData.activeStep && failData.activeStep.id === stepId) {
						newAttempts = failData.activeStep.attempts;
						const max = failData.activeStep.maxAttempts || metadata.maxAttempts;
						isNowLockedOut =
							failData.activeStep.status === "LOCKED_OUT" || newAttempts >= max;
						this.localAttempts.set(userId, newAttempts);
					}
				}
			} catch (err) {
				console.warn(
					`[AsciiArtService] Error notifying state-service of failure:`,
					err,
				);
			}

			if (isNowLockedOut) {
				this.localWordsearchCompleted.delete(userId);
				await wordSearchService.resetPuzzleForUser(userId);
			}

			const remaining = Math.max(0, metadata.maxAttempts - newAttempts);
			return {
				success: false,
				completed: false,
				stepId,
				attempts: newAttempts,
				maxAttempts: metadata.maxAttempts,
				isLockedOut: isNowLockedOut,
				isPrerequisiteMet: !isNowLockedOut,
				message: isNowLockedOut
					? `SECURITY LOCKOUT TRIGGERED: ${metadata.maxAttempts}/${metadata.maxAttempts} failed attempts. The input block is locked. You must re-solve the prerequisite puzzle to recalibrate security clearance.`
					: `ACCESS DENIED: Invalid passcode sequence. ${remaining} attempt(s) remaining before lockout.`,
				resetPrerequisiteStepId: metadata.resetPrerequisiteStepId,
				recalibrateUrl,
			};
		}
	}
}

export default AsciiArtService.getInstance();
