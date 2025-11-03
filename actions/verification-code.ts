"use server";

import { SendEmail } from "@/lib/email/resend";

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

/**
 * Generate a 6-digit verification code
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification code to user's email
 */
export async function sendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const code = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store code
    verificationCodes.set(email, { code, expiresAt });

    // Send email
    await SendEmail({
      sendTo: email,
      subject: "Código de verificación - Colegio UEPA",
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Código de Verificación</h2>
          <p>Has solicitado cambiar el estado de un período escolar a INACTIVO.</p>
          <p>Tu código de verificación es:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #6b7280; font-size: 14px;">Este código expira en 5 minutos.</p>
          <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este código, ignora este mensaje.</p>
        </div>
      `,
    });

    console.log(`Verification code sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending verification code:", error);
    return { success: false, error: "Error al enviar el código de verificación" };
  }
}

/**
 * Verify the code entered by the user
 */
export async function verifyCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  const stored = verificationCodes.get(email);

  if (!stored) {
    return { success: false, error: "No se encontró un código de verificación para este usuario" };
  }

  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(email);
    return { success: false, error: "El código ha expirado. Solicita uno nuevo" };
  }

  if (stored.code !== code) {
    return { success: false, error: "Código incorrecto" };
  }

  // Code is valid, remove it
  verificationCodes.delete(email);
  return { success: true };
}
