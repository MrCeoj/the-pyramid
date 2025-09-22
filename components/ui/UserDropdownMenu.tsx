"use client";
import {
  LogOut,
  User,
  TriangleDashed,
  Users,
  BicepsFlexed,
  Swords,
  ChevronDown,
  ChevronUp,
  House,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import EditProfileModal from "@/components/ui/EditProfileModal";
import {
  getProfileData,
  updateProfile,
  UpdateProfileData,
} from "@/actions/ProfileDataActions";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function UserDropdownMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use both NextAuth session and your session store
  const { data: nextAuthSession, status } = useSession();
  const { session: storeSession } = useSessionStore();
  const router = useRouter();

  // Use NextAuth session as fallback if store session isn't available
  const session = storeSession || nextAuthSession;

  const isAdmin = session?.user?.role === "admin";
  const isMobile = useIsMobile();

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

  const loadProfileData = async () => {
    if (!session?.user?.id) return;

    setIsLoadingProfile(true);
    try {
      const data = await getProfileData(session.user.id);
      setProfileData(data);
    } catch (error) {
      if (error instanceof Error) console.log(error.message);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleProfileSave = async (formData: UpdateProfileData) => {
    try {
      const response = await updateProfile(formData);

      if (response.error) throw new Error(response.error);
      else if (response.success) toast.success("Perfil actualizado.");
      await loadProfileData();
    } catch (error) {
      throw error;
    }
  };

  const handleMenuClick = async (action: string) => {
    setIsOpen(false);

    switch (action) {
      case "profile":
        await loadProfileData();
        setIsProfileModalOpen(true);
        break;
      case "users":
        router.push("/perfiles");
        break;
      case "games":
        if (isAdmin) router.push("/retas");
        else router.push("/mis-retas");
        break;
      case "teams":
        router.push("/equipos");
        break;
      case "tournaments":
        router.push("/piramides");
        break;
      case "logout":
        signOut({ redirectTo: "/" });
        break;
      case "home":
        router.push("/");
      default:
        break;
    }
  };

  if (status === "loading") {
    return (
      <div className="z-40 fixed right-5 top-6 md:top-auto md:bottom-5">
        <div className="p-3 rounded-full ring-2 ring-indor-brown-light bg-indor-black/80 animate-pulse">
          <User color="gray" strokeWidth={2} size={20} />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <>
      <div
        className="z-40 fixed right-5 top-6 md:top-auto md:bottom-5"
        ref={dropdownRef}
      >
        <button
          className="p-3 rounded-full ring-2 ring-indor-brown-light bg-indor-black/80 hover:cursor-pointer flex items-center gap-2 hover:bg-indor-black hover:scale-105 transition-all duration-100"
          onClick={() => setIsOpen(!isOpen)}
        >
          <User color="white" strokeWidth={2} size={20} />
          {isMobile ? (
            <ChevronDown
              color="white"
              strokeWidth={2}
              size={16}
              direction=""
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          ) : (
            <ChevronUp
              color="white"
              strokeWidth={2}
              size={16}
              direction=""
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>

        {isOpen && (
          <div
            className="absolute right-0 mt-2 md:mb-2 md:mt-0 md:bottom-full w-52 bg-indor-black border border-black
           rounded-lg shadow-lg overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-black">
              <p className="text-white text-sm font-medium">
                {session?.user?.name || session?.user?.email}
              </p>
              <p className="text-gray-400 text-xs capitalize">
                {isAdmin ? "Organizador" : "Jugador"}
              </p>
            </div>

            <div className="py-1">
              <button
                onClick={() => handleMenuClick("home")}
                className="w-full px-4 py-2 text-left text-white hover:bg-indor-brown-light/20 flex items-center gap-3 transition-colors"
              >
                <House size={16} />
                <span>Página Principal</span>
              </button>

              <button
                onClick={() => handleMenuClick("profile")}
                disabled={isLoadingProfile}
                className="w-full px-4 py-2 text-left text-white hover:bg-indor-brown-light/20 flex items-center gap-3 transition-colors disabled:opacity-50"
              >
                <User size={16} />
                <span>
                  {isLoadingProfile ? "Cargando..." : "Editar Perfil"}
                </span>
              </button>

              <button
                onClick={() => handleMenuClick("games")}
                className="w-full px-4 py-2 text-left text-white hover:bg-indor-brown-light/20 flex items-center gap-3 transition-colors"
              >
                <Swords size={16} />
                <span>{isAdmin ? "Gestionar Retas" : "Mis Retas"}</span>
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => handleMenuClick("users")}
                    className="w-full px-4 py-2 text-left text-white hover:bg-indor-brown-light/20 flex items-center gap-3 transition-colors"
                  >
                    <Users size={16} />
                    <span>Gestionar Perfiles</span>
                  </button>
                  <button
                    onClick={() => handleMenuClick("teams")}
                    className="w-full px-4 py-2 text-left text-white hover:bg-indor-brown-light/20 flex items-center gap-3 transition-colors"
                  >
                    <BicepsFlexed size={16} />
                    <span>Gestionar Equipos</span>
                  </button>
                  <button
                    onClick={() => handleMenuClick("tournaments")}
                    className="w-full px-4 py-2 text-left text-white hover:bg-indor-brown-light/20 flex items-center gap-3 transition-colors"
                  >
                    <TriangleDashed size={16} />
                    <span>Gestionar Pirámides</span>
                  </button>
                </>
              )}

              <div className="border-t border-black my-1"></div>
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

      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleProfileSave}
        initialData={profileData}
      />
    </>
  );
}