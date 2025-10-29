# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PersonaHub is a dual-purpose AI application built with React, TypeScript, and Vite, featuring:

1. **AI Debate Simulator**: Create AI personas with distinct personalities and watch them debate on custom topics with real-time audio playback using the Gemini API
2. **Messenger Auto-Reply System**: Context-aware messaging assistant that learns from conversation examples to generate personalized reply suggestions

The application features comprehensive internationalization (English and Korean) via i18next.

## Architecture

### Frontend (React + Vite)
- **App.tsx**: Root component with dual-tab navigation (Debate Arena / Messenger Simulator) managing shared persona state
- **components/**: UI components including:
  - **PersonaCard**: Persona display card with edit/delete actions
  - **PersonaCreator**: Modal for creating/editing personas with AI-generated system prompts
  - **DebateArena**: Multi-persona debate simulator with real-time audio playback
  - **ChatMessage**: Message bubble component for debates
  - **ChatRoomCard**: Chat room display card with edit/delete actions
  - **ChatRoomCreator**: Modal for creating chat rooms with AI learning or existing persona assignment
  - **ChatRoomSimulator**: Interactive messenger interface with AI-powered reply suggestions
  - **ActiveParticipants**: Participant list display for debates
  - **Header**: Language switcher header
  - **icons/**: SVG icon components (ChevronRight, Download, Pencil, Play, Plus, Sparkles, Trash)
- **services/geminiService.ts**: Centralized Gemini API interactions for:
  - `createPersonaPrompt()`: Auto-generates system prompts from persona descriptions
  - `generateDebateStance()`: Creates a debate stance for each persona based on topic
  - `runLiveDebateTurn()`: Generates debate responses with optional real-time audio synthesis (configurable scope/style)
  - `summarizeDebate()`: Produces neutral summaries of completed debates
  - `learnPersonaFromConversation()`: Few-shot learning from example messages to create personalized system prompts
  - `generateReplyOptions()`: Creates 3 context-aware reply choices (short/normal/detailed) with confidence scores
- **types.ts**: Core TypeScript interfaces (`Persona`, `DebateMessage`, `ChatRoom`, `ChatMessage`, `ReplyOption`)
- **i18n.ts**: i18next configuration for multilingual support

### Backend (Express Server)
- **server.cjs**: Express server on port 3002 providing REST API for CRUD operations
- **Persistent Storage**:
  - Personas saved to `data/personas.json`
  - Chat rooms saved to `data/chatrooms.json`
  - Both files automatically created on first run with default data
- **Persona Endpoints**:
  - `GET /api/personas` - Fetch all personas
  - `POST /api/personas` - Create new persona
  - `PUT /api/personas/:id` - Update existing persona
  - `DELETE /api/personas/:id` - Delete persona
- **Chat Room Endpoints**:
  - `GET /api/chatrooms` - Fetch all chat rooms
  - `POST /api/chatrooms` - Create new chat room
  - `PUT /api/chatrooms/:id` - Update chat room details
  - `PUT /api/chatrooms/:id/messages` - Update chat room messages
  - `DELETE /api/chatrooms/:id` - Delete chat room
- Data persists across server restarts

### Key Features

#### Debate Arena Features
- **Real-time Audio Playback**: Optional text-to-speech synthesis using Gemini's native audio API (Zephyr voice) with WAV conversion
- **Debate Configuration**: Adjustable turns per participant (1-5), debate scope (Strict/Expansive), and argumentation style (Adversarial/Collaborative)
- **Collaborative Mode**: In the final turn, personas attempt to synthesize a consensus incorporating ideas from all participants
- **Live Debate Streaming**: Real-time message display with "thinking" indicators
- **Stop Debate**: Interrupt ongoing debates at any time
- **AI Summarization**: Generate neutral summaries of completed debates
- **Debate Export**: Export completed debates as JSON (structured data) or TXT (human-readable) files

#### Messenger Simulator Features
- **AI Learning Mode**: Create personas by providing 2-3 example messages; AI analyzes tone, formality, emoji usage
- **Existing Persona Mode**: Assign pre-created personas to chat rooms
- **Smart Reply Generation**: AI generates 3 context-aware reply options:
  - ⚡ **Quick Reply** (5-15 characters) - e.g., "ㅇㅋ", "ok"
  - 💬 **Normal Reply** (1-2 sentences) - Natural response
  - 📝 **Detailed Reply** (2-4 sentences) - Contextual explanation
- **Confidence Scores**: Each reply includes AI confidence rating (0-1)
- **Chat History**: Full conversation context maintained for accurate responses
- **KakaoTalk-style UI**: Bubble chat interface with familiar messaging UX

#### General Features
- **Persona Management**: Create, edit, and delete personas with AI-generated system prompts
- **Error Handling**: Comprehensive error handling for all API calls with user-friendly error messages
- **Loading States**: Visual feedback during data fetching and operations
- **Persistent Storage**: Local JSON file-based storage (no cloud dependencies)

## Development Commands

```bash
# Install dependencies
npm install

# Start both Vite dev server (port 8080) and Express API server (port 3002) concurrently
npm run dev

# Start Express API server only (port 3002)
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

1. **Running the app locally**: Run `npm run dev` which starts both Vite dev server (port 8080) and Express API server (port 3002) concurrently
2. **Frontend connects to backend**: All API operations hit `http://localhost:3002/api/*` endpoints via Vite proxy configuration
3. **API Key handling**: Gemini API calls are made directly from the browser using the key exposed via Vite's `define` config
4. **Vite Proxy**: Development server proxies `/api/*` requests to `http://localhost:3002` for seamless development experience

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

- **Persistent Storage**:
  - Personas saved to `data/personas.json`
  - Chat rooms saved to `data/chatrooms.json`
  - Both files persist across server restarts
  - The `data/` directory is gitignored for privacy
- **Avatar system**: Uses pravatar.cc for demo avatars via persona ID
- **Debate turns**: Total debate messages = `debateTurns × participants.length`
- **Gemini Models**:
  - Text generation: `gemini-2.5-flash`
  - Audio synthesis: `gemini-2.5-flash-native-audio-preview-09-2025` (Zephyr voice)
- **Audio Pipeline**:
  - Base64 audio data from Gemini API
  - Automatic WAV header creation and conversion
  - HTML5 Audio playback with sequential turn handling
  - Compression: sliding window (25600 → 12800 tokens)
- **Reply Generation**: Uses last 10 messages for context to generate accurate, personalized responses
- **Export Formats**:
  - JSON export includes full debate data, settings, and metadata
  - TXT export is formatted for human readability with timestamps and separators
- **Few-Shot Learning**: Messenger feature learns tone and style from as few as 2-3 example messages

## Project Structure

```
/home/clown/PersonaHub/
├── App.tsx                          # Main app with dual-tab navigation (Debate/Messenger)
├── types.ts                         # TypeScript interfaces (Persona, ChatRoom, DebateMessage, etc.)
├── server.cjs                       # Express backend (port 3002)
├── vite.config.ts                   # Vite config with API proxy to port 3002
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── jest.config.ts                   # Jest testing configuration
├── i18n.ts                          # i18next internationalization setup
├── index.tsx                        # App entry point
├── index.html                       # HTML template
├── components/
│   ├── Header.tsx                   # Language switcher header
│   ├── PersonaCard.tsx              # Persona display card with edit/delete
│   ├── PersonaCreator.tsx           # Modal for creating/editing personas
│   ├── DebateArena.tsx              # Debate simulator with audio support
│   ├── ChatMessage.tsx              # Message component for debates
│   ├── ChatRoomCard.tsx             # Chat room display card
│   ├── ChatRoomCreator.tsx          # Modal for creating chat rooms
│   ├── ChatRoomSimulator.tsx        # Messenger simulation interface
│   ├── ActiveParticipants.tsx       # Participant list display
│   └── icons/                       # SVG icon components
│       ├── ChevronRightIcon.tsx
│       ├── DownloadIcon.tsx
│       ├── PencilIcon.tsx
│       ├── PlayIcon.tsx
│       ├── PlusIcon.tsx
│       ├── SparklesIcon.tsx
│       └── TrashIcon.tsx
├── services/
│   └── geminiService.ts             # All Gemini API integrations
├── locales/
│   ├── en/translation.json          # English translations (87+ keys)
│   └── ko/translation.json          # Korean translations (87+ keys)
├── __tests__/
│   └── PersonaManagement.test.tsx   # Jest tests for CRUD operations
├── data/                            # Git-ignored persistent storage
│   ├── personas.json                # Persona data (auto-created)
│   └── chatrooms.json               # Chat room data (auto-created)
└── Documentation Files
    ├── CLAUDE.md                    # This file - development guide
    ├── PRESENTATION.md              # Hackathon presentation script
    ├── README.md                    # User-facing documentation
    └── GEMINI.md                    # Gemini-specific guidance
```

## Component Relationships

### Debate Arena Flow
1. **App.tsx** → Loads personas from API
2. **PersonaCard** → Select 2+ personas for debate
3. **DebateArena** → Configure debate settings (turns, scope, style, audio)
4. **geminiService.runLiveDebateTurn()** → Generates responses with optional audio
5. **ChatMessage** → Displays debate messages in real-time
6. **geminiService.summarizeDebate()** → AI-generated summary

### Messenger Simulator Flow
1. **App.tsx** → Loads personas and chat rooms from API
2. **ChatRoomCreator** → Create room with AI learning or existing persona
3. **geminiService.learnPersonaFromConversation()** → Generates persona from examples
4. **ChatRoomSimulator** → Simulate incoming messages
5. **geminiService.generateReplyOptions()** → Generates 3 contextual replies
6. User selects reply → Adds to conversation history

## Code References

- **Audio implementation**: DebateArena.tsx:150-250, geminiService.ts:200-350
- **Few-shot learning**: ChatRoomCreator.tsx:100-200, geminiService.ts:400-500
- **Reply generation**: ChatRoomSimulator.tsx:150-300, geminiService.ts:500-600
- **API endpoints**: server.cjs:50-200
- **Persona CRUD**: App.tsx:50-150, server.cjs:50-100
- **Chat room CRUD**: App.tsx:150-250, server.cjs:100-200
