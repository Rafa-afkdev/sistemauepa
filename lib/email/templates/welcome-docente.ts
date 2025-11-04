interface WelcomeDocenteEmailProps {
  docenteName: string;
  docenteApellidos: string;
  email: string;
  password: string;
}

export function getWelcomeDocenteEmailTemplate({
  docenteName,
  docenteApellidos,
  email,
  password,
}: WelcomeDocenteEmailProps): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenido al Sistema - U.E.P Adventista Alejandro Oropeza Castillo</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header with School Colors -->
              <tr>
                <td style="background: linear-gradient(135deg, #FFC107 0%, #003366 100%); padding: 40px 20px; text-align: center;">
                  <img src="https://i.imgur.com/your-logo-url.png" alt="Logo Colegio" style="max-width: 120px; height: auto; margin-bottom: 15px;" />
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
                    U.E.P ADVENTISTA<br/>ALEJANDRO OROPEZA CASTILLO
                  </h1>
                </td>
              </tr>

              <!-- Welcome Message -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #003366; margin: 0 0 20px 0; font-size: 22px;">
                    ¡Bienvenido/a al Sistema, ${docenteName} ${docenteApellidos}!
                  </h2>
                  
                  <p style="color: #333333; line-height: 1.6; margin: 0 0 15px 0; font-size: 16px;">
                    Nos complace informarle que su cuenta de docente ha sido creada exitosamente en nuestro sistema de gestión educativa.
                  </p>

                  <p style="color: #333333; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
                    A continuación, encontrará sus credenciales de acceso:
                  </p>

                  <!-- Credentials Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #FFC107; border-radius: 4px; margin-bottom: 25px;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 10px 0; color: #003366; font-weight: bold; font-size: 14px;">
                          📧 CORREO ELECTRÓNICO
                        </p>
                        <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; font-family: 'Courier New', monospace;">
                          ${email}
                        </p>
                        
                        <p style="margin: 0 0 10px 0; color: #003366; font-weight: bold; font-size: 14px;">
                          🔑 CONTRASEÑA TEMPORAL
                        </p>
                        <p style="margin: 0; color: #333333; font-size: 16px; font-family: 'Courier New', monospace;">
                          ${password}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Security Notice -->
                  <div style="background-color: #fff3cd; border-left: 4px solid #DC143C; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                      <strong>⚠️ Importante:</strong> Por su seguridad, le recomendamos cambiar su contraseña después de iniciar sesión por primera vez.
                    </p>
                  </div>

                  <!-- Access Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" 
                           style="display: inline-block; background: linear-gradient(135deg, #003366 0%, #FFC107 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 51, 102, 0.3);">
                          Acceder al Sistema
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="color: #666666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                    Si tiene alguna pregunta o necesita asistencia, no dude en contactar al departamento de administración.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #003366; padding: 25px 30px; text-align: center;">
                  <p style="color: #FFC107; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">
                    "MANO AMIGA - MENTE SABIA - CORAZÓN NOBLE"
                  </p>
                  <p style="color: #ffffff; margin: 0; font-size: 13px; line-height: 1.5;">
                    Guarenas, Edo. Miranda<br/>
                    © ${new Date().getFullYear()} U.E.P Adventista Alejandro Oropeza Castillo
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
