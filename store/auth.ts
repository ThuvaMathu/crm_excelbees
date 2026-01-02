import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/hooks/useAuth";

interface AuthState {
  user: User | null;
  loading: boolean;
  hydrated: boolean; // Track if Firebase has confirmed the cached state
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

// Simplified In-Memory Store (No Persistence)
// This ensures we always rely on the live Firebase Auth listener,
// preventing stale cache issues like "Pending -> Dashboard" redirect loops.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true, // Always start loading until Firebase confirms state
  hydrated: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setHydrated: (hydrated) => set({ hydrated }),
  logout: () => set({ user: null, hydrated: false }),
}));
