// lib/emailTemplates.ts
interface TeamData {
  id: number;
  displayName: string;
  categoryId: number;
  wins: number;
  losses: number;
}

interface ChallengeEmailData {
  attacker: TeamData;
  defender: TeamData;
  pyramidId: number;
  handicapPoints: number;
}

export function generateChallengeEmailTemplate(
  data: ChallengeEmailData
): string {
  const { attacker, defender, handicapPoints } = data;
  const categoryDiff = (defender.categoryId ?? 0) - (attacker.categoryId ?? 0);

  const getHandicapMessage = () => {
    if (categoryDiff === 0) {
      return {
        message:
          "Ambos equipos están en la misma categoría. ¡Que gane el mejor!",
        color: "#3b82f6",
        bgColor: "#dbeafe",
        textColor: "#1e40af",
      };
    } else if (categoryDiff > 0) {
      return {
        message: `El equipo defensor iniciará con ${handicapPoints} puntos de ventaja en su servicio.`,
        color: "#10b981",
        bgColor: "#d1fae5",
        textColor: "#047857",
      };
    } else {
      return {
        message: `El equipo atacante recibirá ${handicapPoints} puntos adicionales en su servicio.`,
        color: "#f59e0b",
        bgColor: "#fef3c7",
        textColor: "#92400e",
      };
    }
  };

  const handicapInfo = getHandicapMessage();

  return `
<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Nuevo Desafío en la Pirámide!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        
        <!-- Main Container -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0f172a;
; padding: 20px 0;">
            <tr>
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color:  #1e293b;border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(148, 163, 184, 0.2); overflow: hidden;">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background-color: #ea580c; background-color: #ea580c; padding: 40px 30px; text-align: center;">
                                <div style="font-size: 48px; margin-bottom: 15px;">⚔️</div>
                                <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 800; color: #ffffff; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">¡Nuevo Desafío!</h1>
                                <p style="margin: 0; font-size: 18px; color: #fed7aa; font-weight: 500;">Un equipo quiere subir en la pirámide</p>
                            </td>
                        </tr>
                        
                        <!-- Teams Battle Section -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                
                                <!-- Teams Container -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                    <tr>
                                        <!-- Attacker Team -->
                                        <td width="45%" style="vertical-align: top;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 16px; padding: 20px; position: relative;">
                                                <tr>
                                                    <td>
                                                        <div style="background-color: #fee2e2; color: #991b1b; padding: 6px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; margin-bottom: 15px; border: 1px solid #fecaca;">
                                                            ATACANTE
                                                        </div>
                                                        <h3 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #1e293b; text-align: center;">${
                                                          attacker.displayName
                                                        }</h3>
                                                        <div style="text-align: center; margin-bottom: 20px;">
                                                            <span style="display: inline-block; padding: 8px 16px; background-color: #ede9fe; border: 1px solid #c4b5fd; border-radius: 20px; color: #6b21a8; font-size: 14px; font-weight: 600;">
                                                                Categoría ${
                                                                  attacker.categoryId
                                                                }
                                                            </span>
                                                        </div>
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td width="45%" style="text-align: center;">
                                                                    <div style="font-size: 24px; font-weight: 700; color: #10b981; line-height: 1; margin-bottom: 4px;">${
                                                                      attacker.wins ||
                                                                      0
                                                                    }</div>
                                                                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">VICTORIAS</div>
                                                                </td>
                                                                <td width="10%" style="text-align: center;">
                                                                    <div style="width: 1px; height: 30px; background-color: #cbd5e1; margin: 0 auto;"></div>
                                                                </td>
                                                                <td width="45%" style="text-align: center;">
                                                                    <div style="font-size: 24px; font-weight: 700; color: #ef4444; line-height: 1; margin-bottom: 4px;">${
                                                                      attacker.losses ||
                                                                      0
                                                                    }</div>
                                                                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">DERROTAS</div>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                        
                                        <!-- VS Section -->
                                        <td width="10%" style="text-align: center; vertical-align: middle;">
                                            <div style="font-size: 36px; font-weight: 800; color: #ea580c; text-shadow: 2px 2px 4px rgba(234, 88, 12, 0.3);">VS</div>
                                        </td>
                                        
                                        <!-- Defender Team -->
                                        <td width="45%" style="vertical-align: top;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 16px; padding: 20px;">
                                                <tr>
                                                    <td>
                                                        <div style="background-color: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; margin-bottom: 15px; border: 1px solid #e2e8f0;">
                                                            DEFENSOR
                                                        </div>
                                                        <h3 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #1e293b; text-align: center;">${
                                                          defender.displayName
                                                        }</h3>
                                                        <div style="text-align: center; margin-bottom: 20px;">
                                                            <span style="display: inline-block; padding: 8px 16px; background-color: #ede9fe; border: 1px solid #c4b5fd; border-radius: 20px; color: #6b21a8; font-size: 14px; font-weight: 600;">
                                                                Categoría ${
                                                                  defender.categoryId
                                                                }
                                                            </span>
                                                        </div>
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td width="45%" style="text-align: center;">
                                                                    <div style="font-size: 24px; font-weight: 700; color: #10b981; line-height: 1; margin-bottom: 4px;">${
                                                                      defender.wins ||
                                                                      0
                                                                    }</div>
                                                                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">VICTORIAS</div>
                                                                </td>
                                                                <td width="10%" style="text-align: center;">
                                                                    <div style="width: 1px; height: 30px; background-color: #cbd5e1; margin: 0 auto;"></div>
                                                                </td>
                                                                <td width="45%" style="text-align: center;">
                                                                    <div style="font-size: 24px; font-weight: 700; color: #ef4444; line-height: 1; margin-bottom: 4px;">${
                                                                      defender.losses ||
                                                                      0
                                                                    }</div>
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
                                
                                <!-- Handicap Information -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${
                                  handicapInfo.bgColor
                                }; border: 2px solid ${
    handicapInfo.color
  }; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                                    <tr>
                                        <td>
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                <tr>
                                                    <td width="30" style="vertical-align: top; padding-top: 2px;">
                                                        <div style="font-size: 20px;">
                                                            ${
                                                              categoryDiff === 0
                                                                ? "⚡"
                                                                : categoryDiff <
                                                                  0
                                                                ? "⚠️"
                                                                : "📈"
                                                            }
                                                        </div>
                                                    </td>
                                                    <td style="vertical-align: top;">
                                                        <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: ${
                                                          handicapInfo.textColor
                                                        };">
                                                            ${
                                                              categoryDiff === 0
                                                                ? "Combate Equilibrado"
                                                                : categoryDiff <
                                                                  0
                                                                ? "Desafío Arriesgado"
                                                                : "Ventaja Táctica"
                                                            }
                                                        </h4>
                                                        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                                                            ${
                                                              handicapInfo.message
                                                            }
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Action Button -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="text-align: center;">
                                            <a href="${
                                              process.env.NEXT_PUBLIC_APP_URL
                                            }/mis-retas" 
                                               style="display: inline-block; padding: 16px 32px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.4);">
                                                ⚔️ VER DESAFÍO
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                            </td>
                        </tr>
                        
                              
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: rgba(15, 23, 42, 0.5); padding: 20px 30px; text-align: center; ">
                                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
                                    Has recibido este email porque tu equipo ha sido desafiado en la pirámide.
                                </p>
                                <p style="margin: 0;">
                                    <a href="${
                                      process.env.NEXT_PUBLIC_APP_URL
                                    }" style="color: #ea580c; text-decoration: none; font-weight: 600;">
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
