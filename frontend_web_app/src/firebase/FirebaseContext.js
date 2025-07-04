import React, { createContext, useContext } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: Replace the below config with your actual Firebase project values.
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  databaseURL: "YOUR_FIREBASE_DB_URL",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

const FirebaseContext = createContext(null);

export const FirebaseProvider = ({ children }) => {
  const app = initializeApp(firebaseConfig);
  const realtimeDb = getDatabase(app);
  const firestore = getFirestore(app);

  return (
    <FirebaseContext.Provider value={{ app, realtimeDb, firestore }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
