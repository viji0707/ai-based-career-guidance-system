import { authenticator } from "otplib";
import QRCode from "qrcode";

// 30-second step, allow ±1 step clock drift
authenticator.options = { step: 30, window: 1 };

/** Generate a new base32 TOTP secret. */
export function generateSecret() {
  return authenticator.generateSecret();
}

/** Build an otpauth:// URI for authenticator apps. */
export function generateOTPURI(username, secret) {
  return authenticator.keyuri(username, "AI Career Guidance", secret);
}

/** Verify a 6-digit token against the stored secret. */
export function verifyToken(token, secret) {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/** Render the otpauth URI as a QR code data URL (PNG). */
export async function generateQRCodeDataURL(otpauth) {
  return QRCode.toDataURL(otpauth);
}
