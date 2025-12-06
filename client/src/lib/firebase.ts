import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { create } from 'zustand';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyCzxcFvjvYFvbAXwAfMRG3vvtnEvmCyxOQ",
  authDomain: "zetubflip.firebaseapp.com",
  projectId: "zetubflip",
  storageBucket: "zetubflip.firebasestorage.app",
  messagingSenderId: "811300113752",
  appId: "1:811300113752:web:dbc32b6077003d479ae92d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Types ---

export type AssetType = 'image' | 'video' | 'link';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  originalUrl: string;
  createdAt: string; // ISO string
}

// --- Auth Store ---

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => {
  // Set up auth listener immediately
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    set({ user, loading: false });
  });

  return {
    user: null, // Initial state
    loading: true,
    login: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    logout: async () => {
      await firebaseSignOut(auth);
    },
  };
});

// --- Asset Store ---

interface AssetStore {
  assets: Asset[];
  loading: boolean;
  initialized: boolean;
  initialize: () => () => void; // Returns unsubscribe function
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  getAsset: (id: string) => Asset | undefined; // Helper for sync access if loaded
}

export const useAssets = create<AssetStore>((set, get) => ({
  assets: [],
  loading: false,
  initialized: false,
  
  initialize: () => {
    if (get().initialized) return () => {};
    
    set({ loading: true, initialized: true });
    
    const q = query(collection(db, "assets"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Handle server timestamp or missing fields safely
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as Asset[];
      
      set({ assets, loading: false });
    }, (error) => {
      console.error("Error fetching assets:", error);
      set({ loading: false });
    });
    
    return unsubscribe;
  },

  addAsset: async (asset) => {
    await addDoc(collection(db, "assets"), {
      ...asset,
      createdAt: serverTimestamp()
    });
  },

  updateAsset: async (id, updates) => {
    const docRef = doc(db, "assets", id);
    await updateDoc(docRef, updates);
  },

  deleteAsset: async (id) => {
    await deleteDoc(doc(db, "assets", id));
  },

  getAsset: (id) => get().assets.find((a) => a.id === id),
}));

// --- Standalone Fetcher for Public View ---
export async function fetchAssetById(id: string): Promise<Asset | null> {
  try {
    const docRef = doc(db, "assets", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Asset;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching asset by ID:", error);
    return null;
  }
}
