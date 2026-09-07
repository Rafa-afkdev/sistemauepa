import { type NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Crear instancia de Resend dentro de la función
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { sendTo, subject, body, replyTo } = await request.json();

    if (!sendTo || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields: sendTo, subject, body" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: error.message || "Failed to send email" },
        { status: 500 }
      );
    }

    console.log("Email sent successfully:", data);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    console.error("Failed to send email:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
