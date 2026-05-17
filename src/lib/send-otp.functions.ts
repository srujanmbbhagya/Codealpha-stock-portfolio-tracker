import { createServerFn } from "@tanstack/react-start";

/**
 * Sends an OTP code via Twilio SMS if credentials are configured.
 * Falls back to "demo" mode if env vars are missing — in that case the
 * code is returned to the client so it can be shown in a toast.
 *
 * Required env (server-only):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER  (e.g. +15551234567)
 */
export const sendOtpSms = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string; code: string }) => {
    if (!data?.phone || !/^\+?\d{8,15}$/.test(data.phone.replace(/\s+/g, ""))) {
      throw new Error("Invalid phone number");
    }
    if (!data.code || !/^\d{4,8}$/.test(data.code)) {
      throw new Error("Invalid code");
    }
    return { phone: data.phone.replace(/\s+/g, ""), code: data.code };
  })
  .handler(async ({ data }) => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    if (!sid || !token || !from) {
      return {
        delivered: false as const,
        mode: "demo" as const,
        message: "SMS provider not configured. Showing demo code.",
      };
    }

    const phone = data.phone.startsWith("+") ? data.phone : `+${data.phone}`;
    const body = `Your WealthLens.ai verification code is ${data.code}. Valid for 5 minutes.`;

    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, From: from, Body: body }).toString(),
      },
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Twilio error:", errText);
      return {
        delivered: false as const,
        mode: "error" as const,
        message: "SMS provider failed. Showing demo code as fallback.",
      };
    }

    return { delivered: true as const, mode: "live" as const, message: "OTP sent" };
  });
