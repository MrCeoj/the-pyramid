import { and, asc, eq, or } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { positionHistory, team } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  const teams = await db.select({ teamId: team.id }).from(team);

  const results: number[] = [];

  for (const t of teams) {
    const positionChanges = await db
      .select({
        teamId: positionHistory.teamId,
        affectedTeamId: positionHistory.affectedTeamId,
        oldRow: positionHistory.oldRow,
        newRow: positionHistory.newRow,
        affectedOldRow: positionHistory.affectedOldRow,
        affectedNewRow: positionHistory.affectedNewRow,
      })
      .from(positionHistory)
      .where(
        or(
          eq(positionHistory.teamId, t.teamId),
          eq(positionHistory.affectedTeamId, t.teamId)
        )
      )
      .orderBy(asc(positionHistory.effectiveDate));

    if (!positionChanges.length) {
      results.push(t.teamId);
      continue;
    }

    let lastRow = 100;

    if (positionChanges[0].teamId === t.teamId)
      lastRow = positionChanges[0].newRow!;
    if (positionChanges[0].affectedTeamId && positionChanges[0].affectedTeamId === t.teamId)
      lastRow = positionChanges[0].affectedOldRow!;
    
    let pushable = true;
    for (const change of positionChanges) {
      if (change.teamId === t.teamId) {
        if (lastRow > change.newRow!) {
          pushable = false;
          break;
        }
        lastRow = change.newRow!;
      }

      if (change.affectedTeamId === t.teamId) {
        if (lastRow > change.affectedNewRow!) {
          pushable = false;
          break;
        }
        lastRow = change.affectedNewRow!;
      }
    }

    if (pushable) results.push(t.teamId);
  }

  console.log(results);

  return NextResponse.json({ climbedTeams: results });
}
