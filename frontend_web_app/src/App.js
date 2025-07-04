import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import LoginScreen from "./components/LoginScreen";
import MainGameScreen from "./components/MainGameScreen";
import { FirebaseProvider } from "./firebase/FirebaseContext";

/**
 * PUBLIC_INTERFACE
 * App component with NO room/lobby logic; all users are in a single global game session.
 */
function App() {
  const [username, setUsername] = useState(() => localStorage.getItem("doodle-username") || "");

  useEffect(() => {
    if (username) {
      localStorage.setItem("doodle-username", username);
    }
  }, [username]);

  return (
    <FirebaseProvider>
      <Router>
        <div className="App">
          {/* Routing for login/main game screens */}
          <Routes>
            <Route
              path="/"
              element={(
                !username
                  ? <LoginScreen onLogin={name => setUsername(name)} />
                  : <Navigate to="/play" replace />
              )}
            />
            <Route
              path="/play"
              element={(
                username
                  ? (
                      <>
                        {/* Header *only* inside game, not on login */}
                        <header className="App-header" style={{ background: "var(--bg-secondary)" }}>
                          <h1 className="game-title">🎨 Doodle Finder</h1>
                          {/* Optional Logout for easier flow testing */}
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
                              localStorage.removeItem("doodle-username");
                            }}
                            aria-label="Logout"
                          >
                            Logout
                          </button>
                        </header>
                        <MainGameScreen username={username} />
                      </>
                    )
                  : <Navigate to="/" replace />
              )}
            />
            <Route
              path="*"
              element={<Navigate to="/" />}
            />
          </Routes>
        </div>
      </Router>
    </FirebaseProvider>
  );
}

export default App;
