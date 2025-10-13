"use server";
import { db } from "@/lib/drizzle";
import { eq, and, or, inArray } from "drizzle-orm";
import { match, team, position, positionHistory } from "@/db/schema";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

type DbTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

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

  const [{ wins = 0 }] = await tx
    .select({ wins: team.wins })
    .from(team)
    .where(eq(team.id, winnerTeamId))
    .limit(1);

  await tx
    .update(team)
    .set({
      wins: wins ? wins + 1 : 1,
      loosingStreak: 0,
      status: "winner",
      updatedAt: new Date(),
    })
    .where(eq(team.id, winnerTeamId));

  const [{ losses = 0, loosingStreak = 0 }] = await tx
    .select({ losses: team.losses, loosingStreak: team.loosingStreak })
    .from(team)
    .where(eq(team.id, loserTeamId))
    .limit(1);

  await tx
    .update(team)
    .set({
      losses: losses ? losses + 1 : 1,
      loosingStreak: loosingStreak ? loosingStreak + 1 : 1,
      status: "looser",
      updatedAt: new Date(),
    })
    .where(eq(team.id, loserTeamId));
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
  }
) {
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
  // 1. Get positions of winner, loser, and any other teams they have matches with
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
    new Set(activeMatches.flatMap((m) => [m.challengerTeamId, m.defenderTeamId]))
  );

  // 3. Fetch their current positions
  const teamPositions = await getPositions(pyramidId, involvedTeamIds)

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
