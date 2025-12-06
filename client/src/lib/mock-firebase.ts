import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

// --- Types ---

export type AssetType = 'image' | 'video' | 'link';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  originalUrl: string;
  createdAt: string;
}

interface User {
  email: string;
}

// --- Auth Store (Mock) ---

interface AuthState {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (email) => set({ user: { email } }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'zetubridge-auth',
    }
  )
);

// --- Asset Store (Mock Firestore) ---

interface AssetStore {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  getAsset: (id: string) => Asset | undefined;
}

export const useAssets = create<AssetStore>()(
  persist(
    (set, get) => ({
      assets: [
        {
          id: 'demo-1',
          name: 'Welcome Image',
          type: 'image',
          originalUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'demo-2',
          name: 'Intro Video',
          type: 'video',
          originalUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          createdAt: new Date().toISOString(),
        }
      ],
      addAsset: (asset) =>
        set((state) => ({
          assets: [
            { ...asset, id: nanoid(10), createdAt: new Date().toISOString() },
            ...state.assets,
          ],
        })),
      updateAsset: (id, updates) =>
        set((state) => ({
          assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),
      deleteAsset: (id) =>
        set((state) => ({
          assets: state.assets.filter((a) => a.id !== id),
        })),
      getAsset: (id) => get().assets.find((a) => a.id === id),
    }),
    {
      name: 'zetubridge-assets',
    }
  )
);
