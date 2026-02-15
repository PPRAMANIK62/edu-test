import { describe, it, expect } from "vitest";
import crypto from "crypto";

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

describe("verifyWebhookSignature", () => {
  const secret = "test_webhook_secret";

  function sign(body: string): string {
    return crypto.createHmac("sha256", secret).update(body).digest("hex");
  }

  it("returns true for valid signature", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = sign(body);
    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("returns false for invalid signature", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const wrongSig = sign(body).replace(/[a-f]/g, "0").replace(/[0-9]/g, "a");
    const paddedSig = wrongSig
      .padEnd(sign(body).length, "x")
      .slice(0, sign(body).length);
    expect(verifyWebhookSignature(body, paddedSig, secret)).toBe(false);
  });

  it("returns false for tampered body", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = sign(body);
    const tamperedBody = JSON.stringify({ event: "payment.failed" });
    expect(verifyWebhookSignature(tamperedBody, signature, secret)).toBe(false);
  });

  it("throws for mismatched buffer lengths", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const shortSignature = "abc";
    expect(() =>
      verifyWebhookSignature(body, shortSignature, secret),
    ).toThrow();
  });

  it("returns true for different payload types", () => {
    const body = JSON.stringify({
      event: "refund.created",
      payload: { refund: { entity: { id: "rfnd_123" } } },
    });
    const signature = sign(body);
    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("fails when secret is wrong", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = sign(body);
    const wrongSecret = "wrong_secret";
    const expectedSig = crypto
      .createHmac("sha256", wrongSecret)
      .update(body)
      .digest("hex");
    expect(verifyWebhookSignature(body, expectedSig, secret)).toBe(false);
  });
});
