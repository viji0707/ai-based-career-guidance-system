import mongoose from "mongoose";

/**
 * Connect to MongoDB using the URI in env, falling back to a local instance.
 */
export async function connectDB() {
  const uri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/career_guidance";
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}
