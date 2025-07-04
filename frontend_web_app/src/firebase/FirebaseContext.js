import React, { createContext, useContext } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

/**
 * PUBLIC_INTERFACE
 * FirebaseContext provides Firebase app, Realtime DB, and Firestore to the component tree.
 * 
 * Firebase config is loaded from environment variables:
 * 
 *   REACT_APP_FIREBASE_API_KEY
 *   REACT_APP_FIREBASE_AUTH_DOMAIN
 *   REACT_APP_FIREBASE_DB_URL
 *   REACT_APP_FIREBASE_PROJECT_ID
 *   REACT_APP_FIREBASE_BUCKET
 *   REACT_APP_FIREBASE_SENDER_ID
 *   REACT_APP_FIREBASE_APP_ID
 * 
 * See .env.example for details. See the project README for instructions.
 */

function getFirebaseConfigFromEnv() {
  // Reads config from process.env and throws an actionable error if missing.
  const config = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };

  const missing = Object.entries(config)
    .filter(([k, v]) => !v || v.includes("<YOUR"))
    .map(([k]) => k);
  if (missing.length > 0) {
    const msg =
      "FIREBASE CONFIG ERROR: Please set the following env vars in your .env file in frontend_web_app:\n" +
      missing.map(k => `  REACT_APP_${k.toUpperCase()}`).join("\n") +
      "\nRefer to .env.example in the project directory.";
    throw new Error(msg);
  }
  return config;
}

const FirebaseContext = createContext(null);

export const FirebaseProvider = ({ children }) => {
  let app, realtimeDb, firestore;
  try {
    const firebaseConfig = getFirebaseConfigFromEnv();
    app = initializeApp(firebaseConfig);
    realtimeDb = getDatabase(app);
    firestore = getFirestore(app);
  } catch (e) {
    // Surface config errors to UI if encountered
    return (
      <div style={{ color: "#e74c3c", background: "#fff3f3", padding: 32 }}>
        <h3>Firebase Configuration Error</h3>
        <pre style={{ color: "#be3b20" }}>{e.message}</pre>
        <p>
          Please check your <b>.env</b> file in <b>frontend_web_app/</b> and set the required Firebase settings.<br />
          The app cannot start without valid Firebase configuration.
        </p>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ app, realtimeDb, firestore }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// PUBLIC_INTERFACE
export const useFirebase = () => useContext(FirebaseContext);
