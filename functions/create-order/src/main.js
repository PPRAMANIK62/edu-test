/**
 * Create Order - Appwrite Function
 *
 * Creates a Razorpay order for course purchases.
 * This function runs server-side to keep the API secret secure.
 *
 * Environment Variables Required:
 * - RAZORPAY_KEY_ID: Razorpay API key ID
 * - RAZORPAY_KEY_SECRET: Razorpay API key secret
 * - APPWRITE_ENDPOINT: Appwrite endpoint URL
 * - APPWRITE_PROJECT_ID: Appwrite project ID
 * - APPWRITE_API_KEY: Appwrite API key with database read permissions
 * - APPWRITE_DATABASE_ID: Database ID
 * - APPWRITE_COURSES_TABLE_ID: Courses table ID
 * - APPWRITE_PURCHASES_TABLE_ID: Purchases table ID
 *
 * Request Body:
 * {
 *   "courseId": "string",
 *   "studentId": "string",
 *   "studentEmail": "string",
 *   "studentName": "string"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "order": {
 *     "id": "order_xxx",
 *     "amount": 129900,
 *     "currency": "INR",
 *     "receipt": "course_xxx"
 *   },
 *   "course": {
 *     "id": "xxx",
 *     "title": "Course Title",
 *     "imageUrl": "https://..."
 *   },
 *   "key": "rzp_xxx"
 * }
 */

import { Client, Databases, Query } from "node-appwrite";
import Razorpay from "razorpay";

/**
 * Main function handler
 * @param {Object} context - Appwrite function context
 * @param {Object} context.req - Request object
 * @param {Object} context.res - Response object
 * @param {Function} context.log - Log function
 * @param {Function} context.error - Error log function
 */
export default async ({ req, res, log, error }) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.json(
      {
        success: false,
        error: "Method not allowed",
      },
      405,
    );
  }

  // Parse request body
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    error("Failed to parse request body:", e.message);
    return res.json(
      {
        success: false,
        error: "Invalid request body",
      },
      400,
    );
  }

  const { courseId, studentId, studentEmail, studentName } = body;

  // Validate required fields
  if (!courseId || !studentId) {
    return res.json(
      {
        success: false,
        error: "Missing required fields: courseId and studentId are required",
      },
      400,
    );
  }

  // Validate environment variables
  const requiredEnvVars = [
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "APPWRITE_ENDPOINT",
    "APPWRITE_PROJECT_ID",
    "APPWRITE_API_KEY",
    "APPWRITE_DATABASE_ID",
    "APPWRITE_COURSES_TABLE_ID",
    "APPWRITE_PURCHASES_TABLE_ID",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      error(`Missing environment variable: ${envVar}`);
      return res.json(
        {
          success: false,
          error: "Server configuration error",
        },
        500,
      );
    }
  }

  try {
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // Fetch course to validate it exists and get the price
    log(`Fetching course: ${courseId}`);
    let course;
    try {
      course = await databases.getDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_COURSES_TABLE_ID,
        courseId,
      );
    } catch (e) {
      error(`Course not found: ${courseId}`, e.message);
      return res.json(
        {
          success: false,
          error: "Course not found",
        },
        404,
      );
    }

    // Validate course is published
    if (!course.isPublished) {
      return res.json(
        {
          success: false,
          error: "Course is not available for purchase",
        },
        400,
      );
    }

    // Validate course has a price (not free)
    if (!course.price || course.price <= 0) {
      return res.json(
        {
          success: false,
          error: "This course is free. No payment required.",
        },
        400,
      );
    }

    // Check for existing completed purchase (idempotency)
    const existingPurchases = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_PURCHASES_TABLE_ID,
      [
        Query.equal("studentId", studentId),
        Query.equal("courseId", courseId),
        Query.equal("paymentStatus", "completed"),
        Query.limit(1),
      ],
    );

    if (existingPurchases.total > 0) {
      log(`Student ${studentId} already purchased course ${courseId}`);
      return res.json(
        {
          success: false,
          error: "You have already purchased this course",
          alreadyPurchased: true,
        },
        409,
      );
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order
    // Amount must be in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(course.price * 100);

    // Receipt must be max 40 chars - use short format
    const receipt = `crs_${courseId.slice(-8)}_${Date.now().toString(36)}`;

    const orderOptions = {
      amount: amountInPaise,
      currency: course.currency || "INR",
      receipt,
      notes: {
        courseId: courseId,
        studentId: studentId,
        courseTitle: course.title,
      },
    };

    log(`Creating Razorpay order: ${JSON.stringify(orderOptions)}`);

    let order;
    try {
      order = await razorpay.orders.create(orderOptions);
    } catch (razorpayError) {
      error("Razorpay API error:", JSON.stringify(razorpayError));
      return res.json(
        {
          success: false,
          error: `Razorpay error: ${razorpayError?.error?.description || razorpayError?.message || "Failed to create order"}`,
        },
        500,
      );
    }

    log(`Order created successfully: ${order.id}`);

    // Return order details to client
    return res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      course: {
        id: course.$id,
        title: course.title,
        imageUrl: course.imageUrl,
        price: course.price,
      },
      key: process.env.RAZORPAY_KEY_ID,
      prefill: {
        email: studentEmail || "",
        name: studentName || "",
      },
    });
  } catch (e) {
    error("Error creating order:", JSON.stringify(e), e?.message, e?.stack);
    return res.json(
      {
        success: false,
        error:
          e?.message || "Failed to create payment order. Please try again.",
      },
      500,
    );
  }
};
