import Fastify from "fastify";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import apiRoutes from "./routes/api.js";
import errorUtil from "./errors/ErrorUtil.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true,
});

// Register Swagger
await fastify.register(fastifySwagger, {
  swagger: {
    info: {
      title: "Echo Backend API",
      description: "API documentation for Echo Backend",
      version: "1.0.0",
    },
    host: "localhost:3000",
    schemes: ["http"],
    consumes: ["application/json"],
    produces: ["application/json"],
  },
});

await fastify.register(fastifySwaggerUi, {
  routePrefix: "/api-docs",
  uiConfig: {
    docExpansion: "full",
    deepLinking: false,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
});

fastify.get("/", async (request, reply) => {
  const filePath = path.join(__dirname, ".", "fe/home.html");
  const content = fs.readFileSync(filePath, "utf8");
  reply.type("text/html").send(content);
});

// Serve wordsearch.html at the specified path
fastify.get("/wordsearch/puzzle", async (request, reply) => {
  const { userId } = request.query as { userId?: string };
  
  if (!userId) {
    const errorPath = path.join(__dirname, ".", "fe/error.html");
    let errorContent = fs.readFileSync(errorPath, "utf8");

    let message = "A valid 'userId' parameter is required to access the puzzle."
    errorContent = await errorUtil.createErrorContent(errorContent, "400 Bad Request",
        "Something went wrong");

    console.error(message);

    reply.status(400).type("text/html").send(errorContent);
    return;
  }

  const filePath = path.join(__dirname, ".", "fe/word-search/wordsearch.html");
  let content = fs.readFileSync(filePath, "utf8");
  
  const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3000/v1/api";
  content = content.replace("{{API_BASE_URL}}", apiBaseUrl);
  
  reply.type("text/html").send(content);
});

// Register API routes
fastify.register(apiRoutes, { prefix: "/v1/api" });

// Start the server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
