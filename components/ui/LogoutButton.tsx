"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button className="fixed right-7 p-3 rounded-full bg-indor-black top-5 xl:top-auto xl:bottom-5 hover:cursor-pointer" onClick={() => signOut({redirectTo: "/"})}>
      <LogOut color="white" strokeWidth={2} />
    </button>
  );
}
