import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { IndexFlatIP } from "faiss-node";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { fetchTranscript } from "youtube-transcript-plus";

const EMBEDDING_MODEL = "text-embedding-3-small";
const LLM_MODEL = "gpt-4o-mini";
const TOP_K = 4;

// One FAISS index per video: <FAISS_DIR>/<videoId>/{index.faiss,chunks.json}
const FAISS_DIR = process.env.FAISS_DIR ?? path.join(process.cwd(), "data", "faiss");

const openai = new OpenAI();

function videoDir(videoId: string) {
  return path.join(FAISS_DIR, videoId);
}

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function embed(texts: string[]) {
  const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: texts });
  // OpenAI embeddings are unit-normalized, so inner product == cosine similarity.
  return res.data.map((d) => d.embedding);
}

export async function isIngested(videoId: string) {
  try {
    await fs.access(path.join(videoDir(videoId), "index.faiss"));
    return true;
  } catch {
    return false;
  }
}

export async function ingestVideo(videoId: string) {
  const snippets = await fetchTranscript(videoId);
  const transcript = decodeEntities(snippets.map((s) => s.text).join(" "));

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  const chunks = await splitter.splitText(transcript);
  if (chunks.length === 0) throw new Error("The video transcript is empty");

  const vectors = await embed(chunks);
  const index = new IndexFlatIP(vectors[0].length);
  index.add(vectors.flat());

  const dir = videoDir(videoId);
  await fs.mkdir(dir, { recursive: true });
  index.write(path.join(dir, "index.faiss"));
  await fs.writeFile(path.join(dir, "chunks.json"), JSON.stringify(chunks));

  return { videoId, chunks: chunks.length, language: snippets[0]?.lang ?? null };
}

export async function answerQuestion(videoId: string, query: string) {
  const dir = videoDir(videoId);
  if (!(await isIngested(videoId))) {
    throw new Error(`Video ${videoId} has not been ingested yet`);
  }

  const index = IndexFlatIP.read(path.join(dir, "index.faiss"));
  const chunks: string[] = JSON.parse(await fs.readFile(path.join(dir, "chunks.json"), "utf8"));

  const [queryVector] = await embed([query]);
  const { labels, distances } = index.search(queryVector, Math.min(TOP_K, index.ntotal()));
  const sources = labels.map((label, i) => ({ text: chunks[label], score: distances[i] }));

  const context = sources.map((s) => s.text).join("\n\n");
  const completion = await openai.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You answer questions about a YouTube video using only the transcript excerpts provided. " +
          "Explain clearly and comprehensively. If the excerpts don't contain the answer, say so. " +
          "Answer in the same language as the question.",
      },
      { role: "user", content: `Transcript excerpts:\n${context}\n\nQuestion: ${query}` },
    ],
  });

  return { answer: completion.choices[0].message.content ?? "", sources };
}
