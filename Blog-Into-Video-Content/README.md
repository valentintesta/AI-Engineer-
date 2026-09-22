# Blog Into Video Content

Turns any article URL into a short vertical video (Instagram Reel / TikTok style): TL;DR script, AI-generated b-roll images, AI voiceover, and burned-in captions.

## How it works

1. **Content extraction** — [Exa AI](https://exa.ai) fetches and cleans the article text from the given URL (no headless browser needed).
2. **Script + assets** — [GPTScript](https://github.com/gptscript-ai/gptscript) orchestrates OpenAI to summarize the article into a 3-part TL;DR script, generate a b-roll image per part, and generate a voiceover per part.
3. **Transcription** — each voiceover is transcribed to word-level timestamps for caption burn-in.
4. **Video render** — `ffmpeg` renders each part (image + audio + animated captions) and concatenates them into the final video.

## Stack

- **Backend**: Node.js + Express + GPTScript + ffmpeg
- **Frontend**: React + TypeScript + Vite + Tailwind
- **Content extraction**: Exa AI
- **Generation**: OpenAI (text, image, speech, transcription via GPTScript tools)

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in OPENAI_API_KEY and EXA_API_KEY
node index.js
```

Runs on `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. Set `VITE_API_URL` (e.g. in a `.env` file or Vercel env vars) to point at the backend if it's not on `localhost:8080`.

## Endpoints

- `GET /create-story?url=<article-url>` — extracts content and generates script + images + voiceovers, returns a story `id`
- `GET /build-video?id=<id>` — renders the final video from the generated assets
- `GET /samples` — lists previously generated videos
