import { Ollama } from "ollama";
import Query from "../models/Query.js";

// ---- Cloud AI (Groq) ----
// Used when GROQ_API_KEY is set (e.g. in deployment). Groq's API is OpenAI-compatible.
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ---- Local AI (Ollama) ----
// Used when GROQ_API_KEY is empty (local development). Kept so local dev still works.
const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
});
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

const SYSTEM_PROMPT = `You are an expert career guidance counselor. Help the user explore career options.
Provide clear, structured guidance. Include:
- Suggested career paths that fit their interests
- Key skills to learn for each path
- Recommended learning resources (courses, tools, projects)
- Actionable next steps
Use headings and bullet points. Be encouraging and practical.`;

function buildMessages(question) {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `User question: ${question}` },
  ];
}

/** Call Groq's OpenAI-compatible chat completions endpoint. */
async function askGroq(question) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: buildMessages(question),
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Groq API ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const answer = data?.choices?.[0]?.message?.content;
  if (!answer) throw new Error("Groq returned an empty response");
  return answer;
}

/** Call the local Ollama instance. */
async function askOllama(question) {
  const response = await ollama.chat({
    model: OLLAMA_MODEL,
    messages: buildMessages(question),
  });
  return response.message.content;
}

/** POST /api/guidance  — get AI career guidance */
export async function getGuidance(req, res) {
  try {
    const { question } = req.body;
    if (!question || !question.trim())
      return res.status(400).json({ message: "Question required" });

    // Groq when configured (cloud), otherwise local Ollama (dev)
    const answer = GROQ_API_KEY
      ? await askGroq(question)
      : await askOllama(question);

    await Query.create({ user: req.user._id, question, answer });
    res.json({ answer });
  } catch (err) {
    const usingGroq = Boolean(GROQ_API_KEY);
    res.status(503).json({
      message: usingGroq
        ? "AI service error. Check GROQ_API_KEY / GROQ_MODEL on the server."
        : `AI service unavailable. Is Ollama running? Start it with: ollama run ${OLLAMA_MODEL}`,
      error: err.message,
    });
  }
}

/** GET /api/guidance/history  — recent queries for the logged-in user */
export async function getHistory(req, res) {
  try {
    const history = await Query.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
