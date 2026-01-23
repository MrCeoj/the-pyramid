"use server";
import { db } from "@/lib/drizzle";
import { sendRiskyWarningMail } from "@/actions/MailActions";
import { getPreviousMonday } from "@/lib/utils";
import { getTeamWithPlayers } from "@/actions/MatchesActions/TeamService";
import { eq, and, gte, or, inArray, lt, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  position,
  pyramid,
  match,
} from "@/db/schema";

export async function checkAndMarkRiskyTeams(
  pyramidId: number,
): Promise<RiskyCheckResult> {
  try {
    const [pyramidRowsTotal] = await db
      .select({ row_amount: pyramid.row_amount })
      .from(pyramid)
      .where(eq(pyramid.id, pyramidId));

    if (!pyramidRowsTotal)
      throw new Error("Error al conseguir la cantidad de filas de la pirámide");

    const prevMonday = await getPreviousMonday();
    const currMonday = await getPreviousMonday(false);

    const teamsInPyramid = await db
      .select({
        teamId: position.teamId,
        row: position.row,
        col: position.col,
      })
      .from(position)
      .where(
        and(
          eq(position.pyramidId, pyramidId),
          ne(position.row, pyramidRowsTotal.row_amount!),
        ),
      );

    if (teamsInPyramid.length === 0) {
      return {
        success: false,
        message: "No se encontraron equipos en la pirámide",
        teamsMarkedRisky: 0,
        emailsSent: 0,
        emailsFailed: 0,
      };
    }

    const allTeamIds = teamsInPyramid.map((t) => t.teamId);

    // Get matches from current week (since currMonday)
    const currentWeekMatches = await db
      .selectDistinct({
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
      })
      .from(match)
      .where(
        and(
          eq(match.pyramidId, pyramidId),
          eq(match.status, "played"),
          gte(match.updatedAt, currMonday), // Current week
          or(
            inArray(match.challengerTeamId, allTeamIds),
            inArray(match.defenderTeamId, allTeamIds),
          ),
        ),
      );

    // Get matches from previous week (between prevMonday and currMonday)
    const previousWeekMatches = await db
      .selectDistinct({
        challengerTeamId: match.challengerTeamId,
        defenderTeamId: match.defenderTeamId,
      })
      .from(match)
      .where(
        and(
          eq(match.pyramidId, pyramidId),
          eq(match.status, "played"),
          gte(match.updatedAt, prevMonday),
          lt(match.updatedAt, currMonday), // Previous week only
          or(
            inArray(match.challengerTeamId, allTeamIds),
            inArray(match.defenderTeamId, allTeamIds),
          ),
        ),
      );

    // Count matches per team for current week
    const currentWeekCounts = new Map<number, number>();
    currentWeekMatches.forEach((m) => {
      currentWeekCounts.set(
        m.challengerTeamId,
        (currentWeekCounts.get(m.challengerTeamId) || 0) + 1,
      );
      currentWeekCounts.set(
        m.defenderTeamId,
        (currentWeekCounts.get(m.defenderTeamId) || 0) + 1,
      );
    });

    // Count matches per team for previous week
    const previousWeekCounts = new Map<number, number>();
    previousWeekMatches.forEach((m) => {
      previousWeekCounts.set(
        m.challengerTeamId,
        (previousWeekCounts.get(m.challengerTeamId) || 0) + 1,
      );
      previousWeekCounts.set(
        m.defenderTeamId,
        (previousWeekCounts.get(m.defenderTeamId) || 0) + 1,
      );
    });

    const activeTeamIds = new Set<number>();

    allTeamIds.forEach((teamId) => {
      const currentWeekMatchCount = currentWeekCounts.get(teamId) || 0;
      const previousWeekMatchCount = previousWeekCounts.get(teamId) || 0;

      if (currentWeekMatchCount >= 1 || previousWeekMatchCount >= 2) {
        activeTeamIds.add(teamId);
      }
    });

    // Step 3: Find inactive teams (teams that haven't played)
    const inactiveTeamIds = allTeamIds.filter(
      (teamId) => !activeTeamIds.has(teamId),
    );

    if (inactiveTeamIds.length === 0) {
      return {
        success: true,
        message: "Todos los equipos han sido activos esta semana. ¡Excelente!",
        teamsMarkedRisky: 0,
        emailsSent: 0,
        emailsFailed: 0,
      };
    }

    // Step 4: Mark inactive teams as "risky"
    await db
      .update(position)
      .set({
        status: "risky",
        updatedAt: new Date(),
      })
      .where(inArray(position.teamId, inactiveTeamIds));

    // Step 5: Get full team data and send warning emails
    const emailResults = [];
    let emailsSent = 0;
    let emailsFailed = 0;
    const riskyTeamNames = [];

    for (const teamId of inactiveTeamIds) {
      try {
        const teamData = await getTeamWithPlayers(teamId);
        if (!teamData) {
          console.warn(`Could not fetch data for team ID: ${teamId}`);
          continue;
        }

        riskyTeamNames.push(teamData.displayName);

        // Get team position for email context
        const teamPosition = teamsInPyramid.find((t) => t.teamId === teamId);

        const nextRowPosition = teamPosition!.row + 1;

        // Send warning email
        const emailResult = await sendRiskyWarningMail(
          teamData,
          pyramidId,
          teamPosition?.row,
          nextRowPosition,
        );

        emailResults.push({
          teamName: teamData.displayName,
          result: emailResult,
        });

        if (emailResult.success) {
          emailsSent += emailResult.emailsSent || 0;
          emailsFailed += emailResult.emailsFailed || 0;
        } else {
          emailsFailed += 2;
        }
      } catch (error) {
        console.error(`Error processing team ${teamId}:`, error);
        emailsFailed += 2;
      }
    }

    revalidatePath("/admin");
    revalidatePath("/piramide");

    return {
      success: true,
      message: `Se marcaron ${inactiveTeamIds.length} equipos como "en riesgo" y se enviaron ${emailsSent} emails de advertencia.`,
      teamsMarkedRisky: inactiveTeamIds.length,
      emailsSent,
      emailsFailed,
      details: {
        riskyTeams: riskyTeamNames,
        emailResults,
      },
    };
  } catch (error) {
    console.error("Error checking risky teams:", error);
    return {
      success: false,
      message: "Error al verificar equipos inactivos. Intenta de nuevo.",
      teamsMarkedRisky: 0,
      emailsSent: 0,
      emailsFailed: 0,
    };
  }
}