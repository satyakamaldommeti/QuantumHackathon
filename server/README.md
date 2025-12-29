# Aidspeak Proxy Server

This is a minimal Express proxy to keep your OpenAI API key on the server. It forwards chat completion requests from the frontend to OpenAI.

Usage

1. Copy `.env.example` to `.env` in the project root and set `OPENAI_API_KEY`.
2. In the repo root run the server:

```bash
cd server
npm install
npm run start
```

3. In your frontend `.env` set `VITE_USE_PROXY=true` (or copy `.env.example` and adjust). Restart Vite.

The server exposes:
- `POST /api/chat` -> body: { messages: [...], model: 'gpt-4o-mini' }
