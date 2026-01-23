"use server";
import { db } from "@/lib/drizzle";
import { match, pyramid, position, positionHistory, team } from "@/db/schema";
import { and, or, eq, lt, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getPreviousMonday } from "@/lib/utils";
import { getNextPosition, cancelExpiredMatches } from "./helpers";

export async function processExpiredMatches(userId: string) {
  try {
    return await db.transaction(async (tx) => {
      const [teamId] = await tx
        .select({ teamId: team.id })
        .from(team)
        .where(or(eq(team.player1Id, userId), eq(team.player2Id, userId)))
        .limit(1);

      if (
        teamId === null ||
        teamId === undefined ||
        typeof teamId !== "number"
      ) {
        return {
          success: false,
          expired: 0,
          error: "No se pudo conseguir informacion del equipo",
        };
      }

      const expired = await tx
        .select()
        .from(match)
        .where(
          and(
            eq(match.status, "pending"),
            eq(match.defenderTeamId, teamId),
            lt(match.createdAt, new Date(Date.now() - 48 * 60 * 60 * 1000)),
          ),
        );

      if (expired.length <= 0) {
        return { success: true, expired: 0, error: "" };
      }

      const twoWeeksAgoMonday = await getPreviousMonday();

      const recentMatches = await tx
        .select({ id: match.id })
        .from(match)
        .where(
          and(
            eq(match.status, "played"),
            gte(match.updatedAt, twoWeeksAgoMonday),
            or(
              eq(match.challengerTeamId, teamId),
              eq(match.defenderTeamId, teamId),
            ),
          ),
        );

      const recentCount = recentMatches.length;

      // 4️⃣ If team has played at least 2 matches → skip demotion
      if (recentCount >= 2) {
        const expiredIds = expired.map((m) => m.id);

        await cancelExpiredMatches(tx, expiredIds);

        revalidatePath("/");
        return {
          success: true,
          expired: expired.length,
          error: "",
        };
      }

      const [pyramidInfo] = await tx
        .select({ id: pyramid.id, rowAmount: pyramid.row_amount })
        .from(position)
        .leftJoin(pyramid, eq(pyramid.id, position.pyramidId))
        .where(
          and(eq(position.pyramidId, pyramid.id), eq(position.teamId, teamId)),
        )
        .limit(1);

      if (!pyramidInfo || !pyramidInfo.id)
        return {
          success: false,
          expired: 0,
          error: "No se pudo conseguir info de la piramide",
        };

      const rowAmount = pyramidInfo.rowAmount;

      if (!rowAmount) {
        return {
          success: false,
          expired: 0,
          error: "No se pudo conseguir info de la piramide",
        };
      }

      const [defenderPosition] = await tx
        .select()
        .from(position)
        .where(
          and(
            eq(position.pyramidId, pyramidInfo.id),
            eq(position.teamId, teamId),
          ),
        )
        .limit(1);

      if (!defenderPosition)
        return {
          success: false,
          expired: 0,
          error: "No se pudo conseguir posición del equipo",
        };

      const currentPos = {
        row: defenderPosition.row,
        col: defenderPosition.col,
      };

      const nextPos = getNextPosition(currentPos, rowAmount);

      if (nextPos) {
        // Find the team at the next position
        const [nextTeam] = await tx
          .select()
          .from(position)
          .where(
            and(
              eq(position.pyramidId, pyramidInfo.id),
              eq(position.row, nextPos.row),
              eq(position.col, nextPos.col),
            ),
          )
          .limit(1);

        if (nextTeam && typeof nextTeam.id === "number") {
          await tx
            .update(position)
            .set({ row: 0, col: 0 })
            .where(
              and(
                eq(position.pyramidId, pyramidInfo.id),
                eq(position.teamId, teamId),
              ),
            );

          await tx
            .update(position)
            .set({ row: currentPos.row, col: currentPos.col })
            .where(
              and(
                eq(position.pyramidId, pyramidInfo.id),
                eq(position.teamId, nextTeam.teamId),
              ),
            );

          await tx
            .update(position)
            .set({ row: nextPos.row, col: nextPos.col })
            .where(
              and(
                eq(position.pyramidId, pyramidInfo.id),
                eq(position.teamId, teamId),
              ),
            );

          await tx
            .update(position)
            .set({ lastResult: "down" })
            .where(
              and(
                eq(position.pyramidId, pyramidInfo.id),
                eq(position.teamId, teamId),
              ),
            );

          await tx
            .update(position)
            .set({ lastResult: "up" })
            .where(
              and(
                eq(position.pyramidId, pyramidInfo.id),
                eq(position.teamId, nextTeam.id),
              ),
            );

          await tx.insert(positionHistory).values([
            {
              pyramidId: pyramidInfo.id,
              matchId: null,
              teamId: teamId,
              affectedTeamId: nextTeam.teamId,
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

          await tx.insert(positionHistory).values([
            {
              pyramidId: pyramidInfo.id,
              matchId: null,
              teamId: teamId,
              affectedTeamId: nextTeam.teamId,
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
      }

      const expiredIds = expired.map((m) => m.id);
      await cancelExpiredMatches(tx, expiredIds);

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
