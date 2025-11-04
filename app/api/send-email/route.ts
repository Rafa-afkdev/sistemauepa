import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { sendTo, subject, body, replyTo } = await request.json();

    if (!sendTo || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields: sendTo, subject, body" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: error.message || "Failed to send email" },
        { status: 500 }
      );
    }

    console.log("Email sent successfully:", data);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
