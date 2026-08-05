import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

const DEFAULT_DB_URL = "https://babyshow-d072f-default-rtdb.firebaseio.com";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    process.env.FIREBASE_DATABASE_URL ||
    DEFAULT_DB_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "babyshow-d072f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  if (getApps().length > 0) return getApps()[0];

  app = initializeApp(firebaseConfig);
  return app;
}

export function getRTDB(): Database {
  return getDatabase(getFirebaseApp());
}
