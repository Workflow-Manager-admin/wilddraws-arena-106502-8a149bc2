import {
  ref,
  onValue,
  set,
  update,
  get,
} from "firebase/database";

/**
 * PUBLIC_INTERFACE
 * All real-time multiplayer state is now global (no rooms/lobby).
 * Exposes helpers to manage the global game session for all connected users.
 */

const GLOBAL_GAME_ID = "global-session";

/**
 * PUBLIC_INTERFACE
 * Join the global game session. Creates the user entry (if not present).
 */
export const joinGlobalSession = async (realtimeDb, username) => {
  const userRef = ref(realtimeDb, `sessions/${GLOBAL_GAME_ID}/users/${username}`);
  await set(userRef, {
    username,
    score: 0,
    joinedAt: Date.now()
  });
};

/**
 * PUBLIC_INTERFACE
 * Listen for updates to the global game session.
 * Callback receives the session object ({ users, phase, ... }).
 */
export const listenGlobalSession = (realtimeDb, onUpdate) => {
  const unsub = onValue(ref(realtimeDb, `sessions/${GLOBAL_GAME_ID}`), (snap) => {
    if (snap.exists()) {
      onUpdate(snap.val());
    }
  });
  return () => unsub();
};

/**
 * PUBLIC_INTERFACE
 * Update global session data (stage state, phase progression, etc.)
 */
export const updateGlobalSession = async (realtimeDb, data) => {
  const sessionRef = ref(realtimeDb, `sessions/${GLOBAL_GAME_ID}`);
  await update(sessionRef, data);
};

/**
 * PUBLIC_INTERFACE
 * Get the current global session state.
 */
export const getGlobalSession = async (realtimeDb) => {
  const sessionRef = ref(realtimeDb, `sessions/${GLOBAL_GAME_ID}`);
  const snap = await get(sessionRef);
  return snap.exists() ? snap.val() : null;
};
