import { db } from "@/lib/drizzle";
import { eq, desc } from "drizzle-orm";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import PyramidDisplay from "@/components/pyramidPlayer/PyramidDisplay";
import AdminPyramidSelector from "./AdminPyramidSelector";
import UserDropdownMenu from "@/components/ui/UserDropdownMenu";
import { getAllPyramidsTotal, getPlayerPyramid } from "@/actions/IndexActions";
import { PyramidHydrator } from "@/components/wrappers/PyramidHydrator";
import ZustandSessionInitializer from "@/components/wrappers/ZustandSessionInitializer";
import { pyramid } from "@/db/schema";
import { getUserTeamId } from "@/actions/IndexActions";

export default async function Home() {
  const session = await auth();
  
  const result = await getUserTeamId(session!.user.id);
  let userTeamId: number | null | undefined;
  if ("error" in result) {
    console.error(result.error);
    userTeamId = null;
  } else {
    userTeamId = result.teamId;
  }

  if (!session?.user?.id) {
    return (
      <main className="h-screen flex flex-col justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso no permitido</h1>
          <p className="mb-4">Inicia sesión para ver una pirámide.</p>
          <UserDropdownMenu />
        </div>
      </main>
    );
  }

  const userData = await db
    .select({
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!userData.length) {
    return (
      <main className="h-screen flex flex-col justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Usuario no encontrado</h1>
          <UserDropdownMenu />
        </div>
      </main>
    );
  }

  const userRole = userData[0].role;

  if (userRole === "admin") {
    const allPyramids = await getAllPyramidsTotal();

    if (allPyramids.length === 0) {
      return (
        <main className="h-screen flex flex-col">
          <ZustandSessionInitializer />
          {/* Fixed header with selector */}
          <div className="fixed top-4 right-4 z-50">
            <UserDropdownMenu />
          </div>

          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">
                No hay pirámides disponibles.
              </h1>
              <p className="mb-4">
                No existen pirámides activas en este momento.
              </p>
            </div>
          </div>
        </main>
      );
    }

    // Get the latest updated pyramid as default
    const latestPyramid = await db
      .select()
      .from(pyramid)
      .orderBy(desc(pyramid.updatedAt))
      .limit(1);

    const defaultPyramidId =
      latestPyramid.length > 0 ? latestPyramid[0].id : null;

    return (
      <main className="h-screen flex flex-col justify-start">
        <ZustandSessionInitializer />

        {/* Fixed header with pyramid selector and logout */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
          <PyramidHydrator
            pyramids={allPyramids}
            defaultPyramidId={defaultPyramidId}
          />
          <UserDropdownMenu />
        </div>

        {/* Main content area - AdminPyramidSelector handles all rendering */}
        <div className="flex flex-col justify-center overflow-y-auto">
          <AdminPyramidSelector />
        </div>
      </main>
    );
  } else {
    const playerPyramid = await getPlayerPyramid(session.user.id);

    if (!playerPyramid) {
      return (
        <main className="h-screen flex flex-col justify-center items-center bg-gradient-to-b from-black/20 to-indor-black/80 text-white px-4">
          <ZustandSessionInitializer />
          <UserDropdownMenu />
          <div className="bg-indor-black/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md text-center border border-white/10">
            <h1 className="text-3xl font-extrabold mb-3 tracking-wide">
              Sin participación
            </h1>
            <p className="mb-3 text-lg text-white/80">
              Aún no te asignan a una pirámide.
            </p>
            <p className="mb-6 text-sm text-white/60">
              Por favor, contacta con un organizador si crees que se trata de un
              error.
            </p>
          </div>
        </main>
      );
    }

    return (
      <main className="h-screen flex flex-col justify-center">
        <ZustandSessionInitializer />
        <div className="flex flex-col justify-start py-16 overflow-y-scroll no-scrollbar">
          <PyramidDisplay data={playerPyramid} userTeamId={userTeamId} />
        </div>
        <UserDropdownMenu />
      </main>
    );
  }
}
