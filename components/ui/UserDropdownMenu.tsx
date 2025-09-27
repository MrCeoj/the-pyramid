// Add this to your existing component, modifications shown with comments

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
  BellDotIcon,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import EditProfileModal from "@/components/ui/EditProfileModal";
import {
  getProfileData,
  updateProfile,
  UpdateProfileData,
} from "@/actions/ProfileDataActions";
import { getUserPendingMatchesCount } from "@/actions/IndexActions";
// ADD THIS IMPORT - you'll need to create this action
import { processExpiredMatchesAction } from "@/actions/ExpiredMatchesActions";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

// ADD THIS INTERFACE for the expired matches modal
interface ExpiredMatchesResult {
  processedCount: number;
  swapsExecuted: number;
  affectedTeams: Array<{
    teamName: string;
    oldPosition: string;
    newPosition: string;
  }>;
}

// ADD THIS COMPONENT for the modal
function ExpiredMatchesModal({ 
  isOpen, 
  onClose, 
  result 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  result: ExpiredMatchesResult | null;
}) {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-indor-black border border-indor-brown-light rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">
          Retas Expiradas Procesadas
        </h3>
        <div className="text-gray-300 space-y-2">
          <p><span className="font-semibold">Retas canceladas:</span> {result.processedCount}</p>
          <p><span className="font-semibold">Intercambios realizados:</span> {result.swapsExecuted}</p>
          
          {result.affectedTeams.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold text-white mb-2">Equipos afectados:</p>
              <div className="space-y-1 text-sm">
                {result.affectedTeams.map((team, index) => (
                  <div key={index} className="bg-indor-brown-light/20 p-2 rounded">
                    <p className="font-medium">{team.teamName}</p>
                    <p className="text-xs text-gray-400">
                      {team.oldPosition} → {team.newPosition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indor-brown-light text-white rounded hover:bg-indor-brown-light/80 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserDropdownMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  // ADD THIS STATE for expired matches modal
  const [expiredMatchesResult, setExpiredMatchesResult] = useState<ExpiredMatchesResult | null>(null);
  const [isExpiredMatchesModalOpen, setIsExpiredMatchesModalOpen] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifsCount, setNotifsCount] = useState(0);

  // Use both NextAuth session and your session store
  const { data: nextAuthSession, status, update } = useSession();
  const { session: storeSession } = useSessionStore();
  const router = useRouter();

  // Use NextAuth session as fallback if store session isn't available
  const session = storeSession || nextAuthSession;

  const isAdmin = session?.user?.role === "admin";
  const isMobile = useIsMobile();

  // ADD THIS FUNCTION to check for expired matches
  const checkExpiredMatches = useCallback(async () => {
    if (!session) return;
    if (!session.user) return;
    if (session.user.role === "admin") return; // Only for players
    
    try {
      const result = await processExpiredMatchesAction();
      if (result && (result.processedCount > 0 || result.swapsExecuted > 0)) {
        setExpiredMatchesResult(result);
        setIsExpiredMatchesModalOpen(true);
        // Refresh notifications count since matches were processed
        loadCount();
      }
    } catch (error) {
      console.error("Error processing expired matches:", error);
      // Don't show error to user since this runs automatically
    }
  }, [session]);

  // memoize function to avoid re-renders
  const loadCount = useCallback(async () => {
    if (!session) {
      return;
    }
    if (!session.user) return;
    if (session.user.role === "admin") return;
    const result = await getUserPendingMatchesCount(session.user.id);
    setNotifsCount(result ? result : 0);
  }, [session]);

  useEffect(() => {
    if (status === "unauthenticated") {
      update();
      return;
    }
  }, [status, update]);

  useEffect(() => {
    loadCount();
    // ADD THIS LINE to check expired matches on component mount
    checkExpiredMatches();
  }, [loadCount, checkExpiredMatches, session]);

  // ... rest of your existing useEffects and functions remain the same ...

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

  const loadProfileData = useCallback(async () => {
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
  }, [session]);

  const handleProfileSave = useCallback(
    async (formData: UpdateProfileData) => {
      try {
        const response = await updateProfile(formData);

        if (response.error) throw new Error(response.error);
        else if (response.success) toast.success("Perfil actualizado.");
        await loadProfileData();
      } catch (error) {
        throw error;
      }
    },
    [loadProfileData]
  );

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
      <Toaster position={isMobile ? "top-center" : "top-right"} />
      <div
        className="z-40 fixed right-5 top-6 md:top-auto md:bottom-5"
        ref={dropdownRef}
      >
        {/* Your existing dropdown button and menu JSX remains exactly the same */}
        <button
          className="p-3 rounded-full ring-2 ring-indor-brown-light bg-indor-black/80 hover:cursor-pointer flex items-center gap-2 hover:bg-indor-black hover:scale-105 transition-all duration-100"
          onClick={() => setIsOpen(!isOpen)}
        >
          {notifsCount > 0 && (
            <span className="absolute bg-red-500 -top-2 -left-2 rounded-full text-white p-1 z-50 animate-pulse">
              <BellDotIcon size={16} />
            </span>
          )}
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

        {/* Your existing dropdown menu JSX remains the same */}
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
                <span>{isAdmin ? "Gestionar Retas" : "Mis Retas"}</span>{" "}
                {notifsCount > 0 && (
                  <span className="text-xs w-2.5 h-2.5 flex items-center justify-center bg-red-500/80 font-bold p-2.5 rounded-full animate-pulse">
                    {notifsCount}
                  </span>
                )}
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

      {/* ADD THIS - New expired matches modal */}
      <ExpiredMatchesModal
        isOpen={isExpiredMatchesModalOpen}
        onClose={() => setIsExpiredMatchesModalOpen(false)}
        result={expiredMatchesResult}
      />
    </>
  );
}