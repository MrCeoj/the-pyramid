"use server";
import { db } from "@/lib/drizzle";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import { match, team, position, positionHistory } from "@/db/schema";
import { DbTransaction } from "@/types/custom";

export async function getMatchData(matchId: number) {
  const result = await db
    .select({
      pyramidId: match.pyramidId,
      challengerTeamId: match.challengerTeamId,
      defenderTeamId: match.defenderTeamId,
      status: match.status,
    })
    .from(match)
    .where(eq(match.id, matchId))
    .limit(1);
  return result[0];
}

export async function getPositions(pyramidId: number, teamIds: number[]) {
  return await db
    .select({
      teamId: position.teamId,
      row: position.row,
      col: position.col,
    })
    .from(position)
    .where(
      and(eq(position.pyramidId, pyramidId), inArray(position.teamId, teamIds)),
    );
}

export async function updateMatchStatus(
  tx: DbTransaction,
  matchId: number,
  winnerTeamId: number,
) {
  await tx
    .update(match)
    .set({
      winnerTeamId,
      status: "played",
      updatedAt: new Date(),
    })
    .where(eq(match.id, matchId));
}

export async function updateTeamsAfterMatch(
  tx: DbTransaction,
  winnerTeamId: number,
  loserTeamId: number,
  pyramidId: number,
) {
  await tx
    .update(position)
    .set({
      amountRejected: 0,
      defendable: false,
      wins: sql`${position.wins} + 1`,
      losingStreak: 0,
      winningStreak: sql`${position.winningStreak} + 1`,
      status: "winner",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(position.pyramidId, pyramidId),
        inArray(position.teamId, [winnerTeamId, loserTeamId]),
      ),
    );

  await tx
    .update(position)
    .set({
      losses: sql`${position.losses} + 1`,
      defendable: false,
      losingStreak: sql`${position.losingStreak} + 1`,
      winningStreak: 0,
      status: "loser",
      updatedAt: new Date(),
    })
    .where(and(eq(position.pyramidId, pyramidId),eq(team.id, loserTeamId)));
}

export async function swapPositionsIfNeeded(
  tx: DbTransaction,
  { pyramidId, matchId }: { pyramidId: number; matchId: number },
  { winnerTeamId, loserTeamId }: { winnerTeamId: number; loserTeamId: number },
  {
    winnerCurrentPos,
    loserCurrentPos,
  }: {
    winnerCurrentPos: { row: number; col: number };
    loserCurrentPos: { row: number; col: number };
  },
  shouldSwapPositions: boolean,
) {
  if (!shouldSwapPositions) {
    await tx
      .update(position)
      .set({
        lastResult: "stayed",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(position.pyramidId, pyramidId),
          inArray(position.teamId, [winnerTeamId, loserTeamId]),
        ),
      );
    return;
  }

  await tx
    .update(position)
    .set({
      row: sql`
        CASE
          WHEN ${position.teamId} = ${winnerTeamId} THEN ${loserCurrentPos.row}
          WHEN ${position.teamId} = ${loserTeamId} THEN ${winnerCurrentPos.row}
          ELSE ${position.row}
        END
      `,
      col: sql`
        CASE
          WHEN ${position.teamId} = ${winnerTeamId} THEN ${loserCurrentPos.col}
          WHEN ${position.teamId} = ${loserTeamId} THEN ${winnerCurrentPos.col}
          ELSE ${position.col}
        END
      `,
      lastResult: sql`
        CASE
          WHEN ${position.teamId} = ${winnerTeamId} THEN 'up'
          WHEN ${position.teamId} = ${loserTeamId} THEN 'down'
          ELSE ${position.lastResult}
        END
      `,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(position.pyramidId, pyramidId),
        inArray(position.teamId, [winnerTeamId, loserTeamId]),
      ),
    );

  await tx.insert(positionHistory).values({
    pyramidId,
    matchId,
    teamId: winnerTeamId,
    affectedTeamId: loserTeamId,
    oldRow: winnerCurrentPos.row,
    oldCol: winnerCurrentPos.col,
    newRow: loserCurrentPos.row,
    newCol: loserCurrentPos.col,
    affectedOldRow: loserCurrentPos.row,
    affectedOldCol: loserCurrentPos.col,
    affectedNewRow: winnerCurrentPos.row,
    affectedNewCol: winnerCurrentPos.col,
  });
}

export async function evaluateMatchesAfterResult(
  tx: DbTransaction,
  pyramidId: number,
  winnerTeamId: number,
  loserTeamId: number,
) {
  const activeMatches = await tx
    .select({
      id: match.id,
      challengerTeamId: match.challengerTeamId,
      defenderTeamId: match.defenderTeamId,
    })
    .from(match)
    .where(
      and(
        eq(match.pyramidId, pyramidId),
        inArray(match.status, ["accepted", "pending"]),
        or(
          inArray(match.challengerTeamId, [winnerTeamId, loserTeamId]),
          inArray(match.defenderTeamId, [winnerTeamId, loserTeamId]),
        ),
      ),
    );

  if (!activeMatches.length) return;

  // 2. Collect all unique teamIds involved
  const involvedTeamIds = Array.from(
    new Set(
      activeMatches.flatMap((m) => [m.challengerTeamId, m.defenderTeamId]),
    ),
  );

  // 3. Fetch their current positions
  const teamPositions = await getPositions(pyramidId, involvedTeamIds);

  const positionMap = Object.fromEntries(
    teamPositions.map((p) => [p.teamId, { row: p.row, col: p.col }]),
  );

  // 4. Check if the match is still valid
  const invalidMatchIds: number[] = [];

  for (const m of activeMatches) {
    const challengerPos = positionMap[m.challengerTeamId];
    const defenderPos = positionMap[m.defenderTeamId];
    if (!challengerPos || !defenderPos) continue;

    const rowDiff = Math.abs(challengerPos.row - defenderPos.row);
    if (rowDiff >= 2) {
      invalidMatchIds.push(m.id);
    }
  }

  // 5. Invalidate matches that are no longer valid
  if (invalidMatchIds.length > 0) {
    await tx
      .update(match)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(inArray(match.id, invalidMatchIds));
  }

  return {
    invalidated: invalidMatchIds.length,
    affectedMatchIds: invalidMatchIds,
  };
}
