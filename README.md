# AI Engineer Portfolio

A collection of AI-powered projects spanning resume analysis, venture capital due diligence, RAG over YouTube videos, AI video generation, and no-code automation workflows.

---

## Projects

### AI-HR — Resume Analyzer

A web app that evaluates a resume against a job description using GPT-4o vision and ATS scoring logic. Upload a PDF resume, paste a job description, and get structured feedback across five dimensions: ATS compatibility, tone & style, content impact, structure, and skills alignment.

The app converts the PDF to an image client-side, sends it to GPT-4o vision, and returns a scored JSON with specific actionable tips per category. Built with React, TypeScript, Vite, Tailwind CSS, and Puter.js as a serverless backend.

→ [View project](./AI-HR)

---

### AI-VC — DealScout VC Due Diligence Platform

A multi-agent system that automates startup analysis for Venture Capitalists. Enter a company name and URL or paste a full pitch deck, and a pipeline of 7 specialized AI agents researches, analyzes, debates, and delivers a final investment memo.

The agent pipeline covers market sizing, product validation, traction fact-checking, a simulated analyst debate, critical pre-investment questions, and a GP-level PASS / DIG DEEPER / INVEST recommendation. Built with Python, FastAPI, LangChain, LangGraph, OpenAI GPT-4o, Serper API, and a React + Vite frontend.

→ [View project](./AI-VC)

---

### No-Code Workflows — Automation Library

A library of production automation workflows built without custom backend code. Covers HubSpot CRM updates, outbound messaging via Darwin AI, Zapier lead processing, and an MCP server that lets AI agents schedule meetings through natural language.

| Folder | Tool | Description |
|---|---|---|
| `n8n-hubspot-workflow` | n8n | Receives NPS survey responses and updates HubSpot custom objects |
| `zapier/create-contact-hubspot` | Zapier | Creates or updates HubSpot contacts from Darwin AI session events |
| `zapier/outbound-new-contact-list-hubspot` | Zapier | Sends outbound WhatsApp messages when new contacts enter a HubSpot list |
| `MCP-N8N` | n8n + MCP | Exposes HubSpot meeting scheduling as AI tools via Model Context Protocol |

→ [View project](./no-code-workflows)

---

### Rag-Youtube-Chat — Chat with Any YouTube Video

A RAG (Retrieval-Augmented Generation) app that lets you chat with a YouTube video. Paste a link and the app fetches the transcript, splits it into overlapping chunks, embeds them, and stores them in a local FAISS index (one per video). Each question is embedded, matched against the top 4 most similar chunks, and answered by the LLM using only those excerpts, so answers stay grounded in what the video actually says. Every answer comes back with its source excerpts and similarity scores for verification.

Built with Next.js 16 (App Router), React 19, TypeScript, tRPC for an end-to-end type-safe API, Zod, TanStack Query, FAISS (`faiss-node`), OpenAI `text-embedding-3-small` + `gpt-4o-mini`, LangChain text splitters, and Tailwind CSS.

→ [View project](./Rag-Youtube-Chat)

---

### Blog-Into-Video-Content — Article to Short-Form Video

Turns any article URL into a vertical short video (Instagram Reel / TikTok style). Exa AI extracts and cleans the article text, GPTScript orchestrates OpenAI to write a 3-part TL;DR script and generate a b-roll image and voiceover for each part, the voiceovers are transcribed to word-level timestamps, and ffmpeg renders the images, audio, and animated captions into the final video.

Built with Node.js, Express, GPTScript, OpenAI (text, image, speech, and transcription), Exa AI, ffmpeg, and a React + TypeScript + Vite + Tailwind CSS frontend.

→ [View project](./Blog-Into-Video-Content)

---

## Stack Overview

| Project | AI | Backend | Frontend |
|---|---|---|---|
| AI-HR | OpenAI GPT-4o | Puter.js (serverless) | React + TypeScript |
| AI-VC | OpenAI GPT-4o | Python + FastAPI + LangGraph | React + Vite |
| No-Code Workflows | — | n8n / Zapier | — |
| Rag-Youtube-Chat | OpenAI GPT-4o-mini + embeddings · FAISS | Next.js 16 + tRPC (Node.js) | React 19 + TypeScript + TanStack Query |
| Blog-Into-Video-Content | OpenAI (text, image, TTS, STT) · Exa AI | Node.js + Express + GPTScript + ffmpeg | React + TypeScript + Vite |
