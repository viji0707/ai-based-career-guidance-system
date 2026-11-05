import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import { connectDB, dbError, isDbConnected } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import guidanceRoutes from "./routes/guidance.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/guidance", guidanceRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Diagnostics: reports the real DB connection state + last error
app.get("/api/dbstatus", (req, res) =>
  res.json({ connected: isDbConnected(), error: dbError })
);

// 404 for unknown API routes (must come before the SPA catch-all)
app.use("/api", (req, res) => res.status(404).json({ message: "API route not found" }));

// In production (single-service deploy), Express serves the built React app.
const distDir = path.resolve(process.cwd(), "client/dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA fallback: any non-API GET returns index.html so React Router can handle it
  app.get("*", (req, res) => res.sendFile(path.join(distDir, "index.html")));
}

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

// Render sets PORT automatically; 5001 avoids the macOS ControlCenter conflict locally.
const PORT = process.env.PORT || 5001;

// Start listening immediately; connect DB in the background so a DB outage
// doesn't block startup or fail the health check.
connectDB();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
