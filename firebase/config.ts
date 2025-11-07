// firebase/config.ts

declare global {
    interface Window {
        firebase: any;
        FIREBASE_CONFIG?: Partial<Record<string, string>>;
    }
}

// Config padrão (pode ser sobrescrito via window.FIREBASE_CONFIG).
const defaultConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

function getConfig() {
  const merged = { ...defaultConfig, ...(window.FIREBASE_CONFIG || {}) } as Record<string, string>;
  const required = ["apiKey", "authDomain", "projectId", "storageBucket", "appId"];
  const missing = required.filter((k) => !merged[k] || merged[k].trim() === "");
  if (missing.length > 0) {
    throw new Error(`Firebase config incompleta. Faltando: ${missing.join(", ")}. Defina window.FIREBASE_CONFIG no index.html.`);
  }
  return merged;
}

let dbInstance: any = null;

export const getFirebaseDb = () => {
    if (dbInstance) {
        return dbInstance;
    }

    if (typeof window.firebase === 'undefined') {
        throw new Error("SDK do Firebase não carregado. Verifique os scripts no index.html.");
    }

    if (!window.firebase.apps.length) {
        const cfg = getConfig();
        try {
            window.firebase.initializeApp(cfg);
        } catch (e) {
            console.error("Falha ao inicializar Firebase:", e);
            throw e;
        }
    }

    dbInstance = window.firebase.firestore();
    return dbInstance;
};
