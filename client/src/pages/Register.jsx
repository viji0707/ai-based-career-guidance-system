import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api.js";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/register", { username, password });
      setQr(data.qrCode);
      setSecret(data.otpSecret);
      sessionStorage.setItem("setupToken", data.token);
      sessionStorage.setItem("pendingUser", username);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  if (qr) {
    return (
      <div className="card">
        <h2>Set Up 2FA</h2>
        <p>Scan this QR code with Google Authenticator, Authy, or a similar app.</p>
        <img src={qr} alt="2FA QR Code" className="qr" />
        <p>
          Or enter this secret manually: <code>{secret}</code>
        </p>
        <p>Then continue to enter the OTP from your app.</p>
        <button className="btn" onClick={() => navigate("/verify")}>
          Continue to Verify
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Register</h2>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 chars)"
          required
        />
        <button className="btn" type="submit">
          Register
        </button>
      </form>
      <p>
        Already registered? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
