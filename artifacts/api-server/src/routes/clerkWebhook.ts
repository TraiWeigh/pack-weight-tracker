import { Router } from "express";
import { Webhook } from "svix";
import { Resend } from "resend";
import { logger } from "../lib/logger";

const router = Router();

router.post(
  "/webhooks/clerk",
  async (req, res) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      logger.error("CLERK_WEBHOOK_SECRET is not set");
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }

    // Svix requires the raw body — captured by express.raw() in app.ts
    const rawBody: Buffer = (req as any).rawBody;
    if (!rawBody) {
      logger.error("No raw body available for Svix verification");
      res.status(400).json({ error: "Missing raw body" });
      return;
    }

    const svixId = req.headers["svix-id"] as string;
    const svixTimestamp = req.headers["svix-timestamp"] as string;
    const svixSignature = req.headers["svix-signature"] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      res.status(400).json({ error: "Missing Svix headers" });
      return;
    }

    let event: { type: string; data: Record<string, any> };
    try {
      const wh = new Webhook(secret);
      event = wh.verify(rawBody, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof event;
    } catch (err) {
      logger.warn({ err }, "Svix signature verification failed");
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    if (event.type === "user.created") {
      const data = event.data;
      const email =
        (data.email_addresses as Array<{ email_address: string }>)?.[0]
          ?.email_address ?? "(unknown)";
      const createdAt = data.created_at
        ? new Date(data.created_at as number).toISOString()
        : new Date().toISOString();

      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        logger.error("RESEND_API_KEY is not set — cannot send notification email");
        res.status(500).json({ error: "Email service not configured" });
        return;
      }

      const resend = new Resend(apiKey);
      let sendResult: Awaited<ReturnType<typeof resend.emails.send>>;
      try {
        sendResult = await resend.emails.send({
          from: "Pack Checklist <notifications@packweightchecklist.com>",
          to: "mixed.revamp.3q@icloud.com",
          subject: "New user signed up",
          text: `A new user just created an account.\n\nEmail: ${email}\nSigned up at: ${createdAt}`,
          html: `<p>A new user just created an account.</p><p><strong>Email:</strong> ${email}<br><strong>Signed up at:</strong> ${createdAt}</p>`,
        });
      } catch (err) {
        logger.error({ err }, "Resend threw while sending new user notification");
        res.status(500).json({ error: "Failed to send notification email" });
        return;
      }

      if (sendResult.error) {
        logger.error({ error: sendResult.error }, "Resend reported an error sending new user notification");
        res.status(500).json({ error: "Failed to send notification email" });
        return;
      }

      logger.info({ email, messageId: sendResult.data?.id }, "New user notification sent");
    }

    res.status(200).json({ received: true });
  },
);

export default router;
