# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PersonaHub is an AI-powered debate simulator built with React, TypeScript, and Vite. Users create AI personas with distinct personalities and system prompts, then watch them debate on custom topics using the Gemini API. The application features internationalization (English and Korean) via i18next.

## Architecture

### Frontend (React + Vite)
- **App.tsx**: Root component managing persona state and routing between PersonaCreator and DebateArena
- **components/**: UI components including PersonaCard, PersonaCreator, DebateArena, ChatMessage, Header
- **services/geminiService.ts**: Centralized Gemini API interactions for:
  - `createPersonaPrompt()`: Auto-generates system prompts from persona descriptions
  - `generateDebateStance()`: Creates a debate stance for each persona based on topic
  - `runDebateTurn()`: Generates debate responses with configurable scope (Strict/Expansive) and style (Adversarial/Collaborative)
  - `summarizeDebate()`: Produces neutral summaries of completed debates
- **types.ts**: Core TypeScript interfaces (`Persona`, `DebateMessage`)
- **i18n.ts**: i18next configuration for multilingual support

### Backend (Express Server)
- **server.cjs**: Express server on port 3001 providing REST API for CRUD operations on personas
- **Persistent Storage**: Personas are saved to `data/personas.json` (automatically created on first run)
- Endpoints: GET/POST `/api/personas`, PUT/DELETE `/api/personas/:id`
- Data persists across server restarts

### Key Features
- **Debate Configuration**: Adjustable turns per participant (1-5), debate scope (Strict/Expansive), and argumentation style (Adversarial/Collaborative)
- **Collaborative Mode**: In the final turn, personas attempt to synthesize a consensus incorporating ideas from all participants
- **Persona Editing**: Users can edit existing personas and save changes via the PersonaCreator modal
- **Error Handling**: Comprehensive error handling for all API calls with user-friendly error messages
- **Loading States**: Visual feedback during data fetching and operations
- **Debate Export**: Export completed debates as JSON (structured data) or TXT (human-readable) files

## Development Commands

```bash
# Install dependencies
npm install

# Start Vite dev server (port 3000)
npm run dev

# Start Express API server (port 3001)
npm run server

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

## Environment Setup

Create a `.env.local` file with:
```
GEMINI_API_KEY=your_api_key_here
```

The Vite config exposes this as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` to the frontend.

## Development Workflow

1. **Running the app locally**: Start both servers concurrently - `npm run server` for the API and `npm run dev` for the frontend
2. **Frontend connects to backend**: All persona CRUD operations hit `http://localhost:3001/api/personas`
3. **API Key handling**: Gemini API calls are made directly from the browser using the key exposed via Vite's `define` config

## TypeScript Configuration

- Uses `@/*` path alias pointing to project root
- Target: ES2022 with ESNext modules
- JSX: react-jsx (automatic runtime)
- `allowImportingTsExtensions` enabled for `.tsx` imports

## Testing

- Jest configured with ts-jest and jsdom environment
- Testing Library setup for React components
- Path aliases configured to match tsconfig
- Tests use mocked fetch API to simulate backend responses
- Run tests with `npm test`

## Internationalization

Translation files located in:
- `locales/en/translation.json`
- `locales/ko/translation.json`

Use the `useTranslation()` hook from react-i18next. Language detection is automatic via browser settings.

## Important Notes

- **Persistent Storage**: Personas are saved to `data/personas.json` which persists across server restarts. The `data/` directory is gitignored.
- **Avatar system**: Uses pravatar.cc for demo avatars via persona ID
- **Debate turns**: Total debate messages = `debateTurns × participants.length`
- **Gemini model**: Currently uses `gemini-2.5-flash` for all API calls
- **Export Formats**:
  - JSON export includes full debate data, settings, and metadata
  - TXT export is formatted for human readability with timestamps and separators
