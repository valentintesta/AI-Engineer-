# RAG Chat with YouTube

Chat with any YouTube video. Paste a link, the app pulls the video transcript, indexes it in a local **FAISS** vector store, and answers your questions using **only what is said in the video** — a Retrieval-Augmented Generation (RAG) pipeline end to end.

Built as a hands-on project to understand the core pieces of a RAG system: document ingestion, chunking, vector embeddings, similarity search, and grounding an LLM on an external knowledge base instead of its pre-trained memory.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| API | tRPC (end-to-end type-safe) · Zod validation |
| Client state | TanStack Query (React Query) |
| Vector store | FAISS (`faiss-node`, local on disk, one index per video) |
| Embeddings | OpenAI `text-embedding-3-small` |
| LLM | OpenAI `gpt-4o-mini` |
| Chunking | LangChain `RecursiveCharacterTextSplitter` (1000 chars, 200 overlap) |
| Transcripts | `youtube-transcript-plus` |
| Styling | Tailwind CSS (light + dark mode) |

## Architecture

```
Browser (React + tRPC client)
    │
    │  1. ingest({ videoId })
    ▼
Next.js route handler  /api/trpc
    │   ├─► fetch YouTube transcript
    │   ├─► split into overlapping chunks
    │   ├─► embed chunks (OpenAI)
    │   └─► save FAISS index + chunks → data/faiss/<videoId>/
    │
    │  2. ask({ videoId, query })
    ▼
    ├─► embed the question
    ├─► FAISS similarity search → top 4 chunks
    └─► gpt-4o-mini answers using only those chunks
            └─► returns { answer, sources }
```

The API returns the retrieved `sources` (transcript excerpts + similarity score) alongside every answer, so each response can be checked against what the video actually says.

## Getting started

Requirements: Node.js 20+ and an OpenAI API key.

```bash
cd web
npm install
cp .env.example .env.local   # then set OPENAI_API_KEY
npm run dev
```

Open http://localhost:3000, paste a YouTube URL (`youtube.com/watch`, `youtu.be`, and `shorts` links all work), click **Indexar video**, and start asking questions.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Used for embeddings and chat completions |
| `FAISS_DIR` | No | Where indexes are stored (default: `./data/faiss`) |

## Project structure

```
web/src
├── app
│   ├── page.tsx                  # Chat UI
│   ├── layout.tsx                # tRPC + React Query providers
│   └── api/trpc/[trpc]/route.ts  # tRPC HTTP endpoint
├── server
│   ├── rag.ts                    # Ingest + retrieve + answer pipeline
│   ├── trpc.ts                   # tRPC init
│   └── routers/_app.ts           # health · ingest · ask procedures
└── trpc/client.tsx               # Typed tRPC client for React
```

## Roadmap

- [ ] Show retrieved sources under each answer in the UI
- [ ] Timestamped sources that link to the exact moment in the video
- [ ] LLM-as-a-judge groundedness check to flag hallucinations
- [ ] Evaluation set (RAGAS-style) to measure answer quality across changes
- [ ] Streaming responses

## Credits

Based on [lokeshwarlakhi/RAG-Chat-with-YouTube](https://github.com/lokeshwarlakhi/RAG-Chat-with-YouTube) (Python · FastAPI · Streamlit · Gemini · Pinecone), rebuilt in TypeScript with Next.js, tRPC, OpenAI, and FAISS.
