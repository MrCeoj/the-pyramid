import { auth } from "@/lib/auth";
import { db } from "@/lib/drizzle";
import { eq, desc } from "drizzle-orm";
import { users, pyramid } from "@/db/schema";

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
    const [allPyramids, latest] = await Promise.all([
      getAllPyramidsTotal(),
      db.select().from(pyramid).orderBy(desc(pyramid.updatedAt)).limit(1),
    ]);

    return (
      <AdminView
        allPyramids={allPyramids}
        defaultPyramidId={latest?.[0]?.id ?? null}
      />
    );
  }

  const playerPyramids = await getPlayerPyramids(session.user.id);

  return <PlayerView pyramids={playerPyramids} />;
}
