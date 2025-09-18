import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { position, team, pyramid } from "@/db/schema";
import PyramidDisplay from "@/components/pyramid/example";

type Team = {
  id: number;
  name: string;
  wins: number;
  losses: number;
};

type Position = {
  id: number;
  row: number;
  col: number;
  team: Team | null;
};

type PyramidData = {
  positions: Position[];
  row_amount: number;
};

export default async function Home() {
  const pyramidid = 1;

  const positions = (await db
    .select({
      id: position.id,
      row: position.row,
      col: position.col,
      team: {
        id: position.teamId,
        name: team.name,
        wins: team.wins,
        losses: team.losses,
      },
    })
    .from(position)
    .where(eq(position.pyramidId, pyramidid))
    .innerJoin(team, eq(position.teamId, team.id))) as Position[];

  const rowamount = await db
    .select({ row_amount: pyramid.row_amount })
    .from(pyramid)
    .where(eq(pyramid.id, pyramidid));

  const row_amount = rowamount.length > 0 ? rowamount[0].row_amount : 0;

  const pyramiddata = {
    positions,
    row_amount,
  } as PyramidData;

  return (
    <main className="h-screen flex flex-col justify-center">
      
      <div className="flex flex-col justify-center">
        <PyramidDisplay data={pyramiddata} />
      </div>
      {/*<LogoutButton logout={logout}/>*/}
    </main>
  );
}
