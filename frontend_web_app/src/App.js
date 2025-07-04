import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import LoginScreen from "./components/LoginScreen";
import LobbyScreen from "./components/LobbyScreen";
import RoomScreen from "./components/RoomScreen";
import WinnerScreen from "./components/WinnerScreen";
import { FirebaseProvider } from "./firebase/FirebaseContext";

// PUBLIC_INTERFACE
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
          <header className="app-header" style={{ background: "var(--bg-secondary)" }}>
            <h1 className="game-title">🎨 Doodle Finder</h1>
          </header>
          <Routes>
            <Route
              path="/"
              element={
                username ? <Navigate to="/lobby" replace /> :
                  <LoginScreen onLogin={setUsername} />
              }
            />
            <Route
              path="/lobby"
              element={
                username ?
                  <LobbyScreen username={username} /> :
                  <Navigate to="/" replace />
              }
            />
            <Route
              path="/room/:roomId"
              element={
                username ?
                  <RoomScreen username={username} /> :
                  <Navigate to="/" replace />
              }
            />
            <Route
              path="/winner/:roomId"
              element={
                username ?
                  <WinnerScreen username={username} /> :
                  <Navigate to="/" replace />
              }
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
