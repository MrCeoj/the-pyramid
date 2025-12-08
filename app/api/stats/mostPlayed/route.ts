import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { team, match } from "@/db/schema";
import { sql, desc } from "drizzle-orm";

export async function GET() {
  const topPlayed = await db
    .select({
      teamId: team.id,
      matchCount: sql<number>`count(*)`.as('match_count'),
    })
    .from(team)
    .leftJoin(
      match,
      sql`(${match.challengerTeamId} = ${team.id} OR ${match.defenderTeamId} = ${team.id}) AND ${match.status} = 'played'`
    )
    .groupBy(team.id)
    .orderBy(desc(sql`count(*)`))
    .limit(3);

  return NextResponse.json(topPlayed);
}