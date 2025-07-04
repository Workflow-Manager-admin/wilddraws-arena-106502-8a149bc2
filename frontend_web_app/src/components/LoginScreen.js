import React, { useState } from "react";

const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;

// PUBLIC_INTERFACE
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (!usernameRegex.test(username)) {
      setError("Username must be 3-15 characters. Letters, numbers, _ only.");
      return;
    }
    setError("");
    onLogin(username);
  };

  return (
    <div className="container" style={{
      margin: "40px auto",
      maxWidth: "420px",
      background: "var(--bg-secondary)",
      borderRadius: "18px",
      boxShadow: "0 2px 16px #c8d8f0",
      padding: "36px"
    }}>
      <h2 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 30 }}>Welcome to Doodle Finder!</h2>
      <form onSubmit={handleLogin} style={{ marginTop: 32 }}>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          maxLength={15}
          onChange={e => setUsername(e.target.value.replace(/\s/g, ""))}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            fontSize: "18px",
            marginBottom: "18px"
          }}
          required
        />
        <button
          type="submit"
          className="btn btn-large"
          style={{
            width: "100%",
            padding: "14px",
            background: "var(--button-bg)",
            color: "var(--button-text)",
            fontWeight: 600,
            fontSize: "18px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 2px 8px #daf2ff"
          }}
        >Play!</button>
        {error && <div style={{ color: "#e74c3c", marginTop: 18, fontWeight: 600 }}>{error}</div>}
      </form>
      <p style={{
        marginTop: 40,
        color: "#5b556e",
        fontStyle: "italic"
      }}><span role="img" aria-label="sparkles">🌈</span> Modern. Playful. Guess. Draw. Vote. Win.</p>
    </div>
  );
}

export default LoginScreen;
