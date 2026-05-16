# Puzzle apps

A multi-service Fastify backend for a Wordsearch game with TypeScript, URL shortening, and dictionary management.

## Features

- **Wordsearch Puzzle Service**: Generates puzzles with words dynamically selected based on a unique secret code. Features backend-driven grid generation for enhanced security.
- **Security-First Design**: Prevents cheating by obfuscating word data, hiding the secret short URL until completion, and performing all word validations on the server side.
- **URL Shortener Service**: Generates unique, 7-letter alphabetic codes with non-repeating letters that redirect to a configurable reward URL.
- **Dictionary Service**: Manages a repository of 500+ words and tricky questions/clues (riddles and metaphors) for varied difficulty, ensuring coverage for every letter of the alphabet.
- **Admin API**: Full CRUD capabilities for dictionary entries, type-based redirect URL management, and dynamic service mappings. Includes overviews for active puzzles and generated short URLs.
- **Convex Integration**: Built to work with [Convex](https://www.convex.dev/), with a robust built-in mock mode for local development. Supports server-side caching for redirect URLs and global listings for administrative oversight.
- **Integrated Frontend**: Serves a minimalistic home page, the Wordsearch game, and a comprehensive Admin Dashboard. Features a classic "old school" web aesthetic and themed error handling.
- **Dynamic Service Mapping**: Decouples services from hardcoded redirect URL types by mapping service names to specific redirect configurations in the database.
- **Mandatory User Identification**: Requires a `userId` parameter for all puzzle-related requests to track progress and ensure unique sessions.
- **TypeScript & Fastify**: Modern stack for high performance and type safety.

## Security & Anti-Cheat

To prevent users from finding words by inspecting the browser's source code or network traffic:
- **Server-Side Generation**: The 12x12 grid and word placements are calculated entirely on the backend.
- **Dynamic Selection**: Words are selected from the dictionary such that their first letters form the secret short URL code.
- **Word Obfuscation**: The API response to the client does **not** contain the list of words or the short URL. Instead, it provides a grid of letters and a list of clues.
- **Opaque IDs**: Each clue is associated with an obfuscated ID rather than the word itself.
- **Server-Side Validation**: When a user selects a word, the frontend sends the coordinates to the server, which validates the find against the hidden puzzle state.
- **Secure Completion**: The secret short URL is only revealed via a specialized `/complete` endpoint after all words have been successfully validated.
- **In-Memory Caching**: Active puzzles are cached on the server for ultra-fast validation and efficient session recovery.
- **Final State Persistence**: User progress is saved to the database and synchronized across sessions.
- **Session Persistence**: Progress is automatically restored when a user reloads the page, including struck-through clues and highlighted grid coordinates.

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [NPM](https://www.npmjs.com/) or [PNPM](https://pnpm.io/)

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory:

- `CONVEX_URL`: Your Convex deployment URL. If not provided, the application runs in **Mock Mode** using in-memory storage and pre-seeded data.
- `PORT`: (Optional) The port to run the server on (default: 3000).
- `API_BASE_URL`: The base URL for the API endpoints, used by the frontend (default: `http://localhost:3000/v1/api`).

## Running the Application

### Development Mode
Runs the server with `tsx watch` for auto-reloads:
```bash
npm run dev
```

### Production Build
Compile TypeScript to JavaScript:
```bash
npm run build
```

### Start Production Server
```bash
npm start
```
The application will be available at `http://localhost:3000`.

## Testing
Run the test suite using Vitest:
```bash
npm test
```

## API Documentation

Once the server is running, you can access the interactive Swagger documentation at:
`http://localhost:3000/api-docs`

### Key Endpoints
 
- `GET /`: Serves the Home page.
- `GET /wordsearch/puzzle?userId=ID`: Serves the Wordsearch game (requires `userId`).
- `GET /asciiart/puzzle`: Serves the ASCII Art puzzle (Coming soon).
- `GET /git/puzzle`: Explore the Repository puzzle (Coming soon).
- `GET /v1/api/puzzle/wordSearch?userId=ID`: Generate a new puzzle for the given user.
- `POST /v1/api/puzzle/wordSearch/validate`: Validate a found word using coordinates.
- `GET /v1/api/puzzle/wordSearch/complete`: Retrieve the final short URL after solving the puzzle.
- `GET /v1/api/shortUrl/:shortCode`: Resolve short code and redirect to target URL.
- `GET /v1/api/dictionary`: List dictionary entries with pagination (`cursor` and `numItems`).
- `POST /v1/api/dictionary`: Add a new word-question pair.
- `PATCH /v1/api/dictionary/:id`: Update an existing dictionary entry.
- `GET /v1/api/admin/redirectUrl`: List all configured redirect URLs.
- `POST /v1/api/admin/redirectUrl`: Store or update a redirect URL for a specific type.
- `DELETE /v1/api/admin/redirectUrl/:type`: Delete a redirect URL by type.
- `GET /v1/api/admin/serviceMapping`: List all service-to-redirect-URL mappings.
- `POST /v1/api/admin/serviceMapping`: Create or update a service mapping.
- `DELETE /v1/api/admin/serviceMapping/:serviceName`: Delete a service mapping.
- `GET /v1/api/admin/shortUrls`: List all generated short URLs.
- `GET /v1/api/admin/puzzles`: List all puzzles (supports pagination and filtering).
- `GET /admin`: Web-based dashboard for system administration and monitoring.

### Pagination
The Dictionary API uses cursor-based pagination.
- `items`: Array of entries for the current page.
- `continueCursor`: String to be passed as the `cursor` parameter for the next page.

## Project Structure

- `src/index.ts`: Entry point for the Fastify server.
- `src/routes/`: API route definitions.
- `src/services/`: Core business logic (Puzzle, Dictionary, URL Shortener, Convex).
- `src/fe/`: Frontend HTML files and templates.
  - `src/fe/word-search/wordsearch.html`: The frontend Wordsearch game.
  - `src/fe/home.html`: The landing page.
  - `src/fe/error.html`: The generic error page template.
- `src/tests/`: Vitest test suites.
- `config/`: Configuration files and seed data (`dictionaryData.json`).
- `dist/`: Compiled JavaScript output.

## Development

The project includes a robust mock mode for `ConvexService`. If `CONVEX_URL` is not set, the system will use an internal memory store seeded with 500 words and default configurations, allowing for full functionality without a database connection.
