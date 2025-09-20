"use client";
import { useZustandSession } from "@/hooks/useSessionStore";

export default function ZustandSessionInitializer() {
  useZustandSession();
  return null;
}
