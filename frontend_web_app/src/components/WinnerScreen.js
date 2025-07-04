import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFirebase } from "../firebase/FirebaseContext";
import { listenRoom } from "../firebase/dbHelpers";

// PUBLIC_INTERFACE
function WinnerScreen({ username }) {
  const { realtimeDb } = useFirebase();
  const { roomId } = useParams();
  const [winner, setWinner] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) return;
    const unsub = listenRoom(realtimeDb, roomId, (room) => {
      if (room.phase !== "results") {
        navigate(`/room/${roomId}`);
        return;
      }
      setWinner(room.winner);
    });
    return () => unsub && unsub();
  }, [roomId, realtimeDb, navigate]);

  if (!winner) return <div>Announcing winner...</div>;

  return (
    <div className="container" style={{
      background: "#fafdff",
      minHeight: "82vh",
      margin: "0 auto",
      borderRadius: "16px",
      boxShadow: "0 4px 20px #e6f3fc",
      maxWidth: 850,
      padding: 20
    }}>
      <h2 style={{ color: "#4242e2", marginTop: 40 }}>🏆 Winner: <u>{winner.username}</u>!</h2>
      <p><b>Mystery word:</b> <span style={{ color: "#119e23" }}>{winner.word}</span></p>
      {winner.imgUrl && (
        <img src={winner.imgUrl} alt="winner drawing" style={{ width: 280, borderRadius: 8, boxShadow: "0 1px 4px #eee" }} />
      )}
      <div style={{ marginTop: 50 }}>
        <button className="btn" style={{ background: "#812be0", color: "#fff" }} onClick={() => navigate(`/lobby`)}>Back to Lobby</button>
      </div>
    </div>
  );
}

export default WinnerScreen;
