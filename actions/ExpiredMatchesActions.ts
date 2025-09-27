"use server";
import { db } from "@/lib/drizzle";
import { match, pyramid, position, positionHistory, team } from "@/db/schema";
import { and, or, eq, lt, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function processExpiredMatches(userId: string) {
  try {
    return await db.transaction(async (tx) => {
      const teamSearch = await tx
        .select({ teamId: team.id })
        .from(team)
        .where(or(eq(team.player1Id, userId), eq(team.player2Id, userId)))
        .limit(1);

      if (teamSearch.length <= 0) {
        return {
          success: false,
          expired: 0,
          error: "No se pudo conseguir informacion del equipo",
        };
      }

      const teamId = teamSearch[0].teamId;

      const expired = await tx
        .select()
        .from(match)
        .where(
          and(
            eq(match.status, "pending"),
            eq(match.defenderTeamId, teamId),
            lt(match.createdAt, new Date(Date.now() - 48 * 60 * 60 * 1000))
          )
        );
      if (expired.length <= 0) {
        return { success: true, expired: 0, error: "" };
      }

      const pyramidInfo = await tx
        .select({ id: pyramid.id, rowAmount: pyramid.row_amount })
        .from(position)
        .leftJoin(pyramid, eq(position.teamId, teamId))
        .where(eq(pyramid.id, position.pyramidId))
        .limit(1);

      if (pyramidInfo.length === 0)
        return {
          success: false,
          expired: 0,
          error: "No se pudo conseguir info de la piramide",
        };

      const rowAmount = pyramidInfo[0].rowAmount;

      const defenderPosition = await tx
        .select()
        .from(position)
        .where(
          and(
            eq(position.pyramidId, pyramidInfo[0].id!),
            eq(position.teamId, teamId)
          )
        )
        .limit(1);

      if (defenderPosition.length === 0)
        return {
          success: false,
          expired: 0,
          error: "No se pudo conseguir posición del equipo",
        };

      const currentPos = {
        row: defenderPosition[0].row,
        col: defenderPosition[0].col,
      };

      const nextPos = getNextPosition(currentPos, rowAmount!);

      if (nextPos) {
        // Find the team at the next position
        const nextTeam = await tx
          .select()
          .from(position)
          .where(
            and(
              eq(position.pyramidId, pyramidInfo[0].id!),
              eq(position.row, nextPos.row),
              eq(position.col, nextPos.col)
            )
          )
          .limit(1);

        if (nextTeam.length > 0) {
          await tx
            .update(position)
            .set({ row: 0, col: 0 })
            .where(
              and(
                eq(position.pyramidId, pyramidInfo[0].id!),
                eq(position.teamId, teamId)
              )
            );

          await tx
            .update(position)
            .set({ row: currentPos.row, col: currentPos.col })
            .where(
              and(
                eq(position.pyramidId, pyramidInfo[0].id!),
                eq(position.teamId, nextTeam[0].teamId)
              )
            );

          await tx
            .update(position)
            .set({ row: nextPos.row, col: nextPos.col })
            .where(
              and(
                eq(position.pyramidId, pyramidInfo[0].id!),
                eq(position.teamId, teamId)
              )
            );

          await tx.insert(positionHistory).values([
            {
              pyramidId: pyramidInfo[0].id!,
              matchId: null,
              teamId: teamId,
              affectedTeamId: nextTeam[0].teamId,
              oldRow: currentPos.row,
              oldCol: currentPos.col,
              newRow: nextPos.row,
              newCol: nextPos.col,
              affectedOldRow: nextPos.row,
              affectedOldCol: nextPos.col,
              affectedNewRow: currentPos.row,
              affectedNewCol: currentPos.col,
            },
          ]);
        }
      } else {
        return { success: true, expired: 0, error: "" };
      }

      const expiredIds = expired.map((m) => m.id);
      await tx
        .update(match)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(inArray(match.id, expiredIds));

      revalidatePath("/");

      return { success: true, expired: expired.length, error: "" };
    });
  } catch (error) {
    console.error("Error processing expired matches:", error);
    return {
      success: false,
      expired: 0,
      error: "Error al procesar las partidas expiradas",
    };
  }
}

/**
 * Gets the next position in the pyramid hierarchy (the position to swap with)
 */
function getNextPosition(
  currentPos: { row: number; col: number },
  rowAmount: number
): { row: number; col: number } | null {
  const { row, col } = currentPos;

  // Check if this is the very last position in the pyramid
  if (row === rowAmount && col === row) {
    return null; // No swap for the last position
  }

  // If not in the last column of the row, move to next column
  if (col < row) {
    return { row, col: col + 1 };
  }

  // If in the last column of the row, move to first position of next row
  if (row < rowAmount) {
    return { row: row + 1, col: 1 };
  }

  // This shouldn't happen if the pyramid is properly structured
  return null;
}
