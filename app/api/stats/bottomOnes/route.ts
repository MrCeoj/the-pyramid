import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/drizzle";
import { position, positionHistory, pyramid } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pyramidId = body.pyramidId;
    const [{ rowAmount }] = await db
      .select({ rowAmount: pyramid.row_amount })
      .from(pyramid)
      .where(eq(pyramid.id, pyramidId));

    const teamsInPyramid = await db
      .select({ team: position.teamId })
      .from(position)
      .where(eq(position.pyramidId, pyramidId));

    const posHistory = await db
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
      .where(eq(positionHistory.pyramidId, pyramidId));

    const teamIds = teamsInPyramid.map((t) => t.team);

    const bottomRow = rowAmount! + 1;

    // Group history by team
    const historyByTeam: Record<string, typeof posHistory> = {};

    for (const rec of posHistory) {
      if (!historyByTeam[rec.team]) historyByTeam[rec.team] = [];
      historyByTeam[rec.team].push(rec);
    }

    // Sort each team's history by date
    for (const team in historyByTeam) {
      historyByTeam[team].sort(
        (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()
      );
    }

    const timeInBottomRow: Record<string, number> = {}; // milliseconds

    for (const team of teamIds) {
      const history = historyByTeam[team] ?? [];
      let totalTime = 0;

      let isInBottom = false;
      let intervalStart: number | null = null;

      for (let i = 0; i < history.length; i++) {
        const h = history[i];
        const { teamOldRow, teamNewRow, date } = h;
        const ts = new Date(date!).getTime();

        // If newRow is null -> team was removed
        if (teamNewRow === null) {
          if (isInBottom && intervalStart !== null) {
            totalTime += ts - intervalStart;
          }
          isInBottom = false;
          intervalStart = null;
          continue;
        }

        // If oldRow is null -> team is being added (start fresh state)
        if (teamOldRow === null) {
          // Team is newly added. Check if it is added directly into bottom row
          if (teamNewRow === bottomRow) {
            isInBottom = true;
            intervalStart = ts;
          } else {
            isInBottom = false;
            intervalStart = null;
          }
          continue;
        }

        // --- Standard transitions ---

        // Entering bottom row
        if (teamNewRow === bottomRow && teamOldRow !== bottomRow) {
          isInBottom = true;
          intervalStart = ts;
          continue;
        }

        // Leaving bottom row
        if (teamOldRow === bottomRow && teamNewRow !== bottomRow) {
          if (isInBottom && intervalStart !== null) {
            totalTime += ts - intervalStart;
          }
          isInBottom = false;
          intervalStart = null;
          continue;
        }
      }

      // If ending still inside bottom row, count until now
      if (isInBottom && intervalStart !== null) {
        totalTime += Date.now() - intervalStart;
      }

      timeInBottomRow[team] = totalTime;
    }

    console.log(timeInBottomRow);

    const readable = Object.fromEntries(
      Object.entries(timeInBottomRow).map(([team, ms]) => [
        team,
        (ms / (1000 * 60 * 60 * 24)).toFixed(2) + " days",
      ])
    );

    return new NextResponse(JSON.stringify(readable));
  } catch (e) {
    console.error(e);
  }
}
