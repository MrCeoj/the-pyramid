"use server";
import { db } from "@/lib/drizzle";
import { eq, or, and } from "drizzle-orm";
import { match, position } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { getTeamWithPlayers } from "@/actions/matches/TeamService";

//TODO validate admin sesh and implement front
export async function createMatchAdmin({
  pyramidId,
  challengerTeamId,
  defenderTeamId,
  userId
}: {
  pyramidId: number;
  challengerTeamId: number;
  defenderTeamId: number;
  userId: string;
}) {
  try {
    if (challengerTeamId === defenderTeamId){
      return {
        success: false,
        error: "Un equipo no puede retarse así mismo."
      }
    }
    const [[challengerPos], [defenderPos]] = await Promise.all([
      db
        .select({ id: position.id })
        .from(position)
        .where(
          and(
            eq(position.teamId, challengerTeamId),
            eq(position.pyramidId, pyramidId)
          )
        )
        .limit(1),
      db
        .select({ id: position.id })
        .from(position)
        .where(
          and(
            eq(position.teamId, defenderTeamId),
            eq(position.pyramidId, pyramidId)
          )
        )
        .limit(1),
    ]);

    if (!challengerPos || !defenderPos) {
      return {
        success: false,
        error: "Uno o ambos equipos no están en esta pirámide",
      };
    }

    // Check for existing unresolved matches between these teams
    const existingMatch = await db
      .select({ id: match.id })
      .from(match)
      .where(
        and(
          eq(match.pyramidId, pyramidId),
          or(
            and(
              eq(match.challengerTeamId, challengerTeamId),
              eq(match.defenderTeamId, defenderTeamId)
            ),
            and(
              eq(match.challengerTeamId, defenderTeamId),
              eq(match.defenderTeamId, challengerTeamId)
            )
          ),
          or(eq(match.status, "pending"), eq(match.status, "accepted"))
        )
      )
      .limit(1);

    if (existingMatch.length > 0) {
      return {
        success: false,
        error: "Ya existe un desafío pendiente entre estos equipos",
      };
    }

    // Get team information before creating the match
    const [challengerTeamInfo, defenderTeamInfo] = await Promise.all([
      getTeamWithPlayers(challengerTeamId),
      getTeamWithPlayers(defenderTeamId),
    ]);

    if (!challengerTeamInfo || !defenderTeamInfo) {
      return {
        success: false,
        error: "No se pudo obtener información de los equipos",
      };
    }

    // Create the match
    const [newMatch] = await db
      .insert(match)
      .values({
        pyramidId,
        challengerTeamId,
        defenderTeamId,
        status: "accepted",
      })
      .returning();

    revalidatePath("/mis-retas");
    revalidatePath("/");

    return {
      success: true,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return { success: false, error: "No se pudo establecer la reta" };
  }
}
