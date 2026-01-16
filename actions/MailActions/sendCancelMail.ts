"use server";
import { transporter } from "@/lib/mail";
import { generateCancelEmailTemplate } from "@/lib/mail/templates";

export async function sendCancelMail(
  attacker: TeamWithPlayers,
  defender: TeamWithPlayers,
  pyramidId: number,
  reason?: string,
) {
  try {
    if (!attacker || !defender || !pyramidId) {
      return { error: "Missing required fields" };
    }

    const emailData: MailData = {
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
