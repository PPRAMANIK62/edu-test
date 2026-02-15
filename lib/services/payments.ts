/**
 * Payment Service
 *
 * Handles Razorpay payment integration for course purchases.
 * This service coordinates between the client app, Appwrite Functions,
 * and Razorpay SDK to process payments.
 */

import { ExecutionMethod, Functions, ID } from "appwrite";
import RazorpayCheckout from "react-native-razorpay";

import { APPWRITE_CONFIG, client, databases } from "../appwrite";
import {
  CREATE_ORDER_FUNCTION_ID,
  DEFAULT_CURRENCY,
  RAZORPAY_KEY_ID,
  RAZORPAY_MERCHANT_NAME,
  RAZORPAY_THEME_COLOR,
  isRazorpayConfigured,
  type RazorpayCheckoutOptions,
  type RazorpayErrorResponse,
  type RazorpaySuccessResponse,
} from "../razorpay";
import { enrollStudent, isStudentEnrolled } from "./enrollments";
import { nowISO } from "./helpers";
import { getPurchase } from "./purchases";
import type {
  CourseDocument,
  CreateOrderInput,
  CreateOrderResponse,
  PaymentResult,
  PurchaseCourseOptions,
  PurchaseDocument,
} from "./types";

// ============================================================================
// Private Helpers
// ============================================================================

const functions = new Functions(client);

/**
 * Log payment event for debugging
 */
function logPaymentEvent(event: string, data?: Record<string, unknown>): void {
  if (__DEV__) {
    console.log(`[Payment] ${event}`, data || "");
  }
}

/**
 * Verify Razorpay signature on client side
 * Note: This is a basic verification. The webhook handler does the authoritative verification.
 *
 * @param orderId - Razorpay order ID
 * @param paymentId - Razorpay payment ID
 * @param signature - Razorpay signature to verify
 * @returns boolean indicating if signature format is valid
 */
export function verifySignatureFormat(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  // Basic format validation
  // The actual cryptographic verification happens server-side via webhook
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  // Check format: order_xxx, pay_xxx, and signature is base64-like
  const orderIdValid = orderId.startsWith("order_");
  const paymentIdValid = paymentId.startsWith("pay_");
  const signatureValid = signature.length > 0;

  return orderIdValid && paymentIdValid && signatureValid;
}

// ============================================================================
// Core Payment Functions
// ============================================================================

/**
 * Create a Razorpay order via Appwrite Function
 *
 * This calls the server-side create-order function which:
 * 1. Validates the course exists and is published
 * 2. Creates a Razorpay order with the correct amount
 * 3. Returns order details for the checkout modal
 *
 * @param input - Order creation input
 * @returns Order response from server
 */
export async function createPaymentOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResponse> {
  if (!CREATE_ORDER_FUNCTION_ID) {
    throw new Error(
      "Payment function not configured. Set EXPO_PUBLIC_CREATE_ORDER_FUNCTION_ID in your environment.",
    );
  }

  if (CREATE_ORDER_FUNCTION_ID === "your_create_order_function_id") {
    throw new Error(
      "Payment function ID is still placeholder. Deploy the create-order function and update EXPO_PUBLIC_CREATE_ORDER_FUNCTION_ID.",
    );
  }

  logPaymentEvent("Creating order", { courseId: input.courseId });

  try {
    const execution = await functions.createExecution(
      CREATE_ORDER_FUNCTION_ID,
      JSON.stringify({
        courseId: input.courseId,
        studentId: input.studentId,
        studentEmail: input.studentEmail,
        studentName: input.studentName,
      }),
      false, // async
      "/", // path
      ExecutionMethod.POST, // method
    );

    logPaymentEvent("Execution response", {
      status: execution.status,
      statusCode: execution.responseStatusCode,
      responseBody: execution.responseBody?.substring(0, 500),
    });

    // Check if execution was successful
    if (execution.status === "failed") {
      throw new Error(
        `Function execution failed: ${execution.errors || "Unknown error"}`,
      );
    }

    // Check for empty response
    if (!execution.responseBody || execution.responseBody.trim() === "") {
      throw new Error(
        "Function returned empty response. Check function logs in Appwrite console.",
      );
    }

    // Parse the response
    const response = JSON.parse(execution.responseBody) as CreateOrderResponse;

    if (!response.success) {
      logPaymentEvent("Order creation failed", { error: response.error });
      throw new Error(response.error || "Failed to create order");
    }

    logPaymentEvent("Order created", { orderId: response.order?.id });
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create payment order";
    logPaymentEvent("Order creation error", { error: message });
    throw new Error(message);
  }
}

/**
 * Open Razorpay checkout modal
 *
 * @param options - Checkout options
 * @returns Promise resolving to success response or rejecting with error
 */
export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions,
): Promise<RazorpaySuccessResponse> {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured");
  }

  logPaymentEvent("Opening checkout", {
    orderId: options.order_id,
    amount: options.amount,
  });

  try {
    const response = await RazorpayCheckout.open(options);
    logPaymentEvent("Checkout success", {
      paymentId: response.razorpay_payment_id,
    });
    return response as RazorpaySuccessResponse;
  } catch (error) {
    const razorpayError = error as RazorpayErrorResponse;
    logPaymentEvent("Checkout failed", {
      code: razorpayError.code,
      description: razorpayError.description,
    });
    throw error;
  }
}

/**
 * Handle successful payment callback
 *
 * Creates a purchase record with payment details.
 * Note: The webhook handler may also create/update this record as a fallback.
 *
 * @param response - Razorpay success response
 * @param courseId - Course being purchased
 * @param studentId - Student making the purchase
 * @param amount - Amount paid (in rupees)
 * @param currency - Currency code
 * @returns Created purchase document
 */
export async function handlePaymentSuccess(
  response: RazorpaySuccessResponse,
  courseId: string,
  studentId: string,
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): Promise<PurchaseDocument> {
  logPaymentEvent("Processing payment success", {
    paymentId: response.razorpay_payment_id,
    orderId: response.razorpay_order_id,
  });

  // Verify signature format (basic client-side check)
  const isValidFormat = verifySignatureFormat(
    response.razorpay_order_id,
    response.razorpay_payment_id,
    response.razorpay_signature,
  );

  if (!isValidFormat) {
    logPaymentEvent("Invalid signature format");
    throw new Error("Invalid payment response format");
  }

  // Check if purchase already exists (webhook might have created it)
  const existingPurchase = await getPurchase(studentId, courseId);
  if (existingPurchase && existingPurchase.paymentStatus === "completed") {
    logPaymentEvent("Purchase already exists", {
      purchaseId: existingPurchase.$id,
    });
    return existingPurchase;
  }

  const { databaseId, tables } = APPWRITE_CONFIG;
  const now = nowISO();

  // If purchase exists but isn't completed, update it
  if (existingPurchase) {
    logPaymentEvent("Updating existing purchase", {
      purchaseId: existingPurchase.$id,
    });

    const updated = await databases.updateRow<PurchaseDocument>({
      databaseId: databaseId!,
      tableId: tables.purchases!,
      rowId: existingPurchase.$id,
      data: {
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
        paymentStatus: "completed",
      },
    });

    // Auto-enroll the student after successful payment
    await autoEnrollAfterPurchase(studentId, courseId);

    return updated as PurchaseDocument;
  }

  // Create new purchase record with payment details
  const purchase = await databases.createRow<PurchaseDocument>({
    databaseId: databaseId!,
    tableId: tables.purchases!,
    rowId: ID.unique(),
    data: {
      studentId,
      courseId,
      amount,
      currency,
      purchasedAt: now,
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
      paymentStatus: "completed",
      paymentMethod: null,
      webhookVerified: false,
      webhookReceivedAt: null,
    },
  });

  logPaymentEvent("Purchase created", { purchaseId: purchase.$id });

  // Auto-enroll the student after successful payment
  await autoEnrollAfterPurchase(studentId, courseId);

  return purchase as PurchaseDocument;
}

/**
 * Auto-enroll student in course after successful purchase
 */
async function autoEnrollAfterPurchase(
  studentId: string,
  courseId: string,
): Promise<void> {
  try {
    const alreadyEnrolled = await isStudentEnrolled(studentId, courseId);
    if (!alreadyEnrolled) {
      await enrollStudent({ studentId, courseId });
      logPaymentEvent("Auto-enrolled student", { studentId, courseId });
    }
  } catch (error) {
    // Don't fail the purchase if enrollment fails
    logPaymentEvent("Auto-enrollment failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Handle payment failure
 *
 * Logs the failure and shows an error message to the user.
 *
 * @param error - Razorpay error response
 * @returns Error message string
 */
export function handlePaymentFailure(
  error: RazorpayErrorResponse | Error,
): string {
  let errorMessage: string;

  if ("code" in error) {
    // Razorpay error
    const razorpayError = error as RazorpayErrorResponse;
    logPaymentEvent("Payment failed", {
      code: razorpayError.code,
      description: razorpayError.description,
      reason: razorpayError.reason,
    });

    // Map common error codes to user-friendly messages
    switch (razorpayError.code) {
      case 0:
        // User cancelled
        errorMessage = "Payment was cancelled";
        break;
      case 2:
        // Payment failed
        errorMessage =
          razorpayError.description || "Payment failed. Please try again.";
        break;
      default:
        errorMessage =
          razorpayError.description || "Payment failed. Please try again.";
    }
  } else {
    // Generic error
    errorMessage = error.message || "Payment failed. Please try again.";
    logPaymentEvent("Payment error", { error: errorMessage });
  }

  return errorMessage;
}

/**
 * Check if payment was cancelled by user
 */
export function isPaymentCancelled(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "code" in error) {
    return (error as RazorpayErrorResponse).code === 0;
  }
  return false;
}

// ============================================================================
// High-Level Purchase Flow
// ============================================================================

/**
 * Complete purchase flow for a course
 *
 * This is the main entry point for purchasing a course. It:
 * 1. Checks for existing purchase
 * 2. Creates a Razorpay order
 * 3. Opens the checkout modal
 * 4. Handles success/failure
 * 5. Creates purchase and enrollment records
 *
 * @param options - Purchase options
 * @returns Payment result
 */
export async function purchaseCourse(
  options: PurchaseCourseOptions,
): Promise<PaymentResult> {
  const {
    courseId,
    student,
    onPaymentStart,
    onPaymentSuccess,
    onPaymentFailure,
    onPaymentCancel,
  } = options;

  logPaymentEvent("Starting purchase flow", {
    courseId,
    studentId: student.$id,
  });

  // Check for existing completed purchase
  const existingPurchase = await getPurchase(student.$id, courseId);
  if (existingPurchase && existingPurchase.paymentStatus === "completed") {
    logPaymentEvent("Already purchased");
    return {
      success: true,
      purchase: existingPurchase,
    };
  }

  try {
    onPaymentStart?.();

    // Step 1: Create order via Appwrite Function
    const orderResponse = await createPaymentOrder({
      courseId,
      studentId: student.$id,
      studentEmail: student.email,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
    });

    if (
      !orderResponse.success ||
      !orderResponse.order ||
      !orderResponse.course
    ) {
      throw new Error(orderResponse.error || "Failed to create order");
    }

    // Step 2: Build checkout options
    const checkoutOptions: RazorpayCheckoutOptions = {
      key: orderResponse.key || RAZORPAY_KEY_ID,
      amount: orderResponse.order.amount,
      currency: orderResponse.order.currency,
      name: RAZORPAY_MERCHANT_NAME,
      description: `Purchase: ${orderResponse.course.title}`,
      order_id: orderResponse.order.id,
      image: orderResponse.course.imageUrl,
      prefill: {
        email: orderResponse.prefill?.email || student.email,
        name:
          orderResponse.prefill?.name ||
          `${student.firstName} ${student.lastName}`.trim(),
      },
      theme: {
        color: RAZORPAY_THEME_COLOR,
      },
      notes: {
        courseId,
        studentId: student.$id,
      },
    };

    // Step 3: Open Razorpay checkout
    const paymentResponse = await openRazorpayCheckout(checkoutOptions);

    // Step 4: Handle successful payment
    const purchase = await handlePaymentSuccess(
      paymentResponse,
      courseId,
      student.$id,
      orderResponse.course.price,
      orderResponse.order.currency,
    );

    onPaymentSuccess?.(purchase);

    return {
      success: true,
      purchase,
    };
  } catch (error) {
    // Check if cancelled
    if (isPaymentCancelled(error)) {
      logPaymentEvent("Payment cancelled by user");
      onPaymentCancel?.();
      return {
        success: false,
        cancelled: true,
      };
    }

    // Handle failure
    const errorMessage = handlePaymentFailure(
      error as RazorpayErrorResponse | Error,
    );
    onPaymentFailure?.(errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if a course requires payment
 */
export function courseRequiresPayment(course: CourseDocument): boolean {
  return course.price > 0;
}

/**
 * Check if student can access course (purchased or free)
 */
export async function canAccessCourse(
  studentId: string,
  courseId: string,
  coursePrice: number,
): Promise<boolean> {
  // Free courses are accessible to all
  if (coursePrice <= 0) {
    return true;
  }

  // Check for completed purchase
  const purchase = await getPurchase(studentId, courseId);
  return purchase?.paymentStatus === "completed";
}
