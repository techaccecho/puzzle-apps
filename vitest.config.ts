import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		env: {
			NODE_ENV: "test",
			PORT: "3005",
			CONVEX_URL: "https://flippant-sardine-31.eu-west-1.convex.cloud",
			API_BASE_URL: "http://localhost:3005/v1/api",
			STATE_SERVICE_URL: "http://localhost:3004",
		},
	},
});
