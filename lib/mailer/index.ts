// lib/email/index.ts
import nodemailer from "nodemailer";

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verify transporter configuration
export async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log("✅ Email service is ready");
    return true;
  } catch (error) {
    console.error("❌ Email service error:", error);
    return false;
  }
}

// Email templates
export const emailTemplates = {
  challengeReceived: (
    challengerTeam: string,
    defenderTeam: string,
    pyramidName: string
  ) => ({
    subject: `¡Nueva Reto Recibido en ${pyramidName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b35;">¡Tienes un nuevo reto!</h2>
        <p>El equipo <strong>${challengerTeam}</strong> te ha retado en la pirámide <strong>${pyramidName}</strong>.</p>
        <p>Ingresa a la aplicación para aceptar o rechazar el reto.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <p><strong>Retador:</strong> ${challengerTeam}</p>
          <p><strong>Retado:</strong> ${defenderTeam}</p>
          <p><strong>Pirámide:</strong> ${pyramidName}</p>
        </div>
        <p style="color: #666;">¡Buena suerte en tu próximo partido!</p>
      </div>
    `,
    text: `¡Tienes un nuevo reto! El equipo ${challengerTeam} te ha retado en la pirámide ${pyramidName}. Ingresa a la aplicación para responder.`,
  }),

  challengeAccepted: (
    challengerTeam: string,
    defenderTeam: string,
    pyramidName: string
  ) => ({
    subject: `¡Reto Aceptado en ${pyramidName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">¡Tu reto fue aceptado!</h2>
        <p>El equipo <strong>${defenderTeam}</strong> ha aceptado tu reto en la pirámide <strong>${pyramidName}</strong>.</p>
        <p>¡Ya pueden coordinar para jugar el partido!</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <p><strong>Retador:</strong> ${challengerTeam}</p>
          <p><strong>Retado:</strong> ${defenderTeam}</p>
          <p><strong>Pirámide:</strong> ${pyramidName}</p>
        </div>
        <p style="color: #666;">¡Que tengan un excelente partido!</p>
      </div>
    `,
    text: `¡Tu reto fue aceptado! El equipo ${defenderTeam} ha aceptado tu reto en la pirámide ${pyramidName}.`,
  }),

  challengeRejected: (
    challengerTeam: string,
    defenderTeam: string,
    pyramidName: string
  ) => ({
    subject: `Reto Rechazado en ${pyramidName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Reto Rechazado</h2>
        <p>El equipo <strong>${defenderTeam}</strong> ha rechazado tu reto en la pirámide <strong>${pyramidName}</strong>.</p>
        <p>Puedes intentar retar a otro equipo o esperar una mejor oportunidad.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <p><strong>Retador:</strong> ${challengerTeam}</p>
          <p><strong>Retado:</strong> ${defenderTeam}</p>
          <p><strong>Pirámide:</strong> ${pyramidName}</p>
        </div>
        <p style="color: #666;">¡No te desanimes, sigue intentando!</p>
      </div>
    `,
    text: `El equipo ${defenderTeam} ha rechazado tu reto en la pirámide ${pyramidName}.`,
  }),

  matchResult: (
    winnerTeam: string,
    loserTeam: string,
    pyramidName: string,
    isWinner: boolean
  ) => ({
    subject: `Resultado del Partido en ${pyramidName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${isWinner ? "#28a745" : "#dc3545"};">
          ${isWinner ? "¡Felicidades, ganaste!" : "Resultado del partido"}
        </h2>
        <p>Se ha registrado el resultado del partido en la pirámide <strong>${pyramidName}</strong>.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <p><strong>Ganador:</strong> ${winnerTeam}</p>
          <p><strong>Perdedor:</strong> ${loserTeam}</p>
          <p><strong>Pirámide:</strong> ${pyramidName}</p>
        </div>
        <p style="color: #666;">${
          isWinner ? "¡Excelente juego!" : "¡Mejor suerte la próxima vez!"
        }</p>
      </div>
    `,
    text: `Resultado del partido en ${pyramidName}: ${winnerTeam} venció a ${loserTeam}.`,
  }),
};

// Email sending functions
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
) {
  try {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Failed to send email:", error);
      return { success: false, error: error.message };
    }
  }
}

export async function sendBulkEmails(
  emails: Array<{ to: string; subject: string; html: string; text?: string }>
) {
  const results = [];
  for (const email of emails) {
    const result = await sendEmail(
      email.to,
      email.subject,
      email.html,
      email.text
    );
    results.push({ ...email, ...result });
  }
  return results;
}

// Match notification specific functions
export async function sendChallengeNotification(
  defenderEmails: string[],
  challengerTeam: string,
  defenderTeam: string,
  pyramidName: string
) {
  const template = emailTemplates.challengeReceived(
    challengerTeam,
    defenderTeam,
    pyramidName
  );

  const emails = defenderEmails.map((email) => ({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  }));

  return await sendBulkEmails(emails);
}

export async function sendChallengeAcceptedNotification(
  challengerEmails: string[],
  challengerTeam: string,
  defenderTeam: string,
  pyramidName: string
) {
  const template = emailTemplates.challengeAccepted(
    challengerTeam,
    defenderTeam,
    pyramidName
  );

  const emails = challengerEmails.map((email) => ({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  }));

  return await sendBulkEmails(emails);
}

export async function sendChallengeRejectedNotification(
  challengerEmails: string[],
  challengerTeam: string,
  defenderTeam: string,
  pyramidName: string
) {
  const template = emailTemplates.challengeRejected(
    challengerTeam,
    defenderTeam,
    pyramidName
  );

  const emails = challengerEmails.map((email) => ({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  }));

  return await sendBulkEmails(emails);
}

export async function sendMatchResultNotification(
  playerEmails: string[],
  winnerTeam: string,
  loserTeam: string,
  pyramidName: string,
  isWinnerTeam: boolean
) {
  const template = emailTemplates.matchResult(
    winnerTeam,
    loserTeam,
    pyramidName,
    isWinnerTeam
  );

  const emails = playerEmails.map((email) => ({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  }));

  return await sendBulkEmails(emails);
}
