import Fastify from "fastify";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyStatic from "@fastify/static";
import apiRoutes from "./routes/api.js";
import errorUtil from "./errors/error-util.js";

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

// Serve assets
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, "fe/assets"),
  prefix: "/assets/",
});

fastify.get("/", async (request, reply) => {
  const filePath = path.join(__dirname, ".", "fe/home.html");
  const content = fs.readFileSync(filePath, "utf8");
  reply.type("text/html").send(content);
});

fastify.get("/admin", async (request, reply) => {
  const filePath = path.join(__dirname, ".", "fe/admin/admin.html");
  let content = fs.readFileSync(filePath, "utf8");

  const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3000/v1/api";
  content = content.replace(/{{API_BASE_URL}}/g, apiBaseUrl);

  reply.type("text/html").send(content);
});

// Serve wordsearch.html at the specified path
fastify.get("/wordsearch/puzzle", async (request, reply) => {
  const { userId } = request.query as { userId?: string };
  
  if (!userId) {
    const errorPath = path.join(__dirname, ".", "fe/error.html");
    let errorContent = fs.readFileSync(errorPath, "utf8");

    errorContent = await errorUtil.createErrorContent(errorContent, "400 Bad Request",
        "A valid 'userId' parameter is required to access the puzzle.");

    reply.status(400).type("text/html").send(errorContent);
    return;
  }

  const filePath = path.join(__dirname, ".", "fe/word-search/wordsearch.html");
  let content = fs.readFileSync(filePath, "utf8");
  
  const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3000/v1/api";
  content = content.replace(/{{API_BASE_URL}}/g, apiBaseUrl);
  
  reply.type("text/html").send(content);
});

fastify.get("/asciiart/puzzle", async (request, reply) => {
  const errorPath = path.join(__dirname, ".", "fe/error.html");
  let errorContent = fs.readFileSync(errorPath, "utf8");

  errorContent = await errorUtil.createErrorContent(
    errorContent,
    "Coming Soon",
    "The ASCII Art puzzle is currently under development. Please check back later!"
  );

  reply.type("text/html").send(errorContent);
});

// Register API routes
fastify.register(apiRoutes, { prefix: "/v1/api" });

// Handle 404
fastify.setNotFoundHandler(async (request, reply) => {
  // For API routes, return JSON
  if (request.url.startsWith("/v1/api")) {
    reply.status(404).send({
      message: `Route ${request.method}:${request.url} not found`,
      error: "Not Found",
      statusCode: 404
    });
    return;
  }

  const errorPath = path.join(__dirname, ".", "fe/error.html");
  let errorContent = fs.readFileSync(errorPath, "utf8");

  errorContent = await errorUtil.createErrorContent(
    errorContent,
    "404 Not Found",
    `The requested path '${request.url}' could not be found in our systems.`
  );

  reply.status(404).type("text/html").send(errorContent);
});

// Handle global errors
fastify.setErrorHandler(async (error: any, request, reply) => {
  fastify.log.error(error);

  // For API routes, return JSON
  if (request.url.startsWith("/v1/api")) {
    reply.status(error.statusCode || 500).send({
      message: error.message,
      error: error.name,
      statusCode: error.statusCode || 500
    });
    return;
  }

  const errorPath = path.join(__dirname, ".", "fe/error.html");
  let errorContent = fs.readFileSync(errorPath, "utf8");

  errorContent = await errorUtil.createErrorContent(
    errorContent,
    "500 Server Error",
    "An unexpected error occurred. Please try again later."
  );

  reply.status(error.statusCode || 500).type("text/html").send(errorContent);
});

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
