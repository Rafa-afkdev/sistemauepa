import { Resend } from "resend";

interface SendEmailOptions {
  sendTo: string;
  subject: string;
  body: string;
  replyTo?: string;
}

export async function SendEmail({ sendTo, subject, body, replyTo }: SendEmailOptions) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { data, error } = await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
      to: sendTo,
      subject: subject,
      html: body,
      replyTo: replyTo,
    });
    
    if (error) {
      console.error("Error sending email with Resend:", error);
      throw new Error(error.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}
