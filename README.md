# Puzzle apps

A multi-service Fastify backend for a Wordsearch game with TypeScript, URL shortening, and dictionary management.

## Features

- **Wordsearch Puzzle Service**: Generates puzzles with words dynamically selected based on a unique secret code. Features backend-driven grid generation for enhanced security.
- **ASCII Art Passcode Decoder**: Retro CRT terminal puzzle (Sector 07) where players inspect alien sprite waves to decode a secret 3-letter passcode sequence.
- **Anti-Cheat & Lockout Policy**: Enforces strict attempt limits (6 attempts by default). Upon exceeding max attempts, the terminal locks out input and requires completing a designated prerequisite step (Wordsearch) to recalibrate clearance.
- **Dynamic Multi-Tier Configuration**: Decoupled from hardcoded values. Step definitions, passcodes, lockout policies, and destination redirect URLs dynamically resolve from runtime unlocked payloads, player state projections, Convex database definitions, environment variables, or safety fallbacks.
- **Security-First Design**: Prevents cheating by obfuscating word data, hiding secret short URLs and passcodes until completion, and performing all validations on the server side.
- **URL Shortener Service**: Generates unique, 7-letter alphabetic codes with non-repeating letters that redirect to a configurable reward URL.
- **Dictionary Service**: Manages a repository of 500+ words and tricky questions/clues (riddles and metaphors) for varied difficulty, ensuring coverage for every letter of the alphabet.
- **Admin API**: Full CRUD capabilities for dictionary entries, type-based redirect URL management, and dynamic service mappings. Includes overviews for active puzzles and generated short URLs.
- **Convex Integration**: Connects directly to [Convex](https://www.convex.dev/) cloud backend using `ConvexHttpClient`. Mock mode has been disabled to ensure complete data consistency across services.
- **Integrated Frontend**: Serves a minimalistic home page, the Wordsearch game, the CRT ASCII Art terminal, and a comprehensive Admin Dashboard. Features a classic retro aesthetic and themed error handling.
- **Dynamic Service Mapping**: Decouples services from hardcoded redirect URL types by mapping service names to specific redirect configurations in the database.
- **Mandatory User Identification**: Requires a `userId` parameter for all puzzle-related requests to track progress and ensure unique sessions.
- **TypeScript & Fastify**: Modern stack for high performance and type safety.

## Security & Anti-Cheat

To prevent users from finding answers by inspecting the browser's source code or network traffic:
- **Server-Side Generation**: The 12x12 grid, word placements, and passcode verifications are calculated entirely on the backend.
- **Dynamic Selection**: Words are selected from the dictionary such that their first letters form the secret short URL code.
- **Word Obfuscation**: The API response to the client does **not** contain the list of words or the short URL. Instead, it provides a grid of letters and a list of clues.
- **Opaque IDs**: Each clue is associated with an obfuscated ID rather than the word itself.
- **Server-Side Validation**: When a user selects a word or submits a passcode, the server validates the input against the authoritative state.
- **Attempt Tracking & Lockouts**: Passcode attempts are synchronized with `state-service`. 4 failed attempts trigger a hard security lockout.
- **Secure Completion**: Secret destination URLs and unlock payloads are only revealed via authenticated completion routines after successful verification.
- **Final State Persistence**: User progress is saved to Convex and synchronized with the central ARG state engine across sessions.

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [NPM](https://www.npmjs.com/) or [PNPM](https://pnpm.io/)

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration & Environment Variables

The application requires strict environment variable configuration. **Mock mode has been completely disabled**; if any mandatory environment variable is missing or malformed, the server fails fast on startup with a descriptive error.

Create a `.env` file in the root directory (see `.env.example`):

### Mandatory Variables
- `CONVEX_URL`: Your Convex deployment URL (e.g. `https://<deployment>.convex.cloud`).
- `PORT`: Port on which the server listens (e.g. `3005`).
- `API_BASE_URL`: The base URL for API endpoints used by the frontend (e.g. `http://localhost:3005/v1/api`).
- `STATE_SERVICE_URL`: URL of the central ARG `state-service` (e.g. `http://localhost:3004`).

### Optional Variables
- `ASCII_ART_REDIRECT_URL` / `PUZZLE_REDIRECT_URL`: Custom redirect destination URL upon solving the ASCII art puzzle (falls back to runtime payload / step definition / default).
- `ASCII_ART_STEP_ID`: ARG step identifier for the ASCII art puzzle (default: `step_07_passcode`).
- `ASCII_ART_PASSCODE`: Target passcode override (default: `NHW`).
- `ASCII_ART_MAX_ATTEMPTS`: Maximum failed attempts before security lockout (default: `4`).
- `ASCII_ART_NEXT_STEP_ID`: Next step unlocked upon completion (default: `step_08_haven_redirect`).
- `RESET_PREREQUISITE_STEP_ID`: Prerequisite step required to clear a lockout (default: `step_02_wordsearch`).
- `WORDSEARCH_STEP_ID`: Step identifier for Wordsearch puzzle completion (default: `step_02_wordsearch`).

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
- `GET /asciiart/puzzle?userId=ID`: Serves the CRT terminal ASCII Art puzzle (requires `userId`).
- `GET /git/puzzle`: Explore the Repository puzzle (Coming soon).
- `GET /v1/api/puzzle/wordSearch?userId=ID`: Generate a new puzzle for the given user.
- `POST /v1/api/puzzle/wordSearch/validate`: Validate a found word using coordinates.
- `GET /v1/api/puzzle/wordSearch/complete`: Retrieve the final short URL after solving the puzzle.
- `GET /v1/api/puzzle/asciiArt?userId=ID`: Retrieve player ASCII art puzzle state, attempt counts, lockout status, and diagram.
- `POST /v1/api/puzzle/asciiArt/validate`: Validate submitted 3-letter passcode sequence, increment attempt count or trigger security lockout, and complete the ARG step upon match.
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
- `src/services/`: Core business logic (WordSearch, AsciiArt, Dictionary, URL Shortener, Convex).
- `src/fe/`: Frontend HTML files, stylesheets, and scripts.
  - `src/fe/ascii-art/asciiart.html`: CRT terminal UI for the ASCII Art passcode decoder.
  - `src/fe/word-search/wordsearch.html`: The frontend Wordsearch game.
  - `src/fe/assets/css/asciiart.css`: Retro phosphor-green CRT styling and animations.
  - `src/fe/assets/js/asciiart.js`: Frontend logic for input management, lockout handling, and polling.
  - `src/fe/home.html`: The landing page.
  - `src/fe/error.html`: The generic error page template.
- `src/tests/`: Vitest test suites.
- `config/`: Configuration files, step definition manifests (`arg_steps_manifest.json`), and seed data (`dictionaryData.json`).
- `dist/`: Compiled JavaScript output.

## Development

Mock mode has been completely removed to maintain single-source-of-truth consistency across services. When running the server locally, ensure that all required environment variables (`CONVEX_URL`, `PORT`, `API_BASE_URL`, and `STATE_SERVICE_URL`) are properly configured in `.env`.
