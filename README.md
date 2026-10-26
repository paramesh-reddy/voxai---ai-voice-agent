# VoxAI — Production-Quality AI Voice Conversational Assistant

VoxAI is an enterprise-grade conversational voice assistant featuring low-latency Speech-to-Text (STT), deep contextual LLM reasoning, real-time Web Audio API frequency visualization, and expressive Text-to-Speech (TTS) acoustic synthesis.

---

## 1. System Architecture

```text
[User Speaks into Mic]
         │
         ▼
[MediaRecorder & Web Audio API] ────> [Canvas Frequency Visualizer (FFT)]
         │
         ▼
[HTTP Multipart / Base64 Audio]
         │
         ▼
[Backend (FastAPI / Express API Gateway)]
         │
         ├─► [1. STT Service: Gemini 3.5 Transcribe / Whisper-1]
         │        │ (Acoustic audio decoded into verbatim text)
         │        ▼
         ├─► [2. Conversational Context & Memory Builder]
         │        │ (Loads previous thread history from PostgreSQL/Database)
         │        ▼
         ├─► [3. LLM Reasoning Engine: Gemini 3.8 Flash / GPT-4o]
         │        │ (Formulates concise conversational reply)
         │        ▼
         ├─► [4. TTS Synthesis: Gemini 3.8 Flash Lite TTS / OpenAI TTS]
         │        │ (Synthesizes 24kHz High-Fidelity WAV audio stream)
         │        ▼
         └─► [5. State & Message Persistence (Cascade Relations)]
                  │
                  ▼
[Client Receives Audio Stream & Transcription]
         │
         ▼
[AudioContext Playback + Real-Time Waveform Reactive Animation]
```

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM, Axios, HTML5 Canvas, Web Audio API (`AnalyserNode`), MediaRecorder API.
- **Full-Stack Runtime**: Express with Vite middlewares & TypeScript execution (`tsx`).
- **Python / FastAPI Backend (`backend/`)**: FastAPI, Pydantic v2, SQLAlchemy 2.x async ORM, Alembic migrations, AsyncPG, Pytest, Docker Compose.
- **AI Models Supported**:
  - **Transcription (STT)**: `gemini-3.5-transcribe` / `whisper-1`
  - **Reasoning (LLM)**: `gemini-3.8-flash` / `gpt-4o-mini`
  - **Synthesis (TTS)**: `gemini-3.8-flash-lite-tts` (voices: Kore, Zephyr, Puck, Fenrir) / `tts-1` (alloy, echo, fable, onyx, nova, shimmer)
- **Security**: Argon2 / Bcrypt password hashing, cryptographic JWT access tokens (15-min lifespan), revocable refresh tokens, strict database user isolation, zero raw audio permanent retention.

---

## 3. Quick Start

The app is split into two folders:

- `frontend/` — React + Vite UI (port 3000)
- `backend/` — Express API (port 8000) with PostgreSQL and OpenAI. A FastAPI version also lives in `backend/app` if you have Python installed.

### Run the full app

1. **Install dependencies** from the project root:
   ```bash
   npm run install:all
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and set `OPENAI_API_KEY`, `DATABASE_URL`, and `JWT_SECRET`.

3. **Start both servers**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`. The UI proxies `/api` to the backend on port 8000.

4. **Demo Account**:
   - **Email**: `demo@voxai.internal`
   - **Password**: `VoxDemo2026!`
   *(Or click the one-click demo login button on the sign-in screen)*

---

### Option B: Python FastAPI Backend (`backend/`)

1. **Create Virtual Environment**:
   ```bash
   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate

   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. **Install Python Packages**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Run Database Migrations (PostgreSQL)**:
   ```bash
   alembic upgrade head
   ```

4. **Launch FastAPI**:
   ```bash
   uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

### Option C: Docker Compose (Postgres + API + web)

From the project root, with `OPENAI_API_KEY` and `JWT_SECRET` in `.env`:

```bash
docker compose up --build
```

This starts three containers:

- `voxai-postgres` — PostgreSQL 16 on port `5432` (user `voxai_user`, database `voxai_db`)
- `voxai-api` — Node API on port `8000`, using the Postgres container
- `voxai-web` — built React app on port `3000`, proxying `/api` to the API container

Open `http://localhost:3000`. Demo login: `demo@voxai.internal` / `VoxDemo2026!`

This Docker database is separate from the Neon database used by `npm run dev`.

---

## 4. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health and AI provider status |
| `POST` | `/api/v1/auth/register` | Register new user with email & password |
| `POST` | `/api/v1/auth/login` | Authenticate user & return JWT tokens |
| `POST` | `/api/v1/auth/google/verify` | Verify Google OAuth credentials |
| `POST` | `/api/v1/auth/refresh` | Refresh expired access token |
| `POST` | `/api/v1/auth/logout` | Revoke active refresh session |
| `GET` | `/api/v1/auth/me` | Fetch authenticated profile & settings |
| `GET` | `/api/v1/conversations` | List user's conversations with message counts |
| `POST` | `/api/v1/conversations` | Create new conversation session |
| `GET` | `/api/v1/conversations/:id` | Fetch conversation transcript |
| `PATCH` | `/api/v1/conversations/:id` | Rename conversation title |
| `DELETE` | `/api/v1/conversations/:id` | Delete conversation and cascade messages |
| `POST` | `/api/v1/voice/transcribe` | Transcribe audio stream (STT) |
| `POST` | `/api/v1/voice/chat` | Send prompt to conversational LLM |
| `POST` | `/api/v1/voice/synthesize` | Synthesize text to WAV/MP3 speech (TTS) |
| `POST` | `/api/v1/voice/turn` | Full turn: Audio in ➔ STT ➔ LLM ➔ TTS ➔ Audio out |

---

## 5. Security & Privacy Guarantees

1. **Zero Raw Audio Retention**: Spoken audio buffers are converted in memory to acoustic feature tensors, transcribed, and immediately freed. No raw user recordings are retained on disk by default.
2. **Resource Scoping**: Every database query verifies `WHERE user_id = :auth_user_id`. Attempting to access another user's conversation returns a 404/403.
3. **No Frontend Secrets**: API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `JWT_SECRET`) are strictly confined to the server environment.

---

## 6. Troubleshooting

- **Microphone permission blocked**: Ensure your browser grants microphone access to `http://localhost:3000`. In Chrome, click the padlock/settings icon on the left of the address bar and enable Microphone.
- **Audio synthesis not playing**: Check that your browser audio tab is not muted and that the volume slider is above 0%. Modern browsers require at least one user click/interaction before playing synthesized audio streams.
