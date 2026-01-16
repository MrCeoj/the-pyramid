"use server";
import { transporter } from "@/lib/mail";
import { generateRejectEmailTemplate } from "@/lib/mail/templates";
import { db } from "@/lib/drizzle";
import { position, users, team } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function sendRejectMail(
  attacker: TeamWithPlayers,
  defender: TeamWithPlayers,
  pyramidId: number,
) {
  try {
    if (!attacker || !defender || !pyramidId) {
      return { error: "No se pudieron procesar los datos de la reta." };
    }

    const emailData: MailData = {
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
