import React, { useState } from "react";

// PUBLIC_INTERFACE
function GuessesFeed({ room, timer, username, onSubmitGuess }) {
  const [guess, setGuess] = useState("");
  const allDrawings = Object.entries(room.drawings || {});

  const handleGuess = (e, drawingUser) => {
    e.preventDefault();
    if (!(guess && guess.trim().length > 0)) return;
    onSubmitGuess(guess.trim());
    setGuess("");
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "18px"
    }}>
      {allDrawings.map(([drawingUser, { imgUrl }]) => (
        <div key={drawingUser} style={{
          background: "#fff",
          border: "2px solid #dbeefd",
          borderRadius: "8px",
          boxShadow: "0 1px 2px #e8f6ff",
          textAlign: "center",
          padding: 12
        }}>
          <div style={{ fontWeight: 600 }}>Doodle by <span style={{ color: "#1276f8" }}>{drawingUser}</span></div>
          {imgUrl ? (
            <img src={imgUrl} alt="drawing" style={{ width: 120, height: 120, borderRadius: 14, marginBottom: 10, background: "#f4f7fc" }} />
          ) : (
            <div style={{ width: 120, height: 120, background: "#f0f0f0", borderRadius: 14, lineHeight: "120px", fontSize: 24 }}><i>...</i></div>
          )}
          {/* No guessing for own drawing */}
          {drawingUser !== username && (
            <form onSubmit={e => handleGuess(e, drawingUser)} style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                type="text"
                placeholder="Your guess"
                disabled={room.guesses?.[username]}
                value={guess}
                onChange={e => setGuess(e.target.value.replace(/[^a-zA-Z ]/g, ""))}
                style={{
                  border: "1px solid #bbb", borderRadius: "5px", padding: 7, fontSize: 15
                }}
                maxLength={30}
              />
              <button className="btn" style={{ background: "#22b2f6", color: "#fff" }} disabled={room.guesses?.[username] || guess.length === 0}>
                Guess!
              </button>
            </form>
          )}
          {drawingUser === username && <div style={{ marginTop: 16, color: "#a0aaae" }}>You cannot guess your own drawing.</div>}
          {room.guesses?.[username] && <div style={{ color: "#1bd16a", marginTop: 14 }}>Guess submitted!</div>}
        </div>
      ))}
    </div>
  );
}

export default GuessesFeed;
