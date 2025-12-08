/**
 * Razorpay Webhook Handler - Appwrite Function
 *
 * Handles Razorpay webhook events for payment confirmation.
 * This provides reliable server-side confirmation of payments.
 *
 * Environment Variables Required:
 * - RAZORPAY_WEBHOOK_SECRET: Webhook secret from Razorpay dashboard
 * - APPWRITE_ENDPOINT: Appwrite endpoint URL
 * - APPWRITE_PROJECT_ID: Appwrite project ID
 * - APPWRITE_API_KEY: Appwrite API key with database write permissions
 * - APPWRITE_DATABASE_ID: Database ID
 * - APPWRITE_PURCHASES_TABLE_ID: Purchases table ID
 * - APPWRITE_ENROLLMENTS_TABLE_ID: Enrollments table ID
 *
 * Supported Events:
 * - payment.captured: Payment successful, create/update purchase
 * - payment.failed: Payment failed, update purchase status
 * - refund.created: Refund initiated, update purchase status
 *
 * Webhook URL format:
 * https://<appwrite-endpoint>/v1/functions/<function-id>/executions
 */

import crypto from "crypto";
import { Client, Databases, ID, Permission, Query, Role } from "node-appwrite";
import { Buffer } from "node:buffer";

/**
 * Verify Razorpay webhook signature
 * @param {string} body - Raw request body
 * @param {string} signature - X-Razorpay-Signature header
 * @param {string} secret - Webhook secret
 * @returns {boolean} - True if signature is valid
 */
function verifyWebhookSignature(body, signature, secret) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Main function handler
 * @param {Object} context - Appwrite function context
 */
export default async ({ req, res, log, error }) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.json({ success: false, error: "Method not allowed" }, 405);
  }

  // Get raw body for signature verification
  const rawBody = req.bodyRaw || req.body;
  const signature = req.headers["x-razorpay-signature"];

  // Validate webhook secret is configured
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    error("RAZORPAY_WEBHOOK_SECRET not configured");
    return res.json(
      { success: false, error: "Server configuration error" },
      500
    );
  }

  // Verify signature
  if (!signature) {
    error("Missing X-Razorpay-Signature header");
    return res.json({ success: false, error: "Missing signature" }, 401);
  }

  try {
    const bodyString =
      typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody);
    const isValid = verifyWebhookSignature(
      bodyString,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      error("Invalid webhook signature");
      return res.json({ success: false, error: "Invalid signature" }, 401);
    }
  } catch (e) {
    error("Signature verification failed:", e.message);
    return res.json(
      { success: false, error: "Signature verification failed" },
      401
    );
  }

  // Parse webhook payload
  let payload;
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    error("Failed to parse webhook payload:", e.message);
    return res.json({ success: false, error: "Invalid payload" }, 400);
  }

  const { event, payload: eventPayload } = payload;
  log(`Received webhook event: ${event}`);

  // Validate required environment variables
  const requiredEnvVars = [
    "APPWRITE_ENDPOINT",
    "APPWRITE_PROJECT_ID",
    "APPWRITE_API_KEY",
    "APPWRITE_DATABASE_ID",
    "APPWRITE_PURCHASES_TABLE_ID",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      error(`Missing environment variable: ${envVar}`);
      return res.json(
        { success: false, error: "Server configuration error" },
        500
      );
    }
  }

  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(databases, eventPayload, log, error);
        break;

      case "payment.failed":
        await handlePaymentFailed(databases, eventPayload, log, error);
        break;

      case "refund.created":
        await handleRefundCreated(databases, eventPayload, log, error);
        break;

      case "order.paid":
        // Alternative confirmation - handle similar to payment.captured
        log("Received order.paid event - using as backup confirmation");
        await handlePaymentCaptured(databases, eventPayload, log, error);
        break;

      default:
        log(`Unhandled webhook event: ${event}`);
    }

    return res.json({ success: true, event });
  } catch (e) {
    error(`Error processing webhook event ${event}:`, e.message, e.stack);
    return res.json(
      { success: false, error: "Failed to process webhook" },
      500
    );
  }
};

/**
 * Handle payment.captured event
 * Creates or updates purchase record with completed status
 */
async function handlePaymentCaptured(databases, payload, log, error) {
  const payment = payload.payment?.entity;
  if (!payment) {
    error("No payment entity in payload");
    return;
  }

  const {
    id: paymentId,
    order_id: orderId,
    amount,
    currency,
    method: paymentMethod,
    notes,
  } = payment;

  const courseId = notes?.courseId;
  const studentId = notes?.studentId;

  if (!courseId || !studentId) {
    error("Missing courseId or studentId in payment notes");
    return;
  }

  log(`Processing payment.captured: ${paymentId} for course ${courseId}`);

  // Check for existing purchase (idempotent processing)
  const existingPurchases = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_PURCHASES_TABLE_ID,
    [Query.equal("razorpayPaymentId", paymentId)]
  );

  if (existingPurchases.total > 0) {
    const existing = existingPurchases.documents[0];
    if (existing.paymentStatus === "completed" && existing.webhookVerified) {
      log(`Purchase already processed: ${existing.$id}`);
      return;
    }

    // Update existing record with webhook verification
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_PURCHASES_TABLE_ID,
      existing.$id,
      {
        paymentStatus: "completed",
        webhookVerified: true,
        webhookReceivedAt: new Date().toISOString(),
      }
    );
    log(`Updated existing purchase: ${existing.$id}`);
    return;
  }

  // Check if purchase exists by order ID (client may have created it)
  const orderPurchases = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_PURCHASES_TABLE_ID,
    [Query.equal("razorpayOrderId", orderId)]
  );

  if (orderPurchases.total > 0) {
    const existing = orderPurchases.documents[0];
    // Update with payment details
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_PURCHASES_TABLE_ID,
      existing.$id,
      {
        razorpayPaymentId: paymentId,
        paymentStatus: "completed",
        paymentMethod: paymentMethod || null,
        webhookVerified: true,
        webhookReceivedAt: new Date().toISOString(),
      }
    );
    log(`Updated purchase with payment details: ${existing.$id}`);

    // Create enrollment if not exists
    await createEnrollmentIfNotExists(databases, studentId, courseId, log);
    return;
  }

  // Create new purchase record (webhook arrived before client callback)
  const purchaseData = {
    studentId,
    courseId,
    amount: amount / 100, // Convert from paise to rupees
    currency: currency || "INR",
    purchasedAt: new Date().toISOString(),
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: null,
    paymentStatus: "completed",
    paymentMethod: paymentMethod || null,
    webhookVerified: true,
    webhookReceivedAt: new Date().toISOString(),
  };

  const purchase = await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_PURCHASES_TABLE_ID,
    ID.unique(),
    purchaseData,
    [
      Permission.read(Role.user(studentId)),
      Permission.update(Role.user(studentId)),
    ]
  );

  log(`Created purchase record: ${purchase.$id}`);

  // Create enrollment
  await createEnrollmentIfNotExists(databases, studentId, courseId, log);
}

/**
 * Handle payment.failed event
 * Updates purchase status to failed
 */
async function handlePaymentFailed(databases, payload, log, error) {
  const payment = payload.payment?.entity;
  if (!payment) {
    error("No payment entity in payload");
    return;
  }

  const {
    id: paymentId,
    order_id: orderId,
    error_code: errorCode,
    error_description: errorDescription,
  } = payment;

  log(
    `Processing payment.failed: ${paymentId}, error: ${errorCode} - ${errorDescription}`
  );

  // Find purchase by order ID
  const purchases = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_PURCHASES_TABLE_ID,
    [Query.equal("razorpayOrderId", orderId)]
  );

  if (purchases.total === 0) {
    log(`No purchase found for order: ${orderId}`);
    return;
  }

  const purchase = purchases.documents[0];

  // Don't overwrite completed status
  if (purchase.paymentStatus === "completed") {
    log(`Purchase already completed, ignoring failed event: ${purchase.$id}`);
    return;
  }

  // Update status to failed
  await databases.updateDocument(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_PURCHASES_TABLE_ID,
    purchase.$id,
    {
      razorpayPaymentId: paymentId,
      paymentStatus: "failed",
      webhookVerified: true,
      webhookReceivedAt: new Date().toISOString(),
    }
  );

  log(`Updated purchase status to failed: ${purchase.$id}`);
}

/**
 * Handle refund.created event
 * Updates purchase status to refunded
 */
async function handleRefundCreated(databases, payload, log, error) {
  const refund = payload.refund?.entity;
  if (!refund) {
    error("No refund entity in payload");
    return;
  }

  const { id: refundId, payment_id: paymentId } = refund;

  log(`Processing refund.created: ${refundId} for payment ${paymentId}`);

  // Find purchase by payment ID
  const purchases = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_PURCHASES_TABLE_ID,
    [Query.equal("razorpayPaymentId", paymentId)]
  );

  if (purchases.total === 0) {
    log(`No purchase found for payment: ${paymentId}`);
    return;
  }

  const purchase = purchases.documents[0];

  // Update status to refunded
  await databases.updateDocument(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_PURCHASES_TABLE_ID,
    purchase.$id,
    {
      paymentStatus: "refunded",
      webhookVerified: true,
      webhookReceivedAt: new Date().toISOString(),
    }
  );

  log(`Updated purchase status to refunded: ${purchase.$id}`);
}

/**
 * Create enrollment if it doesn't already exist
 */
async function createEnrollmentIfNotExists(
  databases,
  studentId,
  courseId,
  log
) {
  if (!process.env.APPWRITE_ENROLLMENTS_TABLE_ID) {
    log(
      "APPWRITE_ENROLLMENTS_TABLE_ID not configured, skipping enrollment creation"
    );
    return;
  }

  // Check if enrollment exists
  const enrollments = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_ENROLLMENTS_TABLE_ID,
    [Query.equal("studentId", studentId), Query.equal("courseId", courseId)]
  );

  if (enrollments.total > 0) {
    log(
      `Enrollment already exists for student ${studentId} in course ${courseId}`
    );
    return;
  }

  // Create enrollment
  const enrollmentData = {
    studentId,
    courseId,
    status: "active",
    progress: 0,
    enrolledAt: new Date().toISOString(),
    completedAt: null,
  };

  const enrollment = await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_ENROLLMENTS_TABLE_ID,
    ID.unique(),
    enrollmentData,
    [
      Permission.read(Role.user(studentId)),
      Permission.update(Role.user(studentId)),
    ]
  );

  log(`Created enrollment: ${enrollment.$id}`);
}
