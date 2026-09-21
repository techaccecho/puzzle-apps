export abstract class BaseApiService {
	protected handleError(reply: any, error: any) {
		console.error(`[${this.constructor.name}] Error:`, error);
		reply.status(error.status || 500).send({
			success: false,
			message: error.message || "Internal Server Error",
		});
	}

	protected sendResponse(reply: any, data: any, status = 200) {
		reply.status(status).send({
			success: true,
			data,
		});
	}
}
