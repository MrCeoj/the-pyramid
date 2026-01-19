"use server";
import { transporter } from "@/lib/mail";
import { generateCancelEmailTemplate } from "@/lib/mail/templates";
import { getTeamDisplayName } from "@/db/schema";

export async function sendCancelledBecauseAcceptedMail(
  recipients: TeamWithPlayers[],
  attacker: TeamWithPlayers,
  defender: TeamWithPlayers,
  pyramidId: number,
) {
  try {
    if (!defender || !pyramidId) {
      return { error: "Missing required fields" };
    }

    const reason = `El equipo aceptó la invitación de ${getTeamDisplayName(
      attacker.player1,
      attacker.player2,
    )}, las demás invitaciones pendientes contra ${getTeamDisplayName(
      defender.player1,
      defender.player2,
    )} fueron canceladas como consecuencia.`;

    const emailData: MailData = {
      attacker,
      defender,
      pyramidId,
      reason,
    };

    const htmlContent = generateCancelEmailTemplate(emailData);

    // Collect all player emails (both teams should be notified)
    const allEmails: string[] = [];

    recipients.map((t) => {
      if (t.player1 && t.player1.email) allEmails.push(t.player1.email);
      if (t.player2 && t.player2.email) allEmails.push(t.player2.email);
    });

    if (allEmails.length === 0) {
      return {
        error:
          "No se encontraron correos válidos para notificar a los jugadores",
      };
    }

    const mailOptions = {
      from: process.env.FROM_RETAS,
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
