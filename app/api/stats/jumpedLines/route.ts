import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/drizzle";
import { position, positionHistory } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pyramidId = body.pyramidId;

    const teamsInPyramid = await db
      .select({ id: position.teamId })
      .from(position)
      .where(eq(position.pyramidId, pyramidId));

    const teamIds = teamsInPyramid.map((t) => t.id);
    teamIds.sort((a, b) => a - b);

    const positionHistoryOfPyramid = await db
      .select({
        team: positionHistory.teamId,
        affectedTeam: positionHistory.affectedTeamId,
        teamOldRow: positionHistory.oldRow,
        teamNewRow: positionHistory.newRow,
        affectedTeamOldRow: positionHistory.affectedOldRow,
        affectedTeamNewRow: positionHistory.affectedNewRow,
        date: positionHistory.effectiveDate,
      })
      .from(positionHistory)
      .where(eq(positionHistory.pyramidId, pyramidId))
      .orderBy(positionHistory.effectiveDate);

    console.log(positionHistoryOfPyramid);

    const result = [];
    for (const t of teamIds) {
      let prevRow: number | null = null;
      let streak = 0;
      const streaks: number[] = [];

      for (const ev of positionHistoryOfPyramid) {
        let oldRow = null;
        let newRow = null;

        if (t === ev.team) {
          oldRow = ev.teamOldRow;
          newRow = ev.teamNewRow;
        } else if (t === ev.affectedTeam) {
          oldRow = ev.affectedTeamOldRow;
          newRow = ev.affectedTeamNewRow;
        }

        if (newRow != null && prevRow == null) {
          prevRow = newRow;
          continue;
        }

        if (newRow == null) continue;

        if (oldRow != null) {
          if (newRow < oldRow) {
            streak++;
          }
          if (newRow > oldRow) {
            streaks.push(streak);
            streak = 0;
          }
        } else {
          if (newRow < prevRow!) {
            streak++;
          }
          if (newRow > prevRow!) {
            streaks.push(streak);
            streak = 0;
          }
        }

        prevRow = newRow;
      }

      if (streak > 0) streaks.push(streak);

      result.push({
        teamId: t,
        streaks,
        maxStreak: streaks.length ? Math.max(...streaks) : 0,
        total: streaks.reduce((a, b) => a + b, 0),
      });
    }

    console.log(result);

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
