"use server";
import { transporter } from "@/lib/mail";
import { generateAcceptEmailTemplate } from "@/lib/mail/templates";

// Accept a match challenge
export async function sendAcceptMail(
  attacker: TeamWithPlayers,
  defender: TeamWithPlayers,
  pyramidId: number,
) {
  try {
    if (!attacker || !defender || !pyramidId) {
      return { error: "Missing required fields" };
    }

    const categoryDiff =
      (defender.categoryId ?? 0) - (attacker.categoryId ?? 0);
    const handicapPoints = Math.abs(categoryDiff) * 15;

    const emailData: MailData = {
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
