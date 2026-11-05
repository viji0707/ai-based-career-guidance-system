import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    // Hashed password (bcrypt) — never store plaintext
    password: { type: String, required: true },
    // TOTP shared secret used by authenticator apps
    otpSecret: { type: String, required: true },
    // Becomes true once the user completes 2FA setup
    otpVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
