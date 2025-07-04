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
          {/* Header should show, but the main content should be the routed content */}
          <header className="App-header" style={{ background: "var(--bg-secondary)" }}>
            <h1 className="game-title">🎨 Doodle Finder</h1>
          </header>
          {/* Routing for login/main game screens */}
          <Routes>
            <Route
              path="/"
              element={(
                username
                  ? <Navigate to="/play" replace />
                  : <LoginScreen onLogin={name => {
                      setUsername(name);
                    }} />
              )}
            />
            <Route
              path="/play"
              element={(
                username
                  ? <MainGameScreen username={username} />
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
