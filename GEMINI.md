# GEMINI.md

## Project Overview

This is a React and TypeScript web application called "PersonaHub: AI Debate Simulator". It allows users to create AI personas with distinct personalities and then have them debate each other on a given topic. The application uses Vite for building and `i18next` for internationalization. The core AI functionality is powered by the Gemini API.

### Key Components:

*   **`App.tsx`**: The main component that manages the state of personas and the overall layout.
*   **`PersonaCard.tsx`**: Displays a single persona's information.
*   **`PersonaCreator.tsx`**: A modal for creating new AI personas by defining their name, description, and a system prompt that guides their behavior. It can also auto-generate a system prompt based on the description.
*   **`DebateArena.tsx`**: The main component where the debate happens. Users can input a topic, and the selected personas will debate for a set number of turns. It also allows summarizing the debate.
*   **`geminiService.ts`**: This service contains functions to interact with the Gemini API for:
    *   `createPersonaPrompt`: Generating a system prompt for a new persona.
    *   `runDebateTurn`: Generating a debate response for a persona.
    *   `summarizeDebate`: Summarizing the entire debate.
*   **`i18n.ts`**: Configures internationalization with support for English and Korean.
*   **`types.ts`**: Defines the data structures for `Persona` and `DebateMessage`.

## Building and Running

The following scripts are available to run the project:

*   **`npm install`**: Installs dependencies.
*   **`npm run dev`**: Starts the development server.
*   **`npm run build`**: Builds the application for production.
*   **`npm run preview`**: Previews the production build.

**Note:** The application requires a `GEMINI_API_KEY` to be set in a `.env.local` file.

## Development Conventions

*   **Component-based architecture**: The UI is broken down into reusable React components located in the `components` directory.
*   **Styling**: The project uses Tailwind CSS for styling.
*   **State Management**: Component state is managed using React hooks (`useState`, `useEffect`).
*   **Internationalization**: Text strings are managed through `react-i18next` and stored in `locales/{lang}/translation.json`.
*   **API Interaction**: All interactions with the Gemini API are centralized in `services/geminiService.ts`.
*   **Types**: TypeScript types are defined in `types.ts`.
