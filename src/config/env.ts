import "dotenv/config";

export interface AppConfig {
	PORT: number;
	CONVEX_URL: string;
	API_BASE_URL: string;
	STATE_SERVICE_URL: string;
	NODE_ENV: string;
	WORDSEARCH_STEP_ID: string;
	ASCII_ART_PASSCODE?: string;
	ASCII_ART_MAX_ATTEMPTS?: number;
	ASCII_ART_REDIRECT_URL?: string;
	ASCII_ART_STEP_ID?: string;
	ASCII_ART_NEXT_STEP_ID?: string;
	RESET_PREREQUISITE_STEP_ID?: string;
}

const REQUIRED_ENV_VARS = [
	"CONVEX_URL",
	"PORT",
	"API_BASE_URL",
	"STATE_SERVICE_URL",
] as const;

export function validateEnv(
	customEnv?: Record<string, string | undefined>,
): AppConfig {
	const source = customEnv || process.env;
	const missingVars: string[] = [];

	for (const key of REQUIRED_ENV_VARS) {
		const val = source[key];
		if (!val || val.trim() === "") {
			missingVars.push(key);
		}
	}

	if (missingVars.length > 0) {
		throw new Error(
			`Missing required environment variable(s): ${missingVars.join(", ")}. ` +
				"Mock mode has been disabled. All required environment variables must be provided.",
		);
	}

	const port = Number.parseInt(source.PORT!, 10);
	if (Number.isNaN(port) || port <= 0 || port > 65535) {
		throw new Error(
			`Invalid environment variable PORT: '${source.PORT}'. Must be a valid port number between 1 and 65535.`,
		);
	}

	const validateUrl = (key: string, val: string) => {
		try {
			const parsed = new URL(val);
			if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
				throw new Error("Protocol must be http or https");
			}
		} catch {
			throw new Error(
				`Invalid environment variable ${key}: '${val}'. Must be a valid HTTP or HTTPS URL.`,
			);
		}
	};

	validateUrl("CONVEX_URL", source.CONVEX_URL!);
	validateUrl("API_BASE_URL", source.API_BASE_URL!);
	validateUrl("STATE_SERVICE_URL", source.STATE_SERVICE_URL!);

	return {
		PORT: port,
		CONVEX_URL: source.CONVEX_URL!.trim(),
		API_BASE_URL: source.API_BASE_URL!.trim(),
		STATE_SERVICE_URL: source.STATE_SERVICE_URL!.trim(),
		NODE_ENV: source.NODE_ENV?.trim() || "development",
		WORDSEARCH_STEP_ID:
			source.WORDSEARCH_STEP_ID?.trim() || "step_02_wordsearch",
		ASCII_ART_PASSCODE: source.ASCII_ART_PASSCODE?.trim(),
		ASCII_ART_MAX_ATTEMPTS: source.ASCII_ART_MAX_ATTEMPTS
			? Number.parseInt(source.ASCII_ART_MAX_ATTEMPTS, 10)
			: undefined,
		ASCII_ART_REDIRECT_URL:
			source.ASCII_ART_REDIRECT_URL?.trim() ||
			source.PUZZLE_REDIRECT_URL?.trim(),
		ASCII_ART_STEP_ID: source.ASCII_ART_STEP_ID?.trim(),
		ASCII_ART_NEXT_STEP_ID: source.ASCII_ART_NEXT_STEP_ID?.trim(),
		RESET_PREREQUISITE_STEP_ID: source.RESET_PREREQUISITE_STEP_ID?.trim(),
	};
}

let cachedConfig: AppConfig | null = null;

export function getEnv(): AppConfig {
	if (!cachedConfig) {
		cachedConfig = validateEnv();
	}
	return cachedConfig;
}

export const env: AppConfig = getEnv();
