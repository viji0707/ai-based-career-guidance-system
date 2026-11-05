import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Verify() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const token =
      sessionStorage.getItem("setupToken") ||
      sessionStorage.getItem("pre2faToken");

    if (!token) {
      setError("Session expired. Please login or register again.");
      navigate("/login");
      return;
    }

    try {
      const { data } = await api.post("/auth/verify", { token, otp });
      sessionStorage.removeItem("setupToken");
      sessionStorage.removeItem("pre2faToken");
      sessionStorage.removeItem("pendingUser");
      login(data.token, data.username);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    }
  };

  return (
    <div className="card">
      <h2>2FA Verification</h2>
      <p>Enter the 6-digit code from your authenticator app.</p>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          maxLength={6}
          required
        />
        <button className="btn" type="submit">
          Verify
        </button>
      </form>
    </div>
  );
}
