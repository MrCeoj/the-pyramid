import { transporter } from "@/lib/mail";
import { TeamWithPlayers } from "./PositionActions";
import { generateChallengeEmailTemplate } from "@/lib/mail/templates/Challenge";

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
      return { error: "No se encontraron correos válidos para notificar a los oponentes" };
    }

    // Send email to all defender players
    const emailPromises = defenderEmails.map((email) => {
      const mailOptions = {
        from: process.env.FROM_RETAS!,
        to: email,
        subject: `🏆 ¡${attacker.displayName} te ha desafiado!`,
        html: htmlContent,
      };
      return transporter.sendMail(mailOptions);
    });

    // Send all emails concurrently
    const results = await Promise.allSettled(emailPromises);

    // Check results
    const successful = results.filter(
      (result) => result.status === "fulfilled"
    );
    const failed = results.filter((result) => result.status === "rejected");

    if (failed.length > 0) {
      console.error("Some emails failed to send:", failed);
    }

    return {
      success: true,
      emailsSent: successful.length,
      emailsFailed: failed.length,
      totalEmails: defenderEmails.length,
      results: successful.map((result) =>
        result.status === "fulfilled" ? result.value.response : null
      ),
    };
  } catch (error) {
    console.error("Error sending challenge email:", error);
    return { error: error };
  }
}
