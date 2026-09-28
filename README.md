# IRONFORGE FITNESS — AI Customer Support Agent

This update adds a floating AI Customer Support Agent to the existing IRONFORGE FITNESS website. The original cinematic Three.js hero and program interactions are preserved.

## Features
- Floating AI Assistant launcher
- Website/company-aware customer support
- Membership, programs, trainers, hours, location and contact knowledge
- OpenAI Responses API backend when `OPENAI_API_KEY` is configured
- Safe local website-knowledge fallback when the backend is unavailable
- Speak Mode using browser microphone speech recognition
- Voice replies using browser speech synthesis
- Listening / thinking / speaking status states
- Mobile responsive UI matching the existing black/red/amber design
- No API key is exposed in frontend files

## Run locally

1. Install Node.js 20+
2. Open this folder in a terminal
3. Run `npm install`
4. Copy `.env.example` to `.env`
5. Put your API key in `.env`:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-luna
PORT=3000
```

6. Run `npm start`
7. Open `http://localhost:3000`

The API key must stay server-side. Do not paste it into `index.html`, `style.css`, or `script.js`.

## Speak Mode

Click **AI Assistant → Speak Mode**, allow microphone access, and speak. The browser transcribes the question, the AI backend answers using the website knowledge, and the assistant reads the answer aloud. Chrome and Edge are recommended for the browser speech-recognition path.

## Knowledge base

Edit `knowledge.md` when the business changes. This is the current website knowledge source used by the backend prompt. For a larger production knowledge base, the next upgrade should be document ingestion + embeddings + vector search (RAG).
