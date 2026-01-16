"use server";
import { transporter } from "@/lib/mail";
import { generateRiskyWarningEmailTemplate } from "@/lib/mail/templates";

// Companion function to send risky warning emails
export async function sendRiskyWarningMail(
  team: TeamWithPlayers,
  pyramidId: number,
  currentPosition?: number,
  nextRowPosition?: number,
) {
  try {
    if (!team || !pyramidId) {
      return { error: "Missing required fields" };
    }

    const emailData: RiskyWarningMailData = {
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
