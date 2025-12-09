import { auth } from "@/lib/auth";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";

import UnauthorizedView from "@/app/views/UnauthorizedView";
import AdminView from "@/app/views/AdminView";
import PlayerView from "@/app/views/PlayerView";

import { getAllPyramidsTotal, getPlayerPyramids } from "@/actions/IndexActions";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return <UnauthorizedView type="no-session" />;
  }

  const [userData] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!userData) {
    return <UnauthorizedView type="user-not-found" />;
  }

  const userRole = userData.role;

  if (userRole === "admin") {
    const allPyramids = await getAllPyramidsTotal();
    const latest = allPyramids[0].id;

    return <AdminView allPyramids={allPyramids} defaultPyramidId={latest} />;
  }

  const playerPyramids = await getPlayerPyramids(session.user.id);

  return <PlayerView pyramids={playerPyramids} />;
}
