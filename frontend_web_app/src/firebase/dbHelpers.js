import {
  ref,
  push,
  set,
  get,
  onValue,
  update,
  remove
} from "firebase/database";

// PUBLIC_INTERFACE
export const createRoom = async (realtimeDb, hostUsername) => {
  const roomRef = push(ref(realtimeDb, "rooms"));
  const roomId = roomRef.key;
  const newRoom = {
    roomId,
    host: hostUsername,
    users: {
      [hostUsername]: {
        username: hostUsername,
        score: 0,
        joinedAt: Date.now()
      }
    },
    phase: "waiting", // waiting, drawing, guessing, voting, results
    createdAt: Date.now()
  };
  await set(roomRef, newRoom);
  return roomId;
};

// PUBLIC_INTERFACE
export const joinRoom = async (realtimeDb, roomId, username) => {
  const userRef = ref(realtimeDb, `rooms/${roomId}/users/${username}`);
  await set(userRef, {
    username,
    score: 0,
    joinedAt: Date.now()
  });
};

export const listenRoom = (realtimeDb, roomId, onUpdate) => {
  const unsub = onValue(ref(realtimeDb, `rooms/${roomId}`), (snap) => {
    if (snap.exists()) {
      onUpdate(snap.val());
    }
  });
  return () => unsub();
};

// PUBLIC_INTERFACE
export const updateRoom = async (realtimeDb, roomId, data) => {
  const roomRef = ref(realtimeDb, `rooms/${roomId}`);
  await update(roomRef, data);
};

// PUBLIC_INTERFACE
export const removeRoom = async (realtimeDb, roomId) => {
  await remove(ref(realtimeDb, `rooms/${roomId}`));
};
