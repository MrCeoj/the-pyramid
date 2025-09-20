// store/sessionStore.ts
import { create } from "zustand";
import { Session } from "next-auth";

interface SessionState {
  session: Session | null;
  setSession: (session: Session | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
}));