"use client";
import {
  LogOut,
  User,
  TriangleDashed,
  Users,
  Swords,
  ChevronDown,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useSessionStore } from "@/stores/sessionStore";

export default function UserDropdownMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { session } = useSessionStore();

  const isAdmin = session?.user?.role === "admin";
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (action: string) => {
    setIsOpen(false);

    switch (action) {
      case "profile":
        console.log("Navigate to profile");
        break;
      case "users":
        console.log("Navigate to users management");
        break;
      case "games":
        console.log("Navigate to games management");
        break;
      case "tournaments":
        console.log("Navigate to tournaments");
        break;
      case "logout":
        signOut({ redirectTo: "/" });
        break;
      default:
        break;
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div
      className="z-40 fixed right-5 top-6 md:top-auto md:bottom-5"
      ref={dropdownRef}
    >
      <button
        className="p-3 rounded-full ring-2 ring-indor-brown-light bg-indor-black/80 hover:cursor-pointer flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <User color="white" strokeWidth={2} size={20} />
        <ChevronDown
          color="white"
          strokeWidth={2}
          size={16}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 xl:mb-2 xl:mt-0 xl:bottom-full w-48 bg-indor-black border border-indor-brown-light rounded-lg shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-indor-brown-light">
            <p className="text-white text-sm font-medium">
              {session.user.name || session.user.email}
            </p>
            <p className="text-gray-400 text-xs capitalize">
              {isAdmin ? "Organizador" : "Jugador"}
            </p>
          </div>

          <div className="py-1">
            <button
              onClick={() => handleMenuClick("profile")}
              className="w-full px-4 py-2 text-left text-white hover:bg-indor-brown-light/20 flex items-center gap-3 transition-colors"
            >
              <User size={16} />
              <span>Editar perfil</span>
            </button>

            {isAdmin && (
              <>
                <div className="border-t border-indor-brown-light/30 my-1"></div>

                <button
                  onClick={() => handleMenuClick("users")}
                  className="w-full px-4 py-2 text-left text-white hover:bg-indor-brown-light/20 flex items-center gap-3 transition-colors"
                >
                  <Users size={16} />
                  <span>Organizar usuarios</span>
                </button>

                <button
                  onClick={() => handleMenuClick("games")}
                  className="w-full px-4 py-2 text-left text-white hover:bg-indor-brown-light/20 flex items-center gap-3 transition-colors"
                >
                  <Swords size={16} />
                  <span>Organizar retas</span>
                </button>

                <button
                  onClick={() => handleMenuClick("tournaments")}
                  className="w-full px-4 py-2 text-left text-white hover:bg-indor-brown-light/20 flex items-center gap-3 transition-colors"
                >
                  <TriangleDashed size={16} />
                  <span>Pirámides</span>
                </button>
              </>
            )}

            <div className="border-t border-indor-brown-light/30 my-1"></div>
            <button
              onClick={() => handleMenuClick("logout")}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/20 flex items-center gap-3 transition-colors"
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
