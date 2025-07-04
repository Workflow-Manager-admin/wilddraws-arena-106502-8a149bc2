import React, { useState, useEffect, useRef } from "react";
import { useFirebase } from "../firebase/FirebaseContext";
import { useParams, useNavigate } from "react-router-dom";
import {
  listenRoom,
  joinRoom,
  updateRoom,
} from "../firebase/dbHelpers";
import DrawingCanvas from "./game/DrawingCanvas";
import WheelSpinner from "./game/WheelSpinner";
import GuessesFeed from "./game/GuessesFeed";
import VotingBoard from "./game/VotingBoard";
import { uploadImageToImgbb } from "./game/imgbbHelpers";

// These animal/bird names will be used in spinner:
const NAMES = [
  "Elephant", "Sparrow", "Giraffe", "Eagle", "Kangaroo", "Duck", "Penguin",
  "Lion", "Parrot", "Bear", "Owl", "Horse", "Rabbit", "Raccoon", "Fox"
];

// PUBLIC_INTERFACE
function RoomScreen({ username }) {
  const { realtimeDb } = useFirebase();
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [userDrawingUrl, setUserDrawingUrl] = useState("");
  const [drawingWord, setDrawingWord] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [timer, setTimer] = useState(30);
  const [phase, setPhase] = useState("waiting");
  const [guesses, setGuesses] = useState([]);
  const [votes, setVotes] = useState({});
  const [winner, setWinner] = useState(null);
  const navigate = useNavigate();
  const timerRef = useRef();

  // Listen to room updates in real-time:
  useEffect(() => {
    if (!roomId) return;
    const unsub = listenRoom(realtimeDb, roomId, (r) => {
      setRoom(r);
      setPhase(r.phase);
      if (r.phase === "results" && r.winner) {
        setWinner(r.winner);
      }
    });
    return () => unsub && unsub();
  }, [roomId, realtimeDb]);

  // Host triggers the game start (draw phase)
  const startGame = async () => {
    if (Object.keys(room.users || {}).length < 2) return; // Needs at least 2
    setIsSpinning(true);
    const wordIdx = Math.floor(Math.random() * NAMES.length);
    const chosenWord = NAMES[wordIdx];
    setDrawingWord(chosenWord);
    await updateRoom(realtimeDb, roomId, {
      phase: "drawing",
      currentWord: chosenWord,
      turnStart: Date.now(),
      guesses: {},
      drawings: {},
      votes: {}
    });
    setTimer(30);
    setTimeout(() => setIsSpinning(false), 1300);
  };

  // Timer effect for drawing, guessing, voting
  useEffect(() => {
    if (!room || (room.phase !== "drawing" && room.phase !== "guessing" && room.phase !== "voting")) return;
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [room && room.phase]);

  // When drawing phase ends, automatically submit blank guess/drawing if missed
  useEffect(() => {
    if (timer > 0) return;
    if (room?.phase === "drawing" && !userDrawingUrl) {
      // Drawing phase ended, didn't submit, submit blank/placeholder drawing for user
      handleDrawingSubmit("");
    }
    if (room?.phase === "guessing" && !guesses.find(g => g.username === username)) {
      handleGuessSubmit("");
    }
    if (room?.phase === "voting" && Object.keys(votes).length === 0) {
      handleVoteSubmit("");
    }
    // eslint-disable-next-line
  }, [timer]);

  // Submit drawing to imgbb
  const handleDrawingSubmit = async (imgDataUrl) => {
    setUserDrawingUrl(imgDataUrl);
    let imgUrl = "";
    if (imgDataUrl) {
      try {
        imgUrl = await uploadImageToImgbb(imgDataUrl);
      } catch (e) {
        imgUrl = "";
      }
    }
    await updateRoom(realtimeDb, roomId, {
      [`drawings/${username}`]: {
        username,
        imgUrl,
        submittedAt: Date.now()
      }
    });
    // If all users have submitted, advance phase to "guessing"
    setTimeout(async () => {
      const updatedRoom = (await room); // This is not ideal; in a real app fetch room state on server
      if (Object.keys(updatedRoom.drawings || {}).length === Object.keys(updatedRoom.users || {}).length) {
        await updateRoom(realtimeDb, roomId, {
          phase: "guessing",
          turnStart: Date.now(),
        });
        setTimer(30);
      }
    }, 500);
  };

  // Handle guesses
  const handleGuessSubmit = async (guessText) => {
    await updateRoom(realtimeDb, roomId, {
      [`guesses/${username}`]: {
        username,
        guess: guessText,
        submittedAt: Date.now()
      }
    });
    // If all guesses submitted, advance phase to "voting"
    setTimeout(async () => {
      const updatedRoom = (await room);
      if (
        updatedRoom.guesses && (Object.keys(updatedRoom.guesses).length === Object.keys(updatedRoom.users || {}).length)
      ) {
        await updateRoom(realtimeDb, roomId, {
          phase: "voting",
          turnStart: Date.now()
        });
        setTimer(30);
      }
    }, 500);
  };

  // Handle votes
  const handleVoteSubmit = async (drawingUsername) => {
    // Don't allow voting for self
    if (drawingUsername === username) return;
    await updateRoom(realtimeDb, roomId, {
      [`votes/${username}`]: {
        username,
        target: drawingUsername,
        votedAt: Date.now()
      }
    });
    setVotes((votes) => ({
      ...votes,
      [username]: drawingUsername
    }));

    // If all votes cast, calculate winner
    setTimeout(async () => {
      const updatedRoom = (await room);
      if (
        updatedRoom.votes && Object.keys(updatedRoom.votes).length === Object.keys(updatedRoom.users || {}).length - 1
      ) {
        // Tally votes
        const results = {};
        Object.values(updatedRoom.votes).forEach(({ target }) => {
          if (!target) return;
          results[target] = (results[target] || 0) + 1;
        });
        let maxVotes = 0, winner = null;
        Object.keys(results).forEach(u => {
          if (results[u] > maxVotes) {
            maxVotes = results[u];
            winner = u;
          }
        });
        await updateRoom(realtimeDb, roomId, {
          phase: "results",
          winner: winner ? {
            username: winner,
            imgUrl: updatedRoom.drawings[winner]?.imgUrl,
            word: updatedRoom.currentWord,
            votes: maxVotes,
          } : null,
          turnStart: Date.now()
        });
        setTimeout(() => navigate(`/winner/${roomId}`), 1100);
      }
    }, 500);
  };

  // UI Rendering for all phases
  if (!room) return <div>Loading room...</div>;
  if (!room.users[username]) return <div>You are not part of this room.</div>;

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
      <h2 style={{ color: "#1296f4", fontWeight: 800, marginTop: 14 }}>{`Room: ${roomId.slice(0, 6).toUpperCase()}`}</h2>
      <p><b>Players:</b> {
        Object.keys(room.users)
          .map(u => u === room.host ? <b key={u}><u>{u}</u> (👑)</b> : <span key={u}>{u}</span>)
          .reduce((prev, curr) => [prev, ", ", curr])
      }</p>
      <div style={{ margin: "20px 0" }}>
        {(phase === "waiting" && username === room.host) &&
          <>
            <p>Waiting for players... You need at least 2 players.</p>
            <button className="btn" style={{ background: "#00e2b5", fontWeight: 700 }} disabled={Object.keys(room.users).length < 2 || isSpinning} onClick={startGame}>
              {isSpinning ? "Spinning..." : "Start Game & Spin Wheel"}
            </button>
          </>
        }
        {(phase === "waiting" && username !== room.host) &&
          <span>Waiting for host to start the game...</span>}
      </div>
      {(phase === "drawing") && <>
        <h3 style={{ color: "#1198a5" }}>
          Draw this: <WheelSpinner spin={isSpinning} value={room.currentWord || drawingWord} />
        </h3>
        <div style={{ margin: "18px 0" }}>
          <DrawingCanvas
            key={username + "-draw"}
            isActive={true}
            onSubmit={handleDrawingSubmit}
            timer={timer}
            disabled={userDrawingUrl}
            label="It's your turn to draw!"
          />
        </div>
        <b>Time left: {timer}</b>
      </>}
      {(phase === "guessing") && <>
        <h3 style={{ color: "#236cab" }}>Time to guess! What was drawn?</h3>
        <GuessesFeed
          room={room}
          timer={timer}
          username={username}
          onSubmitGuess={handleGuessSubmit}
        />
        <span>Time left: <b>{timer}</b></span>
      </>}
      {(phase === "voting") && <>
        <VotingBoard
          username={username}
          users={room.users}
          drawings={room.drawings}
          votes={votes}
          onSubmitVote={handleVoteSubmit}
          timer={timer}
        />
        <b>Time left: {timer}</b>
      </>}
      {(phase === "results") && winner &&
        <div style={{
          background: "#ffffff",
          border: "2px dashed #babaff",
          borderRadius: 14,
          marginTop: 32,
          padding: 22
        }}>
          <h2 style={{ color: "#4242e2" }}>🏆 Winner: <u>{winner.username}</u>!</h2>
          <p><b>Correct word:</b> <span style={{ color: "#15c21b" }}>{winner.word}</span></p>
          <img src={winner.imgUrl} alt="winner drawing" style={{ width: 220, borderRadius: 8, boxShadow: "0 1px 4px #eee" }} />
          <br />
          <button className="btn" style={{ marginTop: 18, background: "#812be0", color: "#fff" }} onClick={() => navigate(`/lobby`)}>Back to Lobby</button>
        </div>
      }
    </div>
  );
}

export default RoomScreen;
