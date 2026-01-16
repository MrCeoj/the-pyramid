"use server";
import { transporter } from "@/lib/mail";
import { generateChallengeEmailTemplate } from "@/lib/mail/templates";

export async function sendChallengeMail(
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
