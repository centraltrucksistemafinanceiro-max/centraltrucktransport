// Runtime configuration for Firebase and app flags.
// Fill these values tomorrow with your Firebase project settings.
// IMPORTANT: These keys are client-side config and are not secrets, but your Firestore rules must protect your data.

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAirv5_fpoMtnAgFk9iDIMDdLgHI324sRc",
  authDomain: "central-truck-transport.firebaseapp.com",
  projectId: "central-truck-transport",
  storageBucket: "central-truck-transport.firebasestorage.app",
  messagingSenderId: "1019907054389",
  appId: "1:1019907054389:web:ee50d985b06f7f58454a7c"
};

// Enable only in development when you want to seed initial data (admins/drivers).
// Example: window.__ENABLE_SEED__ = true;
window.__ENABLE_SEED__ = false;
