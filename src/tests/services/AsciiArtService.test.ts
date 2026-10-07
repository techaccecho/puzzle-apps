import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import asciiArtService from "../../services/ascii-art/AsciiArtService.js";
import convexService from "../../services/convex/ConvexService.js";

describe("AsciiArtService", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.restoreAllMocks();
		asciiArtService.clearCache();
		process.env = { ...originalEnv };
		// Pre-authorize test users for passcode validation tests
		asciiArtService.setWordsearchCompleted("test-user-2");
		asciiArtService.setWordsearchCompleted("test-user-case");
		asciiArtService.setWordsearchCompleted("test-user-dynamic-url");
		asciiArtService.setWordsearchCompleted("test-user-dynamic-passcode");
		asciiArtService.setWordsearchCompleted("test-user-3");
		asciiArtService.setWordsearchCompleted("test-user-lockout");

		vi.spyOn(convexService, "query").mockImplementation(
			async (name, args?: Record<string, unknown>) => {
				if (name === "stepDefinitions:getById") {
					if (args?.id === "step_07_passcode") {
						return {
							id: "step_07_passcode",
							title: "Passcode",
							unlockPayload: { passcode: "WHN" },
							lockoutPolicy: {
								maxAttempts: 4,
								resetPrerequisiteStepId: "step_02_wordsearch",
							},
						};
					}
					return null;
				}
				return null;
			},
		);
		vi.spyOn(convexService, "mutation").mockResolvedValue({
			success: true,
		});
		vi.stubGlobal(
			"fetch",
			vi.fn().mockRejectedValue(new Error("state-service offline in tests")),
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		process.env = { ...originalEnv };
	});

	describe("Wordsearch Prerequisite Verification", () => {
		test("isWordsearchCompleted returns false when user has not completed wordsearch", async () => {
			const completed =
				await asciiArtService.isWordsearchCompleted("uncompleted-user");
			expect(completed).toBe(false);
		});

		test("isWordsearchCompleted returns true when marked complete in local cache", async () => {
			asciiArtService.setWordsearchCompleted("completed-user");
			const completed =
				await asciiArtService.isWordsearchCompleted("completed-user");
			expect(completed).toBe(true);
		});

		test("blocks passcode validation if wordsearch prerequisite is not completed", async () => {
			const result = await asciiArtService.validatePasscode(
				"uncompleted-player",
				"NHW",
			);
			expect(result.success).toBe(false);
			expect(result.completed).toBe(false);
			expect(result.isPrerequisiteMet).toBe(false);
			expect(result.message).toContain("Access Denied: Prerequisite");
			expect(result.recalibrateUrl).toContain("uncompleted-player");
		});
	});

	describe("getPuzzleState", () => {
		test("returns initial puzzle state with maxAttempts = 4", async () => {
			const state = await asciiArtService.getPuzzleState("test-user-1");
			expect(state).toBeDefined();
			expect(state.userId).toBe("test-user-1");
			expect(state.stepId).toBe("step_07_passcode");
			expect(state.maxAttempts).toBe(4);
			expect(state.attempts).toBe(0);
			expect(state.isLockedOut).toBe(false);
			expect(state.isCompleted).toBe(false);
			expect(state.asciiArt).toContain("SCORE");
			expect(state.asciiArt).toContain("NNNNNNNN");
		});

		test("dynamically accommodates custom stepId and maxAttempts via environment", async () => {
			process.env.ASCII_ART_STEP_ID = "custom_step_passcode";
			process.env.ASCII_ART_MAX_ATTEMPTS = "8";

			const state = await asciiArtService.getPuzzleState("test-user-custom");
			expect(state.stepId).toBe("custom_step_passcode");
			expect(state.maxAttempts).toBe(8);
		});
	});

	describe("validatePasscode", () => {
		test("accepts correct passcode 'WHN' and marks puzzle complete", async () => {
			const result = await asciiArtService.validatePasscode(
				"test-user-2",
				"WHN",
			);
			expect(result.success).toBe(true);
			expect(result.completed).toBe(true);
			expect(result.isLockedOut).toBe(false);
			expect(result.redirectUrl).toBe(
				"https://echoarchive.org/unlisted_lagoon.html?userId=test-user-2",
			);
			expect(result.message).toContain("ACCESS GRANTED");
		});

		test("accepts lowercase 'whn' (case-insensitive)", async () => {
			const result = await asciiArtService.validatePasscode(
				"test-user-case",
				"whn",
			);
			expect(result.success).toBe(true);
			expect(result.completed).toBe(true);
			expect(result.redirectUrl).toBe(
				"https://echoarchive.org/unlisted_lagoon.html?userId=test-user-case",
			);
		});

		test("dynamically accommodates changes in redirect URL without code modification", async () => {
			process.env.ASCII_ART_REDIRECT_URL =
				"https://echoarchive.org/updated_destination_v2.html";

			const result = await asciiArtService.validatePasscode(
				"test-user-dynamic-url",
				"WHN",
			);
			expect(result.success).toBe(true);
			expect(result.redirectUrl).toBe(
				"https://echoarchive.org/updated_destination_v2.html?userId=test-user-dynamic-url",
			);
		});

		test("passes userId to redirect URL for ARG state management", async () => {
			const destinationUrl = await asciiArtService.resolveDestinationUrl({
				userId: "player_state_mgmt_123",
			});
			expect(destinationUrl).toContain("userId=player_state_mgmt_123");
		});

		test("prioritizes redirectUrl from Convex redirectUrls table over manifest / default", async () => {
			vi.spyOn(convexService, "query").mockImplementation(
				async (name, args?: Record<string, unknown>) => {
					if (name === "stepDefinitions:getById") {
						return {
							id: "step_07_passcode",
							title: "Passcode",
							unlockPayload: { passcode: "WHN" },
							lockoutPolicy: { maxAttempts: 4 },
						};
					}
					if (name === "redirectUrl:get" && args?.type === "puzzle-asciiart") {
						return {
							url: "http://localhost:3000/unlisted_lagoon.html",
							type: "puzzle-asciiart",
						};
					}
					return null;
				},
			);

			const result = await asciiArtService.validatePasscode(
				"test-user-2",
				"WHN",
			);
			expect(result.success).toBe(true);
			expect(result.redirectUrl).toBe(
				"http://localhost:3000/unlisted_lagoon.html?userId=test-user-2",
			);
		});

		test("honors serviceMapping when resolving redirectUrl from Convex", async () => {
			vi.spyOn(convexService, "query").mockImplementation(
				async (name, args?: Record<string, unknown>) => {
					if (name === "stepDefinitions:getById") {
						return {
							id: "step_07_passcode",
							title: "Passcode",
							unlockPayload: { passcode: "WHN" },
							lockoutPolicy: { maxAttempts: 4 },
						};
					}
					if (
						name === "serviceMapping:get" &&
						args?.serviceName === "ascii-art"
					) {
						return { redirectUrlType: "custom-haven-redirect" };
					}
					if (
						name === "redirectUrl:get" &&
						args?.type === "custom-haven-redirect"
					) {
						return {
							url: "https://custom-archive.example.org/haven",
							type: "custom-haven-redirect",
						};
					}
					return null;
				},
			);

			const result = await asciiArtService.validatePasscode(
				"test-user-2",
				"WHN",
			);
			expect(result.success).toBe(true);
			expect(result.redirectUrl).toBe(
				"https://custom-archive.example.org/haven?userId=test-user-2",
			);
		});

		test("dynamically accommodates changes in passcode without code modification", async () => {
			process.env.ASCII_ART_PASSCODE = "XYZ";

			const result = await asciiArtService.validatePasscode(
				"test-user-dynamic-passcode",
				"XYZ",
			);
			expect(result.success).toBe(true);
			expect(result.completed).toBe(true);
		});

		test("increments attempts on invalid passcode", async () => {
			const result = await asciiArtService.validatePasscode(
				"test-user-3",
				"XYZ",
			);
			expect(result.success).toBe(false);
			expect(result.completed).toBe(false);
			expect(result.attempts).toBe(1);
			expect(result.isLockedOut).toBe(false);
			expect(result.message).toContain("ACCESS DENIED");
			expect(result.message).toContain("3 attempt(s) remaining");
		});

		test("triggers lockout after 4 failed attempts", async () => {
			const userId = "test-user-lockout";
			for (let i = 1; i <= 3; i++) {
				const res = await asciiArtService.validatePasscode(userId, `BAD${i}`);
				expect(res.success).toBe(false);
				expect(res.isLockedOut).toBe(false);
				expect(res.attempts).toBe(i);
			}

			// 4th attempt should lock out
			const fourth = await asciiArtService.validatePasscode(userId, "WRONG");
			expect(fourth.success).toBe(false);
			expect(fourth.isLockedOut).toBe(true);
			expect(fourth.attempts).toBe(4);
			expect(fourth.message).toContain("SECURITY LOCKOUT");

			// Lockout should have reset the wordsearch prerequisite
			const isWordsearchStillComplete =
				await asciiArtService.isWordsearchCompleted(userId);
			expect(isWordsearchStillComplete).toBe(false);

			// Re-completing the wordsearch prerequisite clears the lockout
			asciiArtService.setWordsearchCompleted(userId, true);
			const stateAfterReComplete = await asciiArtService.getPuzzleState(userId);
			expect(stateAfterReComplete.isLockedOut).toBe(false);
			expect(stateAfterReComplete.attempts).toBe(0);
			expect(stateAfterReComplete.isPrerequisiteMet).toBe(true);

			// User can now enter the correct passcode and succeed
			const retrySuccess = await asciiArtService.validatePasscode(
				userId,
				"WHN",
			);
			expect(retrySuccess.success).toBe(true);
			expect(retrySuccess.completed).toBe(true);
			expect(retrySuccess.isLockedOut).toBe(false);
		});
	});
});
