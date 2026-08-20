import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// All required env vars must be present (non-empty).
const hasAllValues = Object.values(firebaseConfig).every(Boolean);

// A valid Firebase Web API key always starts with "AIza" and is 39 characters long.
// Catching this early gives a much clearer error than the generic Firebase
// "auth/api-key-not-valid" message, which usually means the key was mistyped,
// truncated, wrapped in quotes, or copied from the wrong place.
const looksLikeValidApiKey =
  typeof firebaseConfig.apiKey === "string" &&
  /^AIza[0-9A-Za-z_-]{35}$/.test(firebaseConfig.apiKey.trim());

export const firebaseConfigured = hasAllValues && looksLikeValidApiKey;

// Reason is exported so the UI can show a specific, actionable message
// instead of a generic "not configured" string.
export const firebaseConfigError = !hasAllValues
  ? "missing-values"
  : !looksLikeValidApiKey
  ? "invalid-api-key-format"
  : null;

let app = null;
let auth = null;
let db = null;

if (firebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
