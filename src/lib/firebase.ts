import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDb3IdGmPbQIJA8yvbnRkXyIj03Hm0vzLo",
  authDomain: "varanasi-c7b05.firebaseapp.com",
  projectId: "varanasi-c7b05",
  storageBucket: "varanasi-c7b05.firebasestorage.app",
  messagingSenderId: "588039713764",
  appId: "1:588039713764:web:ddae161a12bfa9ec6dcdf1",
  measurementId: "G-0PQ7L52PJB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (only in browser)
export const initAnalytics = async () => {
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
