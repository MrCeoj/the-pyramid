import { TeamWithPlayers } from "@/actions/PositionActions";

interface MailData {
  attacker: TeamWithPlayers;
  defender: TeamWithPlayers;
  pyramidId: number;
}

export default function generateRejectEmailTemplate(emailData: MailData): string {
  const { attacker, defender } = emailData;

  return `
<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Desafío Rechazado</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        
        <!-- Main Container -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0f172a; padding: 20px 0;">
            <tr>
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #1e293b; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid rgba(148, 163, 184, 0.2); overflow: hidden;">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
                                <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                                <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 800; color: #ffffff; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">Desafío Rechazado</h1>
                                <p style="margin: 0; font-size: 18px; color: #fecaca; font-weight: 500;">El combate no se llevará a cabo</p>
                            </td>
                        </tr>
                        
                        <!-- Rejection Message -->
                        <tr>
                            <td style="padding: 30px 30px 20px 30px;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                                    <tr>
                                        <td>
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td width="30" style="vertical-align: top; padding-top: 2px;">
                                                        <div style="font-size: 20px;">🛡️</div>
                                                    </td>
                                                    <td style="vertical-align: top;">
                                                        <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #dc2626;">
                                                            Desafío Rechazado
                                                        </h4>
                                                        <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.5;">
                                                            <strong>${defender.displayName}</strong> ha decidido rechazar el desafío de <strong>${attacker.displayName}</strong>. El equipo defensor mantiene su posición en la pirámide.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Teams Section -->
                        <tr>
                            <td style="padding: 0 30px 20px 30px;">
                                
                                <!-- Teams Container -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                    <tr>
                                        <!-- Attacker Team -->
                                        <td width="45%" style="vertical-align: top;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 16px; padding: 20px; opacity: 0.7;">
                                                <tr>
                                                    <td>
                                                        <div style="background-color: #fee2e2; color: #991b1b; padding: 6px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; margin-bottom: 15px; border: 1px solid #fecaca;">
                                                            ATACANTE
                                                        </div>
                                                        <h3 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #1e293b; text-align: center;">${attacker.displayName}</h3>
                                                        <div style="text-align: center; margin-bottom: 20px;">
                                                            <span style="display: inline-block; padding: 8px 16px; background-color: #ede9fe; border: 1px solid #c4b5fd; border-radius: 20px; color: #6b21a8; font-size: 14px; font-weight: 600;">
                                                                Categoría ${attacker.categoryId}
                                                            </span>
                                                        </div>
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td width="45%" style="text-align: center;">
                                                                    <div style="font-size: 24px; font-weight: 700; color: #10b981; line-height: 1; margin-bottom: 4px;">${attacker.wins || 0}</div>
                                                                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">VICTORIAS</div>
                                                                </td>
                                                                <td width="10%" style="text-align: center;">
                                                                    <div style="width: 1px; height: 30px; background-color: #cbd5e1; margin: 0 auto;"></div>
                                                                </td>
                                                                <td width="45%" style="text-align: center;">
                                                                    <div style="font-size: 24px; font-weight: 700; color: #ef4444; line-height: 1; margin-bottom: 4px;">${attacker.losses || 0}</div>
                                                                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">DERROTAS</div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                        
                                        <!-- Rejected Symbol -->
                                        <td width="10%" style="text-align: center; vertical-align: middle;">
                                            <div style="font-size: 36px; font-weight: 800; color: #dc2626; text-shadow: 2px 2px 4px rgba(220, 38, 38, 0.3);">✗</div>
                                        </td>
                                        
                                        <!-- Defender Team -->
                                        <td width="45%" style="vertical-align: top;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f0f9ff; border: 2px solid #38bdf8; border-radius: 16px; padding: 20px;">
                                                <tr>
                                                    <td>
                                                        <div style="background-color: #e0f2fe; color: #0c4a6e; padding: 6px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; margin-bottom: 15px; border: 1px solid #7dd3fc;">
                                                            DEFENSOR
                                                        </div>
                                                        <h3 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #1e293b; text-align: center;">${defender.displayName}</h3>
                                                        <div style="text-align: center; margin-bottom: 20px;">
                                                            <span style="display: inline-block; padding: 8px 16px; background-color: #ede9fe; border: 1px solid #c4b5fd; border-radius: 20px; color: #6b21a8; font-size: 14px; font-weight: 600;">
                                                                Categoría ${defender.categoryId}
                                                            </span>
                                                        </div>
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td width="45%" style="text-align: center;">
                                                                    <div style="font-size: 24px; font-weight: 700; color: #10b981; line-height: 1; margin-bottom: 4px;">${defender.wins || 0}</div>
                                                                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">VICTORIAS</div>
                                                                </td>
                                                                <td width="10%" style="text-align: center;">
                                                                    <div style="width: 1px; height: 30px; background-color: #cbd5e1; margin: 0 auto;"></div>
                                                                </td>
                                                                <td width="45%" style="text-align: center;">
                                                                    <div style="font-size: 24px; font-weight: 700; color: #ef4444; line-height: 1; margin-bottom: 4px;">${defender.losses || 0}</div>
                                                                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">DERROTAS</div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Status Information -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f1f5f9; border: 2px solid #64748b; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                                    <tr>
                                        <td>
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td width="30" style="vertical-align: top; padding-top: 2px;">
                                                        <div style="font-size: 20px;">📊</div>
                                                    </td>
                                                    <td style="vertical-align: top;">
                                                        <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #475569;">
                                                            Estado de la Pirámide
                                                        </h4>
                                                        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                                                            Las posiciones en la pirámide se mantienen sin cambios. <strong>${defender.displayName}</strong> conserva su posición actual y <strong>${attacker.displayName}</strong> puede intentar un nuevo desafío.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Next Steps for Attacker -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fff7ed; border: 2px solid #fb923c; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                                    <tr>
                                        <td>
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td width="30" style="vertical-align: top; padding-top: 2px;">
                                                        <div style="font-size: 20px;">💡</div>
                                                    </td>
                                                    <td style="vertical-align: top;">
                                                        <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #ea580c;">
                                                            ¿Qué Puedes Hacer Ahora?
                                                        </h4>
                                                        <p style="margin: 0; font-size: 14px; color: #9a3412; line-height: 1.5;">
                                                            No se desanimen, <strong>${attacker.displayName}</strong>. Aún pueden desafiar a otros equipos en posiciones similares ¡Sigan entrenando y mejorando su juego!
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: rgba(15, 23, 42, 0.5); padding: 20px 30px; text-align: center;">
                                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                                    Has recibido este email porque tu desafío ha sido procesado en la pirámide.
                                </p>
                                <p style="margin: 0;">
                                    <a href="${process.env.NEXT_PUBLIC_URL}" style="color: #dc2626; text-decoration: none; font-weight: 600;">
                                        Ir a la aplicación
                                    </a>
                                </p>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
}