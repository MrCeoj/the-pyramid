"use server"
import { position, positionHistory } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function setTeamInPosition(
  pyramidId: number,
  teamId: number,
  row: number,
  col: number
) {
  try {
    // Check if team is already positioned in this pyramid
    const existingTeamPosition = await db
      .select()
      .from(position)
      .where(
        and(eq(position.pyramidId, pyramidId), eq(position.teamId, teamId))
      )
      .limit(1);

    if (existingTeamPosition.length > 0) {
      return {
        success: false,
        error: "Este equipo ya está posicionado en esta pirámide",
      };
    }

    // Check if position already exists
    const existingPosition = await db
      .select()
      .from(position)
      .where(
        and(
          eq(position.pyramidId, pyramidId),
          eq(position.row, row),
          eq(position.col, col)
        )
      )
      .limit(1);

    let displacedTeamId: number | null = null;

    await db.transaction(async (tx) => {
      if (existingPosition.length > 0) {
        // Store the displaced team info for history
        displacedTeamId = existingPosition[0].teamId;

        // Record the displacement/removal of the old team
        await tx.insert(positionHistory).values({
          pyramidId,
          matchId: null, // Admin action, not match-related
          teamId: displacedTeamId,
          affectedTeamId: teamId,
          oldRow: row,
          oldCol: col,
          newRow: null, // Team was removed/displaced
          newCol: null,
          affectedOldRow: null, // New team had no previous position
          affectedOldCol: null,
          affectedNewRow: row, // New team gets this position
          affectedNewCol: col,
          effectiveDate: new Date(),
        });

        // Update existing position with new team
        const result = await tx
          .update(position)
          .set({
            teamId,
            updatedAt: new Date(),
          })
          .where(eq(position.id, existingPosition[0].id))
          .returning();

        if (result.length === 0) {
          throw new Error("No se actualizaron las posiciones en los registros");
        }
      } else {
        // Create new position
        const result = await tx
          .insert(position)
          .values({
            pyramidId,
            teamId,
            row,
            col,
          })
          .returning();

        if (result.length === 0) {
          throw new Error("No se crearon las nuevas posiciones");
        }
      }

      // Record the placement of the new team
      await tx.insert(positionHistory).values({
        pyramidId,
        matchId: null,
        teamId: teamId,
        affectedTeamId: displacedTeamId,
        oldRow: null,
        oldCol: null,
        newRow: row,
        newCol: col,
        affectedOldRow: displacedTeamId ? row : null,
        affectedOldCol: displacedTeamId ? col : null,
        affectedNewRow: null,
        affectedNewCol: null,
        effectiveDate: new Date(),
      });
    });

    revalidatePath(`/piramides/${pyramidId}/posiciones`);
    revalidatePath(`/piramides/${pyramidId}`);
    return { success: true };
  } catch (error) {
    console.error("Error posicionando equipo:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Ocurrió un error desconocido",
    };
  }
}