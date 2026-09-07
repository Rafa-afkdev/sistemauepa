"use server";

import { Resend } from "resend";

interface SendEmailOptions {
  sendTo: string;
  subject: string;
  body: string;
  replyTo?: string;
}

export async function SendEmail({ sendTo, subject, body, replyTo }: SendEmailOptions) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY no está configurada en las variables de entorno.");
    }

    if (!sendTo || !subject || !body) {
      throw new Error("Faltan campos requeridos: sendTo, subject o body");
    }

    const resend = new Resend(apiKey);
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Colegio UEPA <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: sendTo,
      subject: subject,
      html: body,
      replyTo: replyTo,
    });

    if (error) {
      console.error("Error sending email with Resend:", error);
      throw new Error(error.message || "Error al enviar el correo con Resend");
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Failed to send email:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al enviar el email";
    throw new Error(message);
  }
}
