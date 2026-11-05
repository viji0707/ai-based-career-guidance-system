import { useEffect, useState } from "react";
import api from "../api/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      const { data } = await api.get("/guidance/history");
      setHistory(data.history);
    } catch {
      // history is optional; ignore failures
    }
  };

  const ask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const { data } = await api.post("/guidance", { question });
      setAnswer(data.answer);
      setQuestion("");
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to get guidance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="card">
      <h2>Welcome, {user?.username}</h2>
      <p>Ask anything about careers, skills, or learning paths.</p>

      <form onSubmit={ask}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., I'm interested in AI. What career paths suit me?"
          rows={3}
          required
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Thinking..." : "Get Guidance"}
        </button>
      </form>

      {error && <div className="alert error">{error}</div>}

      {answer && (
        <div className="result">
          <h3>AI Career Guidance</h3>
          <pre>{answer}</pre>
        </div>
      )}

      {history.length > 0 && (
        <div className="history">
          <h3>Recent Queries</h3>
          {history.map((h) => (
            <div key={h._id} className="history-item">
              <strong>Q: {h.question}</strong>
              <pre>{h.answer}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
