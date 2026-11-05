import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import {
  generateSecret,
  generateOTPURI,
  verifyToken,
  generateQRCodeDataURL,
} from "../utils/otp.js";

/** Sign a full-session JWT. */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

/** POST /api/auth/register */
export async function register(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "Username and password required" });
    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });

    const existing = await User.findOne({ username });
    if (existing)
      return res.status(409).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const secret = generateSecret();
    const user = await User.create({
      username,
      password: hashed,
      otpSecret: secret,
    });

    const otpauth = generateOTPURI(username, secret);
    const qrCode = await generateQRCodeDataURL(otpauth);

    // Short-lived token to confirm 2FA setup
    const token = jwt.sign(
      { id: user._id, purpose: "setup" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    res.status(201).json({
      message: "Scan the QR code, then enter the OTP from your app to confirm.",
      otpSecret: secret,
      qrCode,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/** POST /api/auth/login */
export async function login(req, res) {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // Short-lived pre-2FA token
    const token = jwt.sign(
      { id: user._id, purpose: "login" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    res.json({ message: "2FA required", token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/** POST /api/auth/verify  — completes either setup or login */
export async function verify2FA(req, res) {
  try {
    const { token, otp } = req.body;
    if (!token || !otp)
      return res.status(400).json({ message: "Token and OTP required" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!verifyToken(otp, user.otpSecret))
      return res.status(401).json({ message: "Invalid OTP" });

    // A valid OTP proves the authenticator is set up
    if (!user.otpVerified) {
      user.otpVerified = true;
      await user.save();
    }

    const authToken = signToken(user._id);
    res.json({ message: "Verified", token: authToken, username: user.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
