interface SendEmailOptions {
  sendTo: string;
  subject: string;
  body: string;
  replyTo?: string;
}

export async function SendEmail({ sendTo, subject, body, replyTo }: SendEmailOptions) {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sendTo,
        subject,
        body,
        replyTo,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Error sending email:", result.error);
      throw new Error(result.error || "Failed to send email");
    }

    console.log("Email sent successfully:", result.data);
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error("Failed to send email:", error);
    throw error;
  }
}
