"use server";
import { db } from "@/lib/drizzle";
import { eq, or, and } from "drizzle-orm";
import { match, position } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { sendChallengeMail } from "@/actions/MailActions";
import { getTeamInfo, getUserTeamIds } from "@/actions/matches/TeamService";

export async function createMatch({
  pyramidId,
  challengerTeamId,
  defenderTeamId,
  userId,
}: {
  pyramidId: number;
  challengerTeamId: number;
  defenderTeamId: number;
  userId: string;
}) {
  try {
    // Verify user belongs to challenger team
    const userTeamIds = await getUserTeamIds(userId);
    if (!userTeamIds.includes(challengerTeamId)) {
      return {
        success: false,
        error: "No tienes permisos para crear este desafío",
      };
    }

    // Check if teams exist and are in the pyramid
    const [challengerPos, defenderPos] = await Promise.all([
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

    if (!challengerPos.length || !defenderPos.length) {
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
      getTeamInfo(challengerTeamId),
      getTeamInfo(defenderTeamId),
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
        status: "pending",
      })
      .returning();

    try {
      const emailResult = await sendChallengeMail(
        challengerTeamInfo,
        defenderTeamInfo,
        pyramidId
      );

      if (emailResult.error) {
        return {
          success: true,
          match: newMatch,
          emailSent: false,
          warning: "Reta creada, pero no se pudo notificar a los defensores.",
        };
      }
    } catch (emailError) {
      throw emailError;
    }

    revalidatePath("/mis-retas");
    revalidatePath("/");

    return {
      success: true,
      match: newMatch,
      emailSent: true, // You could track email status if needed
      warning: ""
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return { success: false, error: "No se pudo establecer la reta" };
  }
}
