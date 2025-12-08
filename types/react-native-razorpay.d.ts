/**
 * Type declarations for react-native-razorpay
 *
 * Since react-native-razorpay doesn't ship with TypeScript declarations,
 * we define them here based on the library's API.
 */

declare module "react-native-razorpay" {
  import type {
    RazorpayCheckoutOptions,
    RazorpaySuccessResponse,
  } from "@/lib/razorpay";

  /**
   * Opens the Razorpay checkout modal
   * @param options - Checkout options
   * @returns Promise that resolves with payment details on success, or rejects with error
   */
  function open(
    options: RazorpayCheckoutOptions
  ): Promise<RazorpaySuccessResponse>;

  export default {
    open,
  };
}
