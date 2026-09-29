import { ConvexHttpClient } from "convex/browser";
import { env } from "../../config/env.js";
import { BaseApiService } from "../BaseApiService.js";

class ConvexService extends BaseApiService {
	private client: ConvexHttpClient;

	constructor(client?: ConvexHttpClient) {
		super();
		if (client) {
			this.client = client;
		} else {
			if (!env.CONVEX_URL || env.CONVEX_URL.trim() === "") {
				throw new Error(
					"CONVEX_URL environment variable is required. Mock mode has been disabled.",
				);
			}
			this.client = new ConvexHttpClient(env.CONVEX_URL);
		}
	}

	setClient(client: ConvexHttpClient) {
		this.client = client;
	}

	getClient(): ConvexHttpClient {
		return this.client;
	}

	public mapFunctionPath(name: string): string {
		const mapping: Record<string, string> = {
			// Puzzles
			"puzzle:wordsearch:create": "puzzles:create",
			"puzzle:wordsearch:getById": "puzzles:getById",
			"puzzle:wordsearch:getByUserId": "puzzles:getByUserId",
			"puzzle:wordsearch:updateProgress": "puzzles:updateProgress",
			"puzzle:wordsearch:reset": "puzzles:reset",
			"puzzle:wordsearch:list": "puzzles:list",
			// Short URLs
			"urlShorter:create": "urlShortener:create",
			"urlShorter:getByCode": "urlShortener:getByCode",
			"urlShorter:getByUser": "urlShortener:getByUser",
			"urlShorter:list": "urlShortener:list",
			// Redirect URLs
			"redirectUrl:store": "redirectUrls:store",
			"redirectUrl:update": "redirectUrls:update",
			"redirectUrl:delete": "redirectUrls:deleteUrl",
			"redirectUrl:get": "redirectUrls:get",
			"redirectUrl:list": "redirectUrls:list",
			// Service Mappings
			"serviceMapping:store": "serviceMappings:store",
			"serviceMapping:get": "serviceMappings:get",
			"serviceMapping:delete": "serviceMappings:deleteMapping",
			"serviceMapping:list": "serviceMappings:list",
			// Dictionary
			"dictionary:add": "dictionary:add",
			"dictionary:update": "dictionary:update",
			"dictionary:get": "dictionary:get",
			"dictionary:list": "dictionary:list",
			// Step Definitions
			"stepDefinitions:getById": "stepDefinitions:getById",
			"stepDefinitions:list": "stepDefinitions:list",
			"stepDefinitions:listAll": "stepDefinitions:listAll",
		};
		return mapping[name] || name;
	}

	async query(name: string, args: any = {}): Promise<any> {
		const convexPath = this.mapFunctionPath(name);
		try {
			return await this.client.query(convexPath as any, args);
		} catch (error) {
			console.error(`Convex Query Error [${name} -> ${convexPath}]:`, error);
			throw error;
		}
	}

	async mutation(name: string, args: any = {}): Promise<any> {
		const convexPath = this.mapFunctionPath(name);
		try {
			return await this.client.mutation(convexPath as any, args);
		} catch (error) {
			console.error(`Convex Mutation Error [${name} -> ${convexPath}]:`, error);
			throw error;
		}
	}
}

export { ConvexService };
export default new ConvexService();
