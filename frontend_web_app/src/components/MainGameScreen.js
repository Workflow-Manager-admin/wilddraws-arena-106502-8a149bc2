import React, { useEffect, useState, useRef } from "react";
import { useFirebase } from "../firebase/FirebaseContext";
import {
  joinGlobalSession,
  listenGlobalSession,
  updateGlobalSession,
  getGlobalSession
} from "../firebase/dbHelpers";
import DrawingCanvas from "./game/DrawingCanvas";
import WheelSpinner from "./game/WheelSpinner";
import GuessesFeed from "./game/GuessesFeed";
import VotingBoard from "./game/VotingBoard";
import { uploadImageToImgbb } from "./game/imgbbHelpers";

/**
 * Phase flow:
 * waiting -> drawing -> guessing -> voting -> results -> waiting
 * One phase is active for all users globally.
 */

const NAMES = [
  "Elephant", "Sparrow", "Giraffe", "Eagle", "Kangaroo", "Duck", "Penguin",
  "Lion", "Parrot", "Bear", "Owl", "Horse", "Rabbit", "Raccoon", "Fox"
];

/**
 * PUBLIC_INTERFACE
 * MainGameScreen: Multiplayer real-time drawing/guessing game UI.
 * Now includes local error boundary and debug phase indicators for analysis.
 */
function MainGameScreen({ username }) {
  const { realtimeDb } = useFirebase();
  const [session, setSession] = useState(null);
  const [phase, setPhase] = useState("waiting");
  const [timer, setTimer] = useState(30);
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawingWord, setDrawingWord] = useState("");
  const [userDrawingUrl, setUserDrawingUrl] = useState("");
  const [winner, setWinner] = useState(null);
  const [localError, setLocalError] = useState(null);
  const timerRef = useRef();

  // Join global session on mount and start listening to global session changes
  useEffect(() => {
    joinGlobalSession(realtimeDb, username);
    const unsub = listenGlobalSession(realtimeDb, (sess) => {
      setSession(sess);
      setPhase(sess?.phase || "waiting");
      setDrawingWord(sess?.currentWord || "");
      if (sess?.phase === "results" && sess.winner) setWinner(sess.winner);
    });
    return () => unsub && unsub();
    // eslint-disable-next-line
  }, [realtimeDb, username]);

  // TIMER: Start/clear interval for each phase
  useEffect(() => {
    if (!session || !["drawing", "guessing", "voting"].includes(phase)) {
      clearInterval(timerRef.current);
      setTimer(30);
      return;
    }
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line
  }, [phase]);

  // On timer hit zero, auto-submit if user hasn't acted for this phase
  useEffect(() => {
    if (!session || timer > 0) return;
    if (phase === "drawing" && (!session.drawings || !session.drawings[username])) {
      handleDrawingSubmit("");
    }
    if (phase === "guessing" && (!session.guesses || !session.guesses[username])) {
      handleGuessSubmit("");
    }
    if (phase === "voting" && (!session.votes || !session.votes[username])) {
      handleVoteSubmit("");
    }
    // eslint-disable-next-line
  }, [timer]);

  // Start new round (as any user)
  const startGame = async () => {
    if (!session.users || Object.keys(session.users).length < 2) return; // At least 2 players needed
    setIsSpinning(true);
    const wordIdx = Math.floor(Math.random() * NAMES.length);
    const chosenWord = NAMES[wordIdx];
    setDrawingWord(chosenWord);
    await updateGlobalSession(realtimeDb, {
      phase: "drawing",
      currentWord: chosenWord,
      turnStart: Date.now(),
      guesses: {},
      drawings: {},
      votes: {},
      winner: null,
    });
    setTimeout(() => setIsSpinning(false), 1300);
  };

  // Drawing submit
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
    await updateGlobalSession(realtimeDb, {
      [`drawings/${username}`]: {
        username,
        imgUrl,
        submittedAt: Date.now()
      }
    });
    // If all users have submitted, advance phase
    setTimeout(async () => {
      const global = await getGlobalSession(realtimeDb);
      if (
        global &&
        Object.keys(global.drawings || {}).length === Object.keys(global.users || {}).length
      ) {
        await updateGlobalSession(realtimeDb, {
          phase: "guessing",
          turnStart: Date.now()
        });
      }
    }, 500);
  };

  // Guess submit
  const handleGuessSubmit = async (guessText) => {
    await updateGlobalSession(realtimeDb, {
      [`guesses/${username}`]: {
        username,
        guess: guessText,
        submittedAt: Date.now()
      }
    });
    setTimeout(async () => {
      const global = await getGlobalSession(realtimeDb);
      if (
        global &&
        Object.keys(global.guesses || {}).length === Object.keys(global.users || {}).length
      ) {
        await updateGlobalSession(realtimeDb, {
          phase: "voting",
          turnStart: Date.now()
        });
      }
    }, 500);
  };

  // Vote submit
  const handleVoteSubmit = async (drawingUsername) => {
    if (drawingUsername === username) return; // no self-vote
    await updateGlobalSession(realtimeDb, {
      [`votes/${username}`]: {
        username,
        target: drawingUsername,
        votedAt: Date.now()
      }
    });
    setTimeout(async () => {
      const global = await getGlobalSession(realtimeDb);
      // If all votes cast, tally winner
      if (
        global &&
        Object.keys(global.votes || {}).length === (Object.keys(global.users || {}).length - 1)
      ) {
        const results = {};
        Object.values(global.votes).forEach(({ target }) => {
          if (!target) return;
          results[target] = (results[target] || 0) + 1;
        });
        let maxVotes = 0, winnerUser = null;
        Object.keys(results).forEach(u => {
          if (results[u] > maxVotes) {
            maxVotes = results[u];
            winnerUser = u;
          }
        });
        await updateGlobalSession(realtimeDb, {
          phase: "results",
          winner: winnerUser
            ? {
                username: winnerUser,
                imgUrl: global.drawings[winnerUser]?.imgUrl,
                word: global.currentWord,
                votes: maxVotes,
              }
            : null,
          turnStart: Date.now()
        });
      }
    }, 500);
  };

  // ERROR BOUNDARY/DEBUG UI WRAPPER
  try {
    if (localError) {
      return (
        <div style={{
          padding: '48px',
          margin: '40px auto',
          border: '2px solid #e74c3c',
          borderRadius: 14,
          background: '#fff3f3',
          color: '#be3b20',
          maxWidth: 580,
          textAlign: 'left'
        }}>
          <h2 style={{color:'#e74c3c'}}>Game UI Fatal Error</h2>
          <pre>{localError.message || String(localError)}</pre>
          <p>
            <b>Component:</b> MainGameScreen<br/>
            <b>Username Prop:</b> {String(username)}
          </p>
        </div>
      );
    }

    if (!session) {
      return (
        <div style={{
          color: "#555",
          margin: "56px auto 0",
          fontSize: 28,
          fontWeight: 700,
          background: "#eafffb",
          borderRadius: 12,
          padding: "36px 18px",
          maxWidth: 420,
          border: "2px dashed #b1f7ee"
        }}>
          Loading game session...
          <span style={{display:'block',marginTop:'10px',fontSize:'0.65em',color:'#1ba8bb'}}>Waiting for server state or network connection.</span>
        </div>
      );
    }
    if (!session.users || !session.users[username]) {
      return (
        <div style={{
          color: "#fff",
          background: "#db3467",
          padding: "44px 22px",
          margin: "36px auto",
          borderRadius: 14,
          maxWidth: 540,
          fontWeight: 600,
          fontSize: 24,
          border: "2px solid #fff"
        }}>
          <div style={{fontSize:32}}>⛔</div>
          <div>You are not in the global game session.</div>
          <div style={{fontSize:14,marginTop:8}}>Username: <b>{username}</b></div>
        </div>
      );
    }

    // --- UI for each phase ---
    return (
      <div className="container"
        style={{
          background: "#fafdff",
          minHeight: "82vh",
          margin: "0 auto",
          borderRadius: "16px",
          boxShadow: "0 4px 20px #e6f3fc",
          maxWidth: 850,
          padding: 20
        }}>
        {/* Debug info for phase/user */}
        <div style={{fontSize:13, color: "#c4b900", marginBottom:6}}>[Debug] Phase: <b>{phase}</b> | User: <b>{username}</b> | Session users: {session && session.users && Object.keys(session.users).join(",")}</div>
        <h2 style={{ color: "#1296f4", fontWeight: 800, marginTop: 14 }}>Welcome, {username}!</h2>
        <p><b>Players:</b> {
          Object.keys(session.users)
            .map(u => <span key={u} style={u === username ? { color: "#0fa080", fontWeight: 700 } : {}}>{u}</span>)
            .reduce((prev, curr) => [prev, ", ", curr])
        }</p>
        {phase === "waiting" &&
          <>
            <div style={{ margin: "20px 0" }}>
              <p>Waiting for players... (Min 2 required to start)</p>
              <button className="btn" style={{ background: "#00e2b5", fontWeight: 700 }} disabled={Object.keys(session.users).length < 2 || isSpinning} onClick={startGame}>
                {isSpinning ? "Spinning..." : "Start Game & Spin Wheel"}
              </button>
            </div>
          </>
        }
        {phase === "drawing" &&
          <>
            <h3 style={{ color: "#1198a5" }}>
              Draw this: <WheelSpinner spin={isSpinning} value={session.currentWord || drawingWord} />
            </h3>
            <div style={{ margin: "18px 0" }}>
              <DrawingCanvas
                key={username + "-draw"}
                isActive={true}
                onSubmit={handleDrawingSubmit}
                timer={timer}
                disabled={Boolean(session.drawings?.[username])}
                label="It's your turn to draw!"
              />
            </div>
            <b>Time left: {timer}</b>
          </>
        }
        {phase === "guessing" &&
          <>
            <h3 style={{ color: "#236cab" }}>Time to guess! What was drawn?</h3>
            <GuessesFeed
              room={session}
              timer={timer}
              username={username}
              onSubmitGuess={handleGuessSubmit}
            />
            <span>Time left: <b>{timer}</b></span>
          </>
        }
        {phase === "voting" &&
          <>
            <VotingBoard
              username={username}
              users={session.users}
              drawings={session.drawings}
              votes={session.votes || {}}
              onSubmitVote={handleVoteSubmit}
              timer={timer}
            />
            <b>Time left: {timer}</b>
          </>
        }
        {phase === "results" && winner &&
          <div style={{
            background: "#ffffff",
            border: "2px dashed #babaff",
            borderRadius: 14,
            marginTop: 32,
            padding: 22
          }}>
            <h2 style={{ color: "#4242e2" }}>🏆 Winner: <u>{winner.username}</u>!</h2>
            <p><b>Correct word:</b> <span style={{ color: "#15c21b" }}>{winner.word}</span></p>
            {winner.imgUrl &&
              <img src={winner.imgUrl} alt="winner drawing" style={{ width: 220, borderRadius: 8, boxShadow: "0 1px 4px #eee" }} />}
            <br />
            <button
              className="btn"
              style={{ marginTop: 18, background: "#812be0", color: "#fff" }}
              onClick={() =>
                updateGlobalSession(realtimeDb, {
                  phase: "waiting",
                  winner: null,
                  drawings: {},
                  guesses: {},
                  votes: {},
                  currentWord: "",
                })
              }
            >Back to Waiting Room</button>
          </div>
        }
      </div>
    );
  } catch (err) {
    setTimeout(() => setLocalError(err), 8);
    return null;
  }
}

export default MainGameScreen;
