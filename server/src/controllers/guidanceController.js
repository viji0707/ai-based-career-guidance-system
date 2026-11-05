import { Ollama } from "ollama";
import Query from "../models/Query.js";

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
});
const MODEL = process.env.OLLAMA_MODEL || "llama3";

/** POST /api/guidance  — ask the AI for career guidance */
export async function getGuidance(req, res) {
  try {
    const { question } = req.body;
    if (!question || !question.trim())
      return res.status(400).json({ message: "Question required" });

    const prompt = `You are an expert career guidance counselor. A user asks: "${question}"
Provide clear, structured career guidance. Include:
- Suggested career paths
- Key skills to learn
- Recommended learning resources
- Actionable next steps
Use headings and bullet points.`;

    const response = await ollama.chat({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
    });

    const answer = response.message.content;

    await Query.create({ user: req.user._id, question, answer });

    res.json({ answer });
  } catch (err) {
    res.status(503).json({
      message: `AI service unavailable. Is Ollama running? Start it with: ollama run ${MODEL}`,
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
