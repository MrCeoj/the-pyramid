"use server"
import { position, positionHistory } from "@/db/schema";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function removeTeamFromPosition(
  positionId: number,
  pyramidId?: number
) {
  try {
    // Get position info before deleting for history
    const positionInfo = await db
      .select({
        teamId: position.teamId,
        pyramidId: position.pyramidId,
        row: position.row,
        col: position.col,
      })
      .from(position)
      .where(eq(position.id, positionId))
      .limit(1);

    if (positionInfo.length === 0) {
      return { success: false, error: "Position not found" };
    }

    const { teamId, pyramidId: positionPyramidId, row, col } = positionInfo[0];

    // Delete the position
    const result = await db
      .delete(position)
      .where(eq(position.id, positionId))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "Position not found" };
    }

    // Record the removal in history
    await db.insert(positionHistory).values({
      pyramidId: positionPyramidId,
      matchId: null,
      teamId: teamId,
      affectedTeamId: null,
      oldRow: row,
      oldCol: col,
      newRow: null,
      newCol: null,
      affectedOldRow: null,
      affectedOldCol: null,
      affectedNewRow: null,
      affectedNewCol: null,
      effectiveDate: new Date(),
    });

    if (pyramidId) {
      revalidatePath(`/piramides/${pyramidId}/posiciones`);
      revalidatePath(`/piramides/${pyramidId}`);
    } else {
      revalidatePath(`/piramides/${positionPyramidId}/posiciones`);
      revalidatePath(`/piramides/${positionPyramidId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing team from position:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
