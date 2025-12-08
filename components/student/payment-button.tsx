/**
 * Payment Button Component
 *
 * A reusable button component for initiating course purchases via Razorpay.
 * Handles the complete payment flow with loading states and feedback.
 */

import { useAppwrite } from "@/hooks/use-appwrite";
import {
  usePurchaseCourseWithAlerts,
  usePurchaseStatus,
} from "@/hooks/use-payments";
import type { PurchaseDocument, UserDocument } from "@/lib/services/types";
import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";

export interface PaymentButtonProps {
  /** Course ID to purchase */
  courseId: string;
  /** Course price in rupees */
  price: number;
  /** Optional callback when payment succeeds */
  onSuccess?: (purchase: PurchaseDocument) => void;
  /** Optional callback when payment is cancelled */
  onCancel?: () => void;
  /** Optional custom styles for the button container */
  style?: ViewStyle;
  /** Optional custom class name for NativeWind styling */
  className?: string;
  /** Show price in button text */
  showPrice?: boolean;
  /** Custom button text (overrides default) */
  buttonText?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Payment Button
 *
 * A self-contained button that handles the entire Razorpay payment flow.
 * It checks purchase status, displays appropriate UI, and triggers payments.
 *
 * @example
 * ```tsx
 * <PaymentButton
 *   courseId="course-123"
 *   price={999}
 *   onSuccess={(purchase) => console.log('Purchased!', purchase)}
 * />
 * ```
 */
export function PaymentButton({
  courseId,
  price,
  onSuccess,
  onCancel,
  style,
  className,
  showPrice = true,
  buttonText,
  size = "md",
}: PaymentButtonProps) {
  const { userProfile } = useAppwrite();
  const { purchaseWithAlerts, isPurchasing } = usePurchaseCourseWithAlerts();

  // Check current purchase status
  const { hasPurchased, isFree, canAccess, isLoading } = usePurchaseStatus(
    userProfile?.$id,
    courseId,
    price
  );

  const handlePurchase = async () => {
    if (!userProfile) {
      return;
    }

    await purchaseWithAlerts(courseId, userProfile as UserDocument, {
      onSuccess,
      onCancel,
    });
  };

  // Size-based styles
  const sizeStyles = {
    sm: "py-2 px-4",
    md: "py-3 px-6",
    lg: "py-4 px-8",
  };

  const textSizeStyles = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  // Loading state while checking purchase status
  if (isLoading) {
    return (
      <View
        className={`bg-gray-200 rounded-xl ${sizeStyles[size]} items-center justify-center ${className}`}
        style={style}
      >
        <ActivityIndicator color="#6b7280" size="small" />
      </View>
    );
  }

  // Already purchased - show enrolled state
  if (hasPurchased || canAccess) {
    return (
      <View
        className={`bg-green-50 border border-green-200 rounded-xl ${sizeStyles[size]} items-center ${className}`}
        style={style}
      >
        <Text
          className={`text-green-700 font-semibold ${textSizeStyles[size]}`}
        >
          {isFree ? "Free Access" : "Enrolled"}
        </Text>
      </View>
    );
  }

  // Determine button text
  const displayText =
    buttonText ||
    (showPrice
      ? `Purchase · ₹${price}`
      : isPurchasing
        ? "Processing..."
        : "Purchase Course");

  return (
    <TouchableOpacity
      onPress={handlePurchase}
      disabled={isPurchasing || !userProfile}
      className={`bg-primary-600 rounded-xl ${sizeStyles[size]} items-center ${
        isPurchasing ? "opacity-70" : ""
      } ${className}`}
      style={style}
      activeOpacity={0.8}
    >
      {isPurchasing ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator color="#fff" size="small" />
          <Text className={`text-white font-semibold ${textSizeStyles[size]}`}>
            Processing...
          </Text>
        </View>
      ) : (
        <Text className={`text-white font-semibold ${textSizeStyles[size]}`}>
          {displayText}
        </Text>
      )}
    </TouchableOpacity>
  );
}

/**
 * Compact Payment Button
 *
 * A smaller variant of the payment button for use in cards and lists.
 *
 * @example
 * ```tsx
 * <CompactPaymentButton courseId="course-123" price={999} />
 * ```
 */
export function CompactPaymentButton(
  props: Omit<PaymentButtonProps, "size" | "showPrice">
) {
  return <PaymentButton {...props} size="sm" showPrice={false} />;
}

export default PaymentButton;
