import React, { useState, useEffect } from "react";
import { useFirebase } from "../firebase/FirebaseContext";
import { createRoom, joinRoom } from "../firebase/dbHelpers";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";

// PUBLIC_INTERFACE
function LobbyScreen({ username }) {
  const { realtimeDb } = useFirebase();
  const [roomList, setRoomList] = useState([]);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for rooms
    const roomsRef = ref(realtimeDb, "rooms");
    const unsub = onValue(roomsRef, (snap) => {
      const rooms = snap.val() || {};
      setRoomList(
        Object.values(rooms)
          .filter(room => room.phase === "waiting") // Only joinable rooms
          .slice(0, 8)
      );
    });
    return () => unsub();
  }, [realtimeDb]);

  const handleCreate = async () => {
    setErr("");
    setCreating(true);
    try {
      const newRoomId = await createRoom(realtimeDb, username);
      await joinRoom(realtimeDb, newRoomId, username);
      navigate(`/room/${newRoomId}`);
    } catch (e) {
      setErr("Error creating room.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (roomId) => {
    setErr("");
    setJoining(true);
    try {
      await joinRoom(realtimeDb, roomId, username);
      navigate(`/room/${roomId}`);
    } catch (e) {
      setErr("Error joining room.");
    } finally {
      setJoining(false);
    }
  };

  const handleQuickJoin = async () => {
    if (roomList.length > 0) {
      handleJoin(roomList[0].roomId);
    } else {
      await handleCreate();
    }
  };

  return (
    <div className="container" style={{ maxWidth: "600px", margin: "30px auto", background: "var(--bg-secondary)", padding: "28px", borderRadius: "14px", boxShadow: "0 2px 8px #ddeeef" }}>
      <h2 style={{ fontWeight: 800, fontSize: 28, color: "#0093e3" }}>Hello, {username}! Lobby</h2>
      <div style={{ marginTop: 24, display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <button className="btn" style={{ background: "#72e192", fontWeight: 700 }} disabled={creating} onClick={handleCreate}>Create New Room</button>
        <button className="btn" style={{ background: "#ffe162", fontWeight: 700 }} disabled={joining} onClick={handleQuickJoin}>Quick Join</button>
      </div>
      <div style={{ marginTop: 26 }}>
        <input
          placeholder="Enter Room ID"
          value={roomIdInput}
          onChange={e => setRoomIdInput(e.target.value)}
          style={{ padding: "8px", borderRadius: "6px", border: "1px solid #bbb", fontSize: "16px", marginRight: "10px" }}
        />
        <button className="btn" onClick={() => handleJoin(roomIdInput.trim())} disabled={!roomIdInput || joining}>Join</button>
      </div>
      <h3 style={{ marginTop: 32, color: "#2186d4" }}>Available Rooms</h3>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {roomList.length === 0 && <li>No active rooms. Create one!</li>}
        {roomList.map(room => (
          <li key={room.roomId} style={{ margin: "10px 0", padding: "10px", border: "1px solid #aad3ee", borderRadius: "8px", boxShadow: "0 1px 2px #e8f6ff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>
              <b>Room:</b> {room.roomId.slice(0, 5).toUpperCase()} &nbsp; <b>Host:</b> {room.host}
            </span>
            <button className="btn" onClick={() => handleJoin(room.roomId)} style={{ background: "#bae1ff", color: "#214c73", fontWeight: 700 }}>Join</button>
          </li>
        ))}
      </ul>
      {err && <div style={{ marginTop: 28, color: "#e74c3c", fontWeight: 600 }}>{err}</div>}
    </div>
  );
}

export default LobbyScreen;
