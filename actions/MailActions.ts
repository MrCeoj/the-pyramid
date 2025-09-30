import { transporter } from "@/lib/mail";
import { TeamWithPlayers } from "./PositionActions";
import {
  generateChallengeEmailTemplate,
  generateAcceptEmailTemplate,
  generateCancelEmailTemplate,
  generateRejectEmailTemplate,
  generateRiskyWarningEmailTemplate,
} from "@/lib/mail/templates";
import { db } from "@/lib/drizzle";
import { position, users, team } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function sendChallengeMail(
  attacker: TeamWithPlayers,
  defender: TeamWithPlayers,
  pyramidId: number
) {
  try {
    if (!attacker || !defender || !pyramidId) {
      return { error: "Missing required fields" };
    }

    const categoryDiff =
      (defender.categoryId ?? 0) - (attacker.categoryId ?? 0);
    const handicapPoints = Math.abs(categoryDiff) * 15;

    const emailData = {
      attacker,
      defender,
      pyramidId,
      handicapPoints,
    };

    const htmlContent = generateChallengeEmailTemplate(emailData);

    // Collect defender emails
    const defenderEmails: string[] = [];

    if (defender.player1?.email) {
      defenderEmails.push(defender.player1.email);
    }

    if (defender.player2?.email) {
      defenderEmails.push(defender.player2.email);
    }

    if (defenderEmails.length === 0) {
      return {
        error:
          "No se encontraron correos válidos para notificar a los oponentes",
      };
    }

    const mailOptions = {
      from: process.env.FROM_RETAS!,
      to: defenderEmails,
      subject: `🏆 ¡${attacker.displayName} te ha desafiado!`,
      html: htmlContent,
    };

    const response = transporter.sendMail(mailOptions);
    const result = await response;

    return {
      success: true,
      emailsSent: result.accepted.length,
      emailsFailed: result.rejected.length,
      totalEmails: defenderEmails.length,
      results: result.response,
    };
  } catch (error) {
    console.error("Error sending challenge email:", error);
    return { error: error };
  }
}

export async function sendRejectMail(
  attacker: TeamWithPlayers,
  defender: TeamWithPlayers,
  pyramidId: number
) {
  try {
    if (!attacker || !defender || !pyramidId) {
      return { error: "No se pudieron procesar los datos de la reta." };
    }

    const emailData = {
      attacker,
      defender,
      pyramidId,
    };

    const htmlContent = generateRejectEmailTemplate(emailData);

    const teamIdsInPyramid = await db
      .select({ teamId: position.teamId })
      .from(position)
      .where(eq(position.pyramidId, pyramidId));

    const teamIds = teamIdsInPyramid.map((t) => t.teamId);

    const playerIds = await db
      .select({ player1Id: team.player1Id, player2Id: team.player2Id })
      .from(team)
      .where(inArray(team.id, teamIds));

    const userIds: string[] = [];
    playerIds.forEach(({ player1Id, player2Id }) => {
      if (player1Id) userIds.push(player1Id);
      if (player2Id) userIds.push(player2Id);
    });

    const res = await db
      .select({ mail: users.email })
      .from(users)
      .where(inArray(users.id, userIds));

    const mails: string[] = res.map((r) => r.mail!).filter(Boolean);

    // Send email to all players
    const mailOptions = {
      from: process.env.FROM_RETAS!,
      to: mails,
      subject: `❌🐔 ${defender.displayName} ha rechazado el desafío de ${attacker.displayName}`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);

    return {
      success: true,
      results: [result.response],
    };
  } catch (error) {
    console.error("Error sending reject email:", error);
    return { error: error };
  }
}

// Accept a match challenge
export async function sendAcceptMail(
  attacker: TeamWithPlayers,
  defender: TeamWithPlayers,
  pyramidId: number
) {
  try {
    if (!attacker || !defender || !pyramidId) {
      return { error: "Missing required fields" };
    }

    const categoryDiff =
      (defender.categoryId ?? 0) - (attacker.categoryId ?? 0);
    const handicapPoints = Math.abs(categoryDiff) * 15;

    const emailData = {
      attacker,
      defender,
      pyramidId,
      handicapPoints,
    };

    const htmlContent = generateAcceptEmailTemplate(emailData);

    // Collect all player emails (both teams should be notified)
    const allEmails: string[] = [];

    if (attacker.player1?.email) {
      allEmails.push(attacker.player1.email);
    }
    if (attacker.player2?.email) {
      allEmails.push(attacker.player2.email);
    }
    if (defender.player1?.email) {
      allEmails.push(defender.player1.email);
    }
    if (defender.player2?.email) {
      allEmails.push(defender.player2.email);
    }

    if (allEmails.length === 0) {
      return {
        error:
          "No se encontraron correos válidos para notificar a los jugadores",
      };
    }

    const mailOptions = {
      from: process.env.FROM_RETAS!,
      to: allEmails,
      subject: `✅ ¡Desafío aceptado! ${attacker.displayName} vs ${defender.displayName}`,
      html: htmlContent,
    };
    const result = await transporter.sendMail(mailOptions);

    return {
      success: true,
      results: [result.response],
    };
  } catch (error) {
    console.error("Error sending accept email:", error);
    return { error: error };
  }
}

// Cancel a match
export async function sendCancelMail(
  attacker: TeamWithPlayers,
  defender: TeamWithPlayers,
  pyramidId: number,
  reason?: string
) {
  try {
    if (!attacker || !defender || !pyramidId) {
      return { error: "Missing required fields" };
    }

    const emailData = {
      attacker,
      defender,
      pyramidId,
      reason,
    };

    const htmlContent = generateCancelEmailTemplate(emailData);

    // Collect all player emails (both teams should be notified)
    const allEmails: string[] = [];

    if (attacker.player1?.email) {
      allEmails.push(attacker.player1.email);
    }
    if (attacker.player2?.email) {
      allEmails.push(attacker.player2.email);
    }
    if (defender.player1?.email) {
      allEmails.push(defender.player1.email);
    }
    if (defender.player2?.email) {
      allEmails.push(defender.player2.email);
    }

    if (allEmails.length === 0) {
      return {
        error:
          "No se encontraron correos válidos para notificar a los jugadores",
      };
    }

    const mailOptions = {
      from: process.env.FROM_RETAS!,
      to: allEmails,
      subject: `🚫 Reta cancelada. ${attacker.displayName} vs ${defender.displayName}`,
      html: htmlContent,
    };
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending cancel email:", error);
    return { error: error };
  }
}

// Companion function to send risky warning emails
export async function sendRiskyWarningMail(
  team: TeamWithPlayers,
  pyramidId: number,
  currentPosition?: number,
  nextRowPosition?: number
) {
  try {
    if (!team || !pyramidId) {
      return { error: "Missing required fields" };
    }

    const emailData = {
      team,
      pyramidId,
      currentPosition,
      nextRowPosition,
    };

    const htmlContent = generateRiskyWarningEmailTemplate(emailData);

    // Collect team player emails
    const teamEmails: string[] = [];

    if (team.player1?.email) {
      teamEmails.push(team.player1.email);
    }
    if (team.player2?.email) {
      teamEmails.push(team.player2.email);
    }

    if (teamEmails.length === 0) {
      return {
        error: "No se encontraron correos válidos para el equipo",
      };
    }

    const mailOptions = {
      from: process.env.FROM_RETAS!,
      to: teamEmails,
      subject: `⚠️ URGENTE: ${team.displayName} en riesgo de reposicionamiento`,
      html: htmlContent,
    };

    const results = await transporter.sendMail(mailOptions);

    // Check results
    const successful = results.accepted.length;
    const failed = results.rejected.length;

    if (failed > 0) {
      console.error("Some risky warning emails failed to send:", failed);
    }

    return {
      success: true,
      emailsSent: successful,
      emailsFailed: failed,
      totalEmails: teamEmails.length,
      teamName: team.displayName,
      results: results.response,
    };
  } catch (error) {
    console.error("Error sending risky warning email:", error);
    return { error: error };
  }
}
