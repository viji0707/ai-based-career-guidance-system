import mongoose from "mongoose";

// Holds the last DB connection error (null when connected). Exposed via
// /api/dbstatus for diagnostics; the server keeps running even if the DB is
// unreachable so we can read the error from the live deployment.
export let dbError = null;

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Connect to MongoDB using the URI in env, falling back to a local instance.
 * Does NOT exit on failure — logs the error so the app can still serve
 * diagnostics (and the build/health check won't fail).
 */
export async function connectDB() {
  const uri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/career_guidance";
  try {
    await mongoose.connect(uri);
    dbError = null;
    console.log("MongoDB connected");
  } catch (err) {
    dbError = err.message;
    console.error("MongoDB connection error:", err.message);
  }
}
