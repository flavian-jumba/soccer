import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase config — values pulled from google-services.json + Firebase Console.
 * To find your full web config:
 *   Firebase Console → Project Settings → General → Your apps → Web app → SDK setup
 */
const firebaseConfig = {
  apiKey: "AIzaSyD4SAPoO2ATJ2oyKdXu71_D11y3sxzy48A",
  authDomain: "titanfootballtips-43797.firebaseapp.com",
  projectId: "titanfootballtips-43797",
  storageBucket: "titanfootballtips-43797.firebasestorage.app",
  messagingSenderId: "856784626649",
  appId: "1:856784626649:android:914c592aafc60ec286efc8",
};

// Prevent re-initialising on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
