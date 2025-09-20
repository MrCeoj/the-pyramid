// hooks/useZustandSession.ts
"use client"
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSessionStore } from "@/stores/sessionStore";

export const useZustandSession = () => {
  const { data: session, status } = useSession();
  const setSession = useSessionStore((state) => state.setSession);

  useEffect(() => {
    if (session) {
      setSession(session);
    } else if (status === "unauthenticated") {
      setSession(null);
    }
  }, [session, status, setSession]);
  return useSessionStore((state) => state.session);
};