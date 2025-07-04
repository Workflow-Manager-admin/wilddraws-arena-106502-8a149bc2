import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import LoginScreen from "./components/LoginScreen";
import MainGameScreen from "./components/MainGameScreen";
import { FirebaseProvider } from "./firebase/FirebaseContext";

/**
 * PUBLIC_INTERFACE
 * App component entry for Doodle Finder.
 * Handles username-based login state and flow between login/main game screens.
 * 
 * - Shows LoginScreen when username is not set.
 * - On login, transitions to MainGameScreen (route: /play).
 * - On logout, clears username and returns to LoginScreen.
 * Ensures username state flow is robust and race-free.
 */
function App() {
  // Username state (session-scoped, loaded from localStorage on initial mount)
  const [username, setUsername] = useState(() => localStorage.getItem("doodle-username") || "");

  // LocalStorage synchronization (mirror username in localStorage)
  useEffect(() => {
    if (username && username.length > 0) {
      localStorage.setItem("doodle-username", username);
    } else {
      localStorage.removeItem("doodle-username");
    }
  }, [username]);

  // Inner wrapper ensures we can access router hooks for redirecting on username transitions.
  function AppRoutesWithRedirects() {
    const location = useLocation();
    const navigate = useNavigate();

    // On login: auto-redirect to /play if username becomes set
    useEffect(() => {
      if (username && location.pathname === "/") {
        navigate("/play", { replace: true });
      }
    }, [username, location.pathname, navigate]);

    // On logout: auto-redirect back to "/" if on /play but username erased
    useEffect(() => {
      if (!username && location.pathname !== "/") {
        navigate("/", { replace: true });
      }
    }, [username, location.pathname, navigate]);

    return (
      <Routes>
        <Route
          path="/"
          element={
            !username ? (
              // Show LoginScreen and set username on login
              <LoginScreen onLogin={name => setUsername(name)} />
            ) : (
              // If username exists, forward to main game
              <Navigate to="/play" replace />
            )
          }
        />
        <Route
          path="/play"
          element={
            username ? (
              <>
                {/* Header visible only in game mode */}
                <header className="App-header" style={{ background: "var(--bg-secondary)" }}>
                  <h1 className="game-title">🎨 Doodle Finder</h1>
                  {/* Logout button to clear state and return to login */}
                  <button
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 24,
                      background: "#fff3f3",
                      color: "#e74c3c",
                      border: "1px solid #ffdada",
                      borderRadius: 8,
                      padding: "6px 16px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      setUsername("");
                      // Sync removal in useEffect, but force now
                      localStorage.removeItem("doodle-username");
                    }}
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </header>
                <MainGameScreen username={username} />
              </>
            ) : (
              // If username got erased (logout), redirect to login
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="*"
          element={<Navigate to="/" />}
        />
      </Routes>
    );
  }

  return (
    <FirebaseProvider>
      <Router>
        <div className="App">
          <AppRoutesWithRedirects />
        </div>
      </Router>
    </FirebaseProvider>
  );
}

export default App;
