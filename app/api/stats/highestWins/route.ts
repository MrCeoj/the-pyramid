import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/drizzle";
import { position, team } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const body = await req.json()
  const topPlayed = await db
    .select({
      teamId: team.id,
      wins: position.wins
    })
    .from(team)
    .innerJoin(position, eq(position.teamId, team.id))
    .where(eq(position.pyramidId, body.pyramidId))
    .orderBy(desc(position.wins))
    .limit(3);

  return NextResponse.json(topPlayed);
}