# Synopsis — AI-Powered Structured Study Assistant

A clean, resilient SaaS study workspace built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **Zod**, and an **Express** backend proxy.

Users paste raw lecture notes or describe a topic, and the application converts the unstructured text into a strictly validated, interactive **3D Flashcard Deck** and an **Adaptive Multiple-Choice Quiz** with a dedicated **Re-test Wrong Answers Only** flow.

---

## Key Features & Architecture

1. **Non-Chat SaaS Workspace ("The Firm Rule")**
   - Zero conversational chat bubbles or raw markdown dumps.
   - Structured JSON output from the LLM is parsed and rendered into stateful, interactive UI components inspired by Quizlet and Notion.

2. **Server-Side API Key Security (`server/index.ts`)**
   - All LLM calls are routed through the local Express backend (`POST /api/generate`).
   - API keys remain strictly in server environment variables (`.env`) and are never shipped or exposed to the browser bundle.
   - Supports **Google Gemini** (`GEMINI_API_KEY`), **Groq** (`GROQ_API_KEY`), **OpenAI** (`OPENAI_API_KEY`), **OpenRouter** (`OPENROUTER_API_KEY`), or local **Ollama** (`OLLAMA_MODEL`), plus an automatic zero-config structured demo mode so `npm install && npm start` works immediately for evaluators even before adding an API key.

3. **Uncompromising Resilience & Bad AI Output Handling (`src/lib/schema.ts`)**
   - **Frontend Zod Validation**: Never trusts the LLM response. Strips accidental markdown code fences, catches `JSON.parse` syntax errors, and validates every field (`FlashcardSchema`, `QuizQuestionSchema`, bounds checking on `correctIndex` vs `options.length`) using Zod before rendering.
   - **Race Condition & Stale Response Protection**: Uses both an `AbortController` and a monotonically increasing request ID (`latestRequestIdRef`) in `src/App.tsx`. Rapidly clicking "Generate" immediately aborts in-flight HTTP requests and guarantees a slow/stale response can never overwrite newer state.
   - **Built-in Fault Injection Simulator**: Includes an interactive *AI Output & Resilience Simulator* dropdown in the left panel so reviewers can test:
     - Truncated / Malformed JSON syntax
     - Wrong JSON Schema shape (Zod contract violation)
     - Empty LLM output
     - Slow 4.5s responses (to test race conditions / request cancellation)
     - Upstream HTTP 502 server errors

4. **Interactive Study Modes & Polish**
   - **3D Flashcards (`src/components/FlashcardDeck.tsx`)**: Smooth CSS 3D flip transitions (`perspective-1000`, `backface-hidden`), card shuffle, mastery tracking, optional hints, and full keyboard navigation (`Space`/`Enter` to flip, `←`/`→` to navigate, `M` to mark mastered, `H` for hint).
   - **Quiz & Targeted Refinement (`src/components/QuizView.tsx`)**: Immediate option feedback with explanations, keyboard shortcuts (`1`–`4` to select an option, `Enter` to advance), final score breakdown, and a **Re-test Missed Questions** button that filters the quiz down to only the questions answered incorrectly.
   - **Responsive & Dark Mode Ready**: Mobile-first layout with a persistent dark mode toggle in the top header.

---

## Setup & Running Locally

### Prerequisites
- **Node.js** (v18+ recommended) and **npm**

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional for Live LLM / Automatic Fallback Included)
Copy `.env.example` to `.env` in the project root and add any one provider API key:
```bash
cp .env.example .env
```
```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
# Or GROQ_API_KEY / OPENAI_API_KEY / OPENROUTER_API_KEY / OLLAMA_MODEL
```
*(Note: If no API key is set in `.env`, the backend automatically runs in `demo-fallback` mode and returns realistic structured JSON so you can test the entire UI, Zod validation, and Fault Simulator out of the box.)*

### 3. Start the Application (Frontend + Backend)
```bash
npm start
```
- **Frontend (Vite)**: `http://localhost:5173` (proxies `/api/*` requests to port `3001`)
- **Backend (Express)**: `http://localhost:3001`

---

## AI-Usage Note

> **[Placeholder — Customize before final submission]**
> - **How AI tools were used**: Used an AI coding assistant to scaffold the Express proxy server, generate the Tailwind 3D card flip utilities, and structure the Zod validation schemas (`StudySetSchema`) and fault-injection simulator states.
> - **Key architectural decisions verified manually**: Designed the two-layer concurrency guard (`AbortController` paired with `latestRequestIdRef`) in `src/App.tsx`, verified that `correctIndex` bounds-checking is enforced via `.refine()` in `src/lib/schema.ts`, and ensured the re-test flow in `src/components/QuizView.tsx` cleanly isolates missed questions without mutating the original study set.

---

## Known Limitations

1. **In-Memory Session State**: Generated study sets and mastery progress are currently held in React state for the active session. Refreshing the browser resets the workspace (localStorage persistence or backend database storage would be the next step).
2. **Input Token Length**: Extremely long documents (e.g., 50+ page PDFs pasted verbatim) may exceed fast-model context windows or increase latency; inputs are currently capped at a 1MB JSON body limit on the Express server.
3. **Non-Streaming Structured Output**: The backend waits for the complete JSON object from the LLM before returning it so that strict schema validation can run atomically. Streaming partial JSON tokens with incremental schema parsing would improve perceived latency on larger decks.

---

## Time Spent

> **[Placeholder — Customize before final submission]**
> - **Total Time Spent**: ~X.X hours
>   - Architecture, Express backend proxy & LLM prompt engineering: ~X.X hrs
>   - Zod schema validation, Fault Simulator & `AbortController` race-condition guards: ~X.X hrs
>   - Flashcard 3D deck, Quiz view with wrong-answer re-test flow & keyboard navigation: ~X.X hrs
>   - Dark mode polish, mobile responsiveness & documentation: ~X.X hrs
