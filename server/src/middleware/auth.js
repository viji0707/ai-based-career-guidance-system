import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protects routes: requires a valid Bearer JWT for a user who has completed 2FA.
 */
export async function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -otpSecret");
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.otpVerified)
      return res.status(403).json({ message: "2FA not verified" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
