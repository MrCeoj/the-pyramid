"use server";
import { db } from "@/lib/drizzle";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import { match, team, position, positionHistory } from "@/db/schema";
import { DbTransaction } from "@/actions/matches/types";

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
      and(eq(position.pyramidId, pyramidId), inArray(position.teamId, teamIds))
    );
}

export async function updateMatchStatus(
  tx: DbTransaction,
  matchId: number,
  winnerTeamId: number
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
  loserTeamId: number
) {
  await tx
    .update(team)
    .set({ amountRejected: 0, defendable: false })
    .where(inArray(team.id, [winnerTeamId, loserTeamId]));

  await tx
    .update(team)
    .set({
      wins: sql`${team.wins} + 1`,
      loosingStreak: 0,
      status: "winner",
      updatedAt: new Date(),
    })
    .where(eq(team.id, winnerTeamId));

  await tx
    .update(team)
    .set({
      losses: sql`${team.losses} + 1`,
      loosingStreak: sql`${team.loosingStreak} + 1`,
      status: "looser",
      updatedAt: new Date(),
    })
    .where(eq(team.id, loserTeamId));
}

export async function swapPositionsWithCellarIfNeeded(
  tx: DbTransaction,
  pyramidId: number,
  looserTeamId: number
) {
  const [{ loosingStreak }] = await tx
    .select({ loosingStreak: team.loosingStreak })
    .from(team)
    .where(eq(team.id, looserTeamId))
    .limit(1);

  if (!loosingStreak) return;

  if (loosingStreak < 3) return;

  const [{ cellarTeamId }] = await tx
    .select({ cellarTeamId: position.teamId })
    .from(position)
    .where(eq(position.row, 8))
    .limit(1);

  if (typeof cellarTeamId !== "number") return;

  const [looserCurrentPos] = await tx
    .select()
    .from(position)
    .where(
      and(eq(position.teamId, looserTeamId), eq(position.pyramidId, pyramidId))
    );

  await tx
    .update(team)
    .set({ lastResult: "down" })
    .where(eq(team.id, looserTeamId));

  await tx
    .update(team)
    .set({ lastResult: "up" })
    .where(eq(team.id, cellarTeamId));

  await tx
    .update(position)
    .set({ row: -1, col: -1 })
    .where(
      and(eq(position.teamId, looserTeamId), eq(position.pyramidId, pyramidId))
    );

  await tx
    .update(position)
    .set({
      row: looserCurrentPos.row,
      col: looserCurrentPos.col,
      updatedAt: new Date(),
    })
    .where(
      and(eq(position.teamId, cellarTeamId), eq(position.pyramidId, pyramidId))
    );

  await tx
    .update(position)
    .set({ row: 8, col: 1, updatedAt: new Date() })
    .where(
      and(eq(position.teamId, looserTeamId), eq(position.pyramidId, pyramidId))
    );
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
  shouldSwapPositions: boolean
) {
  if (!shouldSwapPositions) {
    await tx
      .update(team)
      .set({ lastResult: "stayed" })
      .where(inArray(team.id, [winnerTeamId, loserTeamId]));
    return;
  }

  await tx
    .update(position)
    .set({ row: -1, col: -1 })
    .where(
      and(eq(position.teamId, winnerTeamId), eq(position.pyramidId, pyramidId))
    );

  await tx
    .update(position)
    .set({
      row: winnerCurrentPos.row,
      col: winnerCurrentPos.col,
      updatedAt: new Date(),
    })
    .where(
      and(eq(position.teamId, loserTeamId), eq(position.pyramidId, pyramidId))
    );

  await tx
    .update(position)
    .set({
      row: loserCurrentPos.row,
      col: loserCurrentPos.col,
      updatedAt: new Date(),
    })
    .where(
      and(eq(position.teamId, winnerTeamId), eq(position.pyramidId, pyramidId))
    );

  await tx
    .update(team)
    .set({ lastResult: "up" })
    .where(eq(team.id, winnerTeamId));

  await tx
    .update(team)
    .set({ lastResult: "down" })
    .where(eq(team.id, loserTeamId));

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
  loserTeamId: number
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
          inArray(match.defenderTeamId, [winnerTeamId, loserTeamId])
        )
      )
    );

  if (!activeMatches.length) return;

  // 2. Collect all unique teamIds involved
  const involvedTeamIds = Array.from(
    new Set(
      activeMatches.flatMap((m) => [m.challengerTeamId, m.defenderTeamId])
    )
  );

  // 3. Fetch their current positions
  const teamPositions = await getPositions(pyramidId, involvedTeamIds);

  const positionMap = Object.fromEntries(
    teamPositions.map((p) => [p.teamId, { row: p.row, col: p.col }])
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
