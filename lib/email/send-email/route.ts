import { NextResponse } from 'next/server';
import { SendEmail } from '../resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validación básica
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Crear el contenido del email en HTML
    const emailBody = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              background: #f5f7fa;
              padding: 40px 20px;
            }
            .email-wrapper {
              max-width: 650px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            }
            .header {
              background: #4B1F82;
              padding: 50px 40px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
              animation: pulse 15s ease-in-out infinite;
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.6; }
              50% { transform: scale(1.1); opacity: 0.9; }
            }
            .logo-container {
              position: relative;
              z-index: 1;
              margin-bottom: 20px;
            }
            .logo {
              max-width: 180px;
              height: auto;
              filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
            }
            .header h1 {
              color: #ffffff;
              font-size: 28px;
              font-weight: 700;
              margin: 15px 0 10px;
              position: relative;
              z-index: 1;
              text-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            .header p {
              color: rgba(255, 255, 255, 0.95);
              font-size: 16px;
              position: relative;
              z-index: 1;
            }
            .content {
              padding: 45px 40px;
              background: #ffffff;
            }
            .greeting {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 25px;
              font-weight: 600;
              padding: 20px;
              background: #f0f9ff;
              border-radius: 12px;
              border-left: 4px solid #00C853;
            }
            .info-card {
              background: #ffffff;
              border-left: 5px solid #4B1F82;
              border-radius: 16px;
              padding: 30px;
              margin-bottom: 20px;
              box-shadow: 0 4px 12px rgba(75, 31, 130, 0.1);
              transition: transform 0.3s ease;
            }
            .info-row {
              display: flex;
              margin-bottom: 18px;
              align-items: flex-start;
            }
            .info-row:last-child {
              margin-bottom: 0;
            }
            .icon {
              width: 44px;
              height: 44px;
              background: #4B1F82;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              flex-shrink: 0;
              box-shadow: 0 4px 14px rgba(75, 31, 130, 0.35);
            }
            .icon svg {
              width: 20px;
              height: 20px;
              fill: white;
            }
            .info-content {
              flex: 1;
            }
            .label {
              font-weight: 700;
              color: #4B1F82;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 5px;
            }
            .value {
              color: #374151;
              font-size: 15px;
              line-height: 1.6;
            }
            .value a {
              color: #00C853;
              text-decoration: none;
              font-weight: 600;
              transition: color 0.3s ease;
            }
            .value a:hover {
              color: #00D4FF;
            }
            .message-box {
              background: #ffffff;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 20px;
              margin-top: 10px;
              color: #374151;
              font-size: 15px;
              line-height: 1.8;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            .cta-button {
              display: inline-block;
              background: #00C853;
              color: white;
              padding: 16px 36px;
              border-radius: 30px;
              text-decoration: none;
              font-weight: 700;
              margin: 25px 0;
              box-shadow: 0 8px 24px rgba(0, 200, 83, 0.4);
              transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-size: 14px;
            }
            .cta-button:hover {
              transform: translateY(-3px);
              background: #00D4FF;
              box-shadow: 0 12px 32px rgba(0, 212, 255, 0.5);
            }
            .footer {
              background: #2d3748;
              padding: 40px 40px;
              text-align: center;
              color: #cbd5e0;
              border-top: 4px solid #4B1F82;
            }
            .footer-logo {
              max-width: 140px;
              height: auto;
              margin-bottom: 20px;
              filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
            }
            .footer p {
              font-size: 13px;
              line-height: 1.8;
              margin-bottom: 8px;
            }
            .footer a {
              color: #00C853;
              text-decoration: none;
              font-weight: 600;
            }
            .divider {
              height: 2px;
              background: #e5e7eb;
              margin: 25px 0;
              border-radius: 2px;
            }
            @media only screen and (max-width: 600px) {
              body {
                padding: 20px 10px;
              }
              .header, .content, .footer {
                padding: 30px 20px;
              }
              .header h1 {
                font-size: 24px;
              }
              .info-row {
                flex-direction: column;
              }
              .icon {
                margin-bottom: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <!-- Header con gradiente y logo -->
            <div class="header">
              <div class="logo-container">
                <img src="https://unidxswnc.org/_next/image?url=%2FLogo.png&w=256&q=75" alt="UNIDXS Logo" class="logo">
              </div>
              <h1>✨ Nuevo Mensaje de Contacto</h1>
              <p>Formulario Web - UNIDXS WNC</p>
            </div>

            <!-- Contenido principal -->
            <div class="content">
              <div class="greeting">
                👋 ¡Hola! Has recibido un nuevo mensaje desde tu sitio web UNIDXS.
              </div>

              <div class="info-card">
                <!-- Nombre -->
                <div class="info-row">
                  <div class="icon">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div class="info-content">
                    <div class="label">Nombre</div>
                    <div class="value">${name}</div>
                  </div>
                </div>

                <!-- Email -->
                <div class="info-row">
                  <div class="icon">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                  <div class="info-content">
                    <div class="label">Correo Electrónico</div>
                    <div class="value"><a href="mailto:${email}">${email}</a></div>
                  </div>
                </div>

                ${phone ? `
                <!-- Teléfono -->
                <div class="info-row">
                  <div class="icon">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </div>
                  <div class="info-content">
                    <div class="label">Teléfono</div>
                    <div class="value">${phone}</div>
                  </div>
                </div>
                ` : ''}

                <!-- Asunto -->
                <div class="info-row">
                  <div class="icon">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                  </div>
                  <div class="info-content">
                    <div class="label">Asunto</div>
                    <div class="value">${subject}</div>
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Mensaje -->
                <div class="info-row">
                  <div class="icon">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                    </svg>
                  </div>
                  <div class="info-content">
                    <div class="label">Mensaje</div>
                    <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
                  </div>
                </div>
              </div>

              <center>
                <a href="mailto:${email}" class="cta-button">
                  ✉️ Responder a ${name}
                </a>
              </center>
            </div>

            <!-- Footer -->
            <div class="footer">
              <img src="https://unidxswnc.org/_next/image?url=%2FLogo.png&w=256&q=75" alt="UNIDXS Logo" class="footer-logo">
              <p><strong>UNIDXS WNC</strong></p>
              <p>🤝 Trabajamos por la comunidad</p>
              <p style="margin-top: 15px;">
                <a href="https://unidxswnc.org">🌐 unidxswnc.org</a>
              </p>
              <p style="font-size: 11px; margin-top: 15px; opacity: 0.7;">
                Este correo fue generado automáticamente desde el formulario de contacto
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar el email usando Resend
    const result = await SendEmail({
      sendTo: 'Rball@unidxSwnc.org', // Siempre enviar a este correo
      subject: `📩 Contacto Web: ${subject}`,
      body: emailBody,
      replyTo: email, // Para que puedas responder directamente al usuario
    });

    console.log('Email sent successfully via Resend');

    return NextResponse.json({ 
      success: true, 
      data: result.data 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Proporcionar más detalles del error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
