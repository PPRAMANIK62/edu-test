/**
 * Razorpay Configuration and Types
 *
 * This module provides Razorpay configuration constants and type definitions
 * for the payment integration. The actual payment logic is in lib/services/payments.ts
 */

// ============================================================================
// Configuration
// ============================================================================

/**
 * Razorpay public key for client-side SDK
 * This key is safe to expose in the client as it can only initiate payments
 */
export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? "";

/**
 * Appwrite Function ID for creating Razorpay orders
 * This function creates orders server-side to keep the API secret secure
 */
export const CREATE_ORDER_FUNCTION_ID =
  process.env.EXPO_PUBLIC_CREATE_ORDER_FUNCTION_ID ?? "";

/**
 * App name displayed in Razorpay checkout
 */
export const RAZORPAY_MERCHANT_NAME = "EduTest";

/**
 * Default currency for payments (Indian Rupee)
 */
export const DEFAULT_CURRENCY = "INR";

/**
 * Theme color for Razorpay checkout modal
 */
export const RAZORPAY_THEME_COLOR = "#2563eb"; // primary-600

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Options for opening Razorpay checkout modal
 * @see https://razorpay.com/docs/payments/payment-gateway/react-native-integration/standard/
 */
export interface RazorpayCheckoutOptions {
  /** Description shown in checkout (e.g., "Purchase: Course Title") */
  description: string;
  /** Course/product image URL */
  image?: string;
  /** Currency code (default: INR) */
  currency: string;
  /** Razorpay public key */
  key: string;
  /** Amount in smallest currency unit (paise for INR) */
  amount: number;
  /** Merchant/app name */
  name: string;
  /** Razorpay order ID (from create-order function) */
  order_id: string;
  /** Customer prefill information */
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  /** Notes to attach to the payment */
  notes?: Record<string, string>;
  /** Theme customization */
  theme?: {
    color?: string;
  };
}

/**
 * Response from successful Razorpay payment
 */
export interface RazorpaySuccessResponse {
  /** Razorpay payment ID (format: pay_xxx) */
  razorpay_payment_id: string;
  /** Razorpay order ID (format: order_xxx) */
  razorpay_order_id: string;
  /** HMAC SHA256 signature for verification */
  razorpay_signature: string;
}

/**
 * Error from failed Razorpay payment
 */
export interface RazorpayErrorResponse {
  code: number;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id?: string;
    payment_id?: string;
  };
}

/**
 * Razorpay order object returned from create-order function
 */
export interface RazorpayOrder {
  /** Order ID (format: order_xxx) */
  id: string;
  /** Order entity type */
  entity: "order";
  /** Amount in smallest currency unit */
  amount: number;
  /** Amount paid so far */
  amount_paid: number;
  /** Amount due */
  amount_due: number;
  /** Currency code */
  currency: string;
  /** Receipt ID (usually courseId or internal reference) */
  receipt: string;
  /** Order status */
  status: "created" | "attempted" | "paid";
  /** Additional notes */
  notes: Record<string, string>;
  /** Unix timestamp of creation */
  created_at: number;
}

/**
 * Webhook event types we handle
 */
export type RazorpayWebhookEventType =
  | "payment.captured"
  | "payment.failed"
  | "refund.created"
  | "order.paid";

/**
 * Base webhook payload structure
 */
export interface RazorpayWebhookPayload {
  /** Webhook entity type */
  entity: "event";
  /** Account ID */
  account_id: string;
  /** Event type */
  event: RazorpayWebhookEventType;
  /** Array of entities related to this event */
  contains: string[];
  /** Event payload */
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
    refund?: {
      entity: RazorpayRefundEntity;
    };
    order?: {
      entity: RazorpayOrder;
    };
  };
  /** Unix timestamp of event creation */
  created_at: number;
}

/**
 * Payment entity from webhook
 */
export interface RazorpayPaymentEntity {
  /** Payment ID (format: pay_xxx) */
  id: string;
  /** Entity type */
  entity: "payment";
  /** Amount in smallest currency unit */
  amount: number;
  /** Currency code */
  currency: string;
  /** Payment status */
  status: "captured" | "failed" | "authorized" | "refunded";
  /** Order ID this payment is for */
  order_id: string;
  /** Payment method used */
  method: "upi" | "card" | "wallet" | "netbanking" | "emi" | "bank_transfer";
  /** Description */
  description: string;
  /** Customer email */
  email: string;
  /** Customer contact */
  contact: string;
  /** Notes attached to payment */
  notes: Record<string, string>;
  /** Error details if failed */
  error_code?: string;
  error_description?: string;
  error_reason?: string;
  /** Unix timestamp of creation */
  created_at: number;
}

/**
 * Refund entity from webhook
 */
export interface RazorpayRefundEntity {
  /** Refund ID (format: rfnd_xxx) */
  id: string;
  /** Entity type */
  entity: "refund";
  /** Amount refunded */
  amount: number;
  /** Currency */
  currency: string;
  /** Payment ID this refund is for */
  payment_id: string;
  /** Refund status */
  status: "processed" | "pending" | "failed";
  /** Notes */
  notes: Record<string, string>;
  /** Unix timestamp */
  created_at: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert rupees to paise (Razorpay expects amounts in smallest currency unit)
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Format amount for display (e.g., "₹1,299")
 */
export function formatCurrency(
  amount: number,
  currency: string = "INR"
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Check if Razorpay is configured (key is set)
 */
export function isRazorpayConfigured(): boolean {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_ID !== "");
}
