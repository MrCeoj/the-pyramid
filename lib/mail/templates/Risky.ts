

interface RiskyWarningMailData {
  team: TeamWithPlayers;
  pyramidId: number;
  currentPosition?: number;
  nextRowPosition?: number;
}

export default function generateRiskyWarningEmailTemplate(
  mailData: RiskyWarningMailData
): string {
  const { team, currentPosition, nextRowPosition } = mailData;

  return `
<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>⚠️ Alerta de Inactividad - Riesgo de Reposicionamiento</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        
        <!-- Main Container -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0f172a; padding: 20px 0;">
            <tr>
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #1e293b; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid rgba(148, 163, 184, 0.2); overflow: hidden;">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                                <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                                <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 800; color: #ffffff; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">¡Alerta de Inactividad!</h1>
                                <p style="margin: 0; font-size: 18px; color: #fed7aa; font-weight: 500;">Tu equipo está en riesgo de reposicionamiento</p>
                            </td>
                        </tr>
                        
                        <!-- Warning Message -->
                        <tr>
                            <td style="padding: 30px 30px 20px 30px;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                                    <tr>
                                        <td>
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td width="30" style="vertical-align: top; padding-top: 2px;">
                                                        <div style="font-size: 20px;">⏰</div>
                                                    </td>
                                                    <td style="vertical-align: top;">
                                                        <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #d97706;">
                                                            Estado: RIESGO DE REPOSICIONAMIENTO
                                                        </h4>
                                                        <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
                                                            <strong>${team.displayName}</strong> no ha jugado ningún partido esta semana. Tu equipo ha sido marcado como "en riesgo" y debe jugar cuanto antes para evitar ser penalizado.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Team Info -->
                        <tr>
                            <td style="padding: 0 30px 20px 30px;">
                                
                                <!-- Team Container -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                    <tr>
                                        <td style="text-align: center;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="400" style="max-width: 400px; margin: 0 auto; background-color: #fef2f2; border: 2px solid #fca5a5; border-radius: 16px; padding: 25px;">
                                                <tr>
                                                    <td>
                                                        <div style="background-color: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; margin-bottom: 20px; border: 1px solid #fecaca;">
                                                            ⚠️ EQUIPO EN RIESGO
                                                        </div>
                                                        <h3 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #1e293b; text-align: center;">${team.displayName}</h3>
                                                        <div style="text-align: center; margin-bottom: 25px;">
                                                            <span style="display: inline-block; padding: 10px 20px; background-color: #ede9fe; border: 1px solid #c4b5fd; border-radius: 20px; color: #6b21a8; font-size: 16px; font-weight: 600;">
                                                                Categoría ${team.categoryId}
                                                            </span>
                                                        </div>
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                                            <tr>
                                                                <td width="45%" style="text-align: center;">
                                                                    <div style="font-size: 28px; font-weight: 700; color: #10b981; line-height: 1; margin-bottom: 4px;">${team.wins || 0}</div>
                                                                    <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">VICTORIAS</div>
                                                                </td>
                                                                <td width="10%" style="text-align: center;">
                                                                    <div style="width: 1px; height: 35px; background-color: #cbd5e1; margin: 0 auto;"></div>
                                                                </td>
                                                                <td width="45%" style="text-align: center;">
                                                                    <div style="font-size: 28px; font-weight: 700; color: #ef4444; line-height: 1; margin-bottom: 4px;">${team.losses || 0}</div>
                                                                    <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">DERROTAS</div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                        ${currentPosition ? `
                                                        <div style="text-align: center;">
                                                            <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Posición Actual</div>
                                                            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">Fila ${currentPosition}</div>
                                                        </div>
                                                        ` : ''}
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Consequences Warning -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                                    <tr>
                                        <td>
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td width="30" style="vertical-align: top; padding-top: 2px;">
                                                        <div style="font-size: 20px;">📉</div>
                                                    </td>
                                                    <td style="vertical-align: top;">
                                                        <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #dc2626;">
                                                            Consecuencias del Reposicionamiento
                                                        </h4>
                                                        <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.5;">
                                                            Si haces caso omiso, tu equipo será automáticamente reposicionado a la fila inferior en la última posición disponible.${nextRowPosition ? ` Esto significa que bajarías a la fila ${nextRowPosition}.` : ''} ¡No pierdas tu lugar en la pirámide!
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Action Steps -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                                    <tr>
                                        <td>
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td width="30" style="vertical-align: top; padding-top: 2px;">
                                                        <div style="font-size: 20px;">🎯</div>
                                                    </td>
                                                    <td style="vertical-align: top;">
                                                        <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #1d4ed8;">
                                                            ¿Cómo Evitar el Reposicionamiento?
                                                        </h4>
                                                        <div style="font-size: 14px; color: #1e40af; line-height: 1.6;">
                                                            <p style="margin: 0 0 8px 0;"><strong>Opción 1:</strong> Acepta un desafío pendiente si tienes alguno</p>
                                                            <p style="margin: 0 0 8px 0;"><strong>Opción 2:</strong> Desafía a otro equipo de una posición superior</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Action Buttons -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="text-align: center;">
                                            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                                <tr>
                                                    <td style="padding-right: 10px;">
                                                        <a href="${process.env.NEXT_PUBLIC_URL}/mis-retas" 
                                                           style="display: inline-block; padding: 16px 24px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                                                            📱 MIS DESAFÍOS
                                                        </a>
                                                    </td>
                                                    <td style="padding-left: 10px;">
                                                        <a href="${process.env.NEXT_PUBLIC_URL}" 
                                                           style="display: inline-block; padding: 16px 24px; background-color: #f59e0b; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                                                            ⚔️ HACER DESAFÍO
                                                        </a>
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
                                    Has recibido este email porque tu equipo ha sido marcado como inactivo en la pirámide.
                                </p>
                                <p style="margin: 0;">
                                    <a href="${process.env.NEXT_PUBLIC_URL}" style="color: #f59e0b; text-decoration: none; font-weight: 600;">
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