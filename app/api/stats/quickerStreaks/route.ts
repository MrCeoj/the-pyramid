import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/drizzle";
import { match, position } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pyramidId = body.pyramidId;

    // Get teams in pyramid
    const teamsInPyramid = await db
      .select({ id: position.teamId })
      .from(position)
      .where(eq(position.pyramidId, pyramidId));

    // Get ALL matches of pyramid, sorted by time
    const matchesOfPyramid = await db
      .select({
        team1: match.challengerTeamId,
        team2: match.defenderTeamId,
        winner: match.winnerTeamId,
        playedAt: match.updatedAt,
      })
      .from(match)
      .where(eq(match.status, "played"));

    const teamIds = teamsInPyramid.map((t) => t.id);

    const streaks: {
      teamId: number;
      streak: number;
      firstdate?: string;
      lastdate?: string;
      durationMs?: number;
    }[] = [];

    // 🔥 Loop over each team
    teamIds.forEach((teamId) => {
      const matches = matchesOfPyramid
        .filter((m) => m.team1 === teamId || m.team2 === teamId)
        .sort((a, b) => new Date(a.playedAt!).getTime() - new Date(b.playedAt!).getTime());

      let bestStreak = 0;
      let bestFirstDate = "";
      let bestLastDate = "";
      let bestDuration = Infinity;

      let currentStreak = 0;
      let currentFirstDate = "";
      let currentLastDate = "";

      matches.forEach((m) => {
        const isWin = m.winner === teamId;

        if (isWin) {
          // Win: continue or start streak
          currentStreak += 1;

          if (currentStreak === 1) {
            currentFirstDate = m.playedAt!.toString();
          }
          currentLastDate = m.playedAt!.toString();
        } else {
          // Loss: evaluate the streak before breaking it
          if (currentStreak > 0) {
            const duration =
              new Date(currentLastDate).getTime() -
              new Date(currentFirstDate).getTime();

            // Update best streak if:
            // - longer streak
            // - OR same streak length but shorter duration
            if (
              currentStreak > bestStreak ||
              (currentStreak === bestStreak && duration < bestDuration)
            ) {
              bestStreak = currentStreak;
              bestFirstDate = currentFirstDate;
              bestLastDate = currentLastDate;
              bestDuration = duration;
            }
          }

          // Reset streak
          currentStreak = 0;
          currentFirstDate = "";
          currentLastDate = "";
        }
      });

      // Check once more at end in case streak ends at last match
      if (currentStreak > 0) {
        const duration =
          new Date(currentLastDate).getTime() -
          new Date(currentFirstDate).getTime();

        if (
          currentStreak > bestStreak ||
          (currentStreak === bestStreak && duration < bestDuration)
        ) {
          bestStreak = currentStreak;
          bestFirstDate = currentFirstDate;
          bestLastDate = currentLastDate;
          bestDuration = duration;
        }
      }

      streaks.push({
        teamId,
        streak: bestStreak,
        firstdate: bestFirstDate,
        lastdate: bestLastDate,
        durationMs: bestDuration,
      });
    });

    return NextResponse.json(streaks);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
