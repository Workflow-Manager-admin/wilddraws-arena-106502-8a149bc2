import React, { useState } from "react";

// PUBLIC_INTERFACE
function VotingBoard({ username, users, drawings, votes, onSubmitVote, timer }) {
  const [selected, setSelected] = useState("");

  const canVoteFor = (u) => u !== username;

  const handleSelect = (u) => {
    if (u === username) return;
    setSelected(u);
  };

  const handleVote = (e) => {
    e.preventDefault();
    if (selected) onSubmitVote(selected);
  };

  return (
    <div>
      <h3 style={{ color: "#571ade" }}>Vote for the best doodle! (not your own)</h3>
      <form onSubmit={handleVote} style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center" }}>
        {Object.entries(drawings || {}).map(([u, { imgUrl }]) => (
          <div key={u} style={{
            border: `3px solid ${selected === u ? "#5cf3c5" : "#eee"}`,
            borderRadius: "15px",
            padding: 14,
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            filter: canVoteFor(u) ? "none" : "grayscale(0.8)"
          }}>
            <div style={{
              fontWeight: 700,
              color: "#3498db",
              marginBottom: 4
            }}>{u}</div>
            {imgUrl ? <img src={imgUrl} alt="drawing" style={{ width: 104, height: 104, borderRadius: 8, marginBottom: 7 }} /> : <div style={{ width: 104, height: 104, background: "#ddd", borderRadius: 8 }} />}
            {canVoteFor(u) && (
              <button type="button" className="btn" style={{ marginTop: 8, background: "#e6a211", color: "#fff", fontWeight: 600 }}
                onClick={() => handleSelect(u)}
                disabled={votes[username]}
              >
                Select
              </button>
            )}
          </div>
        ))}
      </form>
      <div style={{ marginTop: 16 }}>
        <button className="btn btn-large"
          disabled={!selected || votes[username]}
          style={{ background: "#0cbe72", color: "#fff", fontWeight: 800, minWidth: 120 }}
          onClick={handleVote}>
          {votes[username] ? "Voted!" : "Confirm Vote"}
        </button>
      </div>
      <div style={{ marginTop: 10, color: "#888" }}>
        No self-voting allowed. Time left: {timer}
      </div>
    </div>
  );
}

export default VotingBoard;
