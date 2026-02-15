import RazorpayCheckout from "react-native-razorpay";

import { supabase } from "../supabase";
import {
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
  CourseRow,
  CreateOrderInput,
  CreateOrderResponse,
  PaymentResult,
  PurchaseCourseOptions,
  PurchaseRow,
} from "./types";

function logPaymentEvent(event: string, data?: Record<string, unknown>): void {
  if (__DEV__) {
    console.log(`[Payment] ${event}`, data || "");
  }
}

export function verifySignatureFormat(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!orderId || !paymentId || !signature) return false;
  return (
    orderId.startsWith("order_") &&
    paymentId.startsWith("pay_") &&
    signature.length > 0
  );
}

export async function createPaymentOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResponse> {
  logPaymentEvent("Creating order", { course_id: input.course_id });

  try {
    const { data, error } = await supabase.functions.invoke("create-order", {
      body: {
        course_id: input.course_id,
        student_id: input.student_id,
        student_email: input.student_email,
        student_name: input.student_name,
      },
    });

    if (error) {
      throw new Error(error.message || "Failed to create payment order");
    }

    const response = data as CreateOrderResponse;

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

export async function handlePaymentSuccess(
  response: RazorpaySuccessResponse,
  course_id: string,
  student_id: string,
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): Promise<PurchaseRow> {
  logPaymentEvent("Processing payment success", {
    paymentId: response.razorpay_payment_id,
    orderId: response.razorpay_order_id,
  });

  const isValidFormat = verifySignatureFormat(
    response.razorpay_order_id,
    response.razorpay_payment_id,
    response.razorpay_signature,
  );

  if (!isValidFormat) {
    logPaymentEvent("Invalid signature format");
    throw new Error("Invalid payment response format");
  }

  const existingPurchase = await getPurchase(student_id, course_id);
  if (existingPurchase && existingPurchase.payment_status === "completed") {
    logPaymentEvent("Purchase already exists", {
      purchaseId: existingPurchase.id,
    });
    return existingPurchase;
  }

  const now = nowISO();

  if (existingPurchase) {
    logPaymentEvent("Updating existing purchase", {
      purchaseId: existingPurchase.id,
    });

    const { data, error } = await supabase
      .from("purchases")
      .update({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        payment_status: "completed",
      })
      .eq("id", existingPurchase.id)
      .select()
      .single();

    if (error) throw error;
    await autoEnrollAfterPurchase(student_id, course_id);
    return data as PurchaseRow;
  }

  const { data, error } = await supabase
    .from("purchases")
    .insert({
      student_id,
      course_id,
      amount,
      currency,
      purchased_at: now,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
      payment_status: "completed",
      payment_method: null,
      webhook_verified: false,
      webhook_received_at: null,
    })
    .select()
    .single();

  if (error) throw error;
  logPaymentEvent("Purchase created", { purchaseId: data.id });

  await autoEnrollAfterPurchase(student_id, course_id);
  return data as PurchaseRow;
}

async function autoEnrollAfterPurchase(
  student_id: string,
  course_id: string,
): Promise<void> {
  try {
    const alreadyEnrolled = await isStudentEnrolled(student_id, course_id);
    if (!alreadyEnrolled) {
      await enrollStudent({ student_id, course_id });
      logPaymentEvent("Auto-enrolled student", { student_id, course_id });
    }
  } catch (error) {
    logPaymentEvent("Auto-enrollment failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export function handlePaymentFailure(
  error: RazorpayErrorResponse | Error,
): string {
  let errorMessage: string;

  if ("code" in error) {
    const razorpayError = error as RazorpayErrorResponse;
    logPaymentEvent("Payment failed", {
      code: razorpayError.code,
      description: razorpayError.description,
      reason: razorpayError.reason,
    });

    switch (razorpayError.code) {
      case 0:
        errorMessage = "Payment was cancelled";
        break;
      case 2:
        errorMessage =
          razorpayError.description || "Payment failed. Please try again.";
        break;
      default:
        errorMessage =
          razorpayError.description || "Payment failed. Please try again.";
    }
  } else {
    errorMessage = error.message || "Payment failed. Please try again.";
    logPaymentEvent("Payment error", { error: errorMessage });
  }

  return errorMessage;
}

export function isPaymentCancelled(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "code" in error) {
    return (error as RazorpayErrorResponse).code === 0;
  }
  return false;
}

export async function purchaseCourse(
  options: PurchaseCourseOptions,
): Promise<PaymentResult> {
  const {
    course_id,
    student,
    onPaymentStart,
    onPaymentSuccess,
    onPaymentFailure,
    onPaymentCancel,
  } = options;

  logPaymentEvent("Starting purchase flow", {
    course_id,
    student_id: student.id,
  });

  const existingPurchase = await getPurchase(student.id, course_id);
  if (existingPurchase && existingPurchase.payment_status === "completed") {
    logPaymentEvent("Already purchased");
    return { success: true, purchase: existingPurchase };
  }

  try {
    onPaymentStart?.();

    const orderResponse = await createPaymentOrder({
      course_id,
      student_id: student.id,
      student_email: student.email,
      student_name: `${student.first_name} ${student.last_name}`.trim(),
    });

    if (
      !orderResponse.success ||
      !orderResponse.order ||
      !orderResponse.course
    ) {
      throw new Error(orderResponse.error || "Failed to create order");
    }

    const checkoutOptions: RazorpayCheckoutOptions = {
      key: orderResponse.key || RAZORPAY_KEY_ID,
      amount: orderResponse.order.amount,
      currency: orderResponse.order.currency,
      name: RAZORPAY_MERCHANT_NAME,
      description: `Purchase: ${orderResponse.course.title}`,
      order_id: orderResponse.order.id,
      image: orderResponse.course.image_url,
      prefill: {
        email: orderResponse.prefill?.email || student.email,
        name:
          orderResponse.prefill?.name ||
          `${student.first_name} ${student.last_name}`.trim(),
      },
      theme: { color: RAZORPAY_THEME_COLOR },
      notes: { course_id, student_id: student.id },
    };

    const paymentResponse = await openRazorpayCheckout(checkoutOptions);

    const purchase = await handlePaymentSuccess(
      paymentResponse,
      course_id,
      student.id,
      orderResponse.course.price,
      orderResponse.order.currency,
    );

    onPaymentSuccess?.(purchase);
    return { success: true, purchase };
  } catch (error) {
    if (isPaymentCancelled(error)) {
      logPaymentEvent("Payment cancelled by user");
      onPaymentCancel?.();
      return { success: false, cancelled: true };
    }

    const errorMessage = handlePaymentFailure(
      error as RazorpayErrorResponse | Error,
    );
    onPaymentFailure?.(errorMessage);
    return { success: false, error: errorMessage };
  }
}

export function courseRequiresPayment(course: CourseRow): boolean {
  return course.price > 0;
}

export async function canAccessCourse(
  student_id: string,
  course_id: string,
  coursePrice: number,
): Promise<boolean> {
  if (coursePrice <= 0) return true;
  const purchase = await getPurchase(student_id, course_id);
  return purchase?.payment_status === "completed";
}
