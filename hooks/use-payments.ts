/**
 * Payment Hooks
 *
 * TanStack Query hooks for payment operations.
 * Provides mutations for course purchases with optimistic updates.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

import {
  STALE_TIMES,
  invalidateAfterEnrollment,
  invalidateAfterPurchase,
  queryKeys,
} from "@/lib/query-keys";
import type { QueryOptions } from "@/lib/services/helpers";
import {
  canAccessCourse,
  createPaymentOrder,
  purchaseCourse,
} from "@/lib/services/payments";
import {
  getPurchase,
  getPurchasesByStudent,
  hasStudentPurchased,
} from "@/lib/services/purchases";
import type {
  CreateOrderInput,
  PaymentResult,
  ProfileRow,
  PurchaseCourseOptions,
  PurchaseRow,
} from "@/lib/services/types";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch purchases for a student
 *
 * @param studentId - The student's user ID
 * @param options - Query options for pagination
 * @returns TanStack Query result with purchases
 *
 * @example
 * ```tsx
 * const { data } = usePurchasesByStudent('student-123');
 * ```
 */
export function usePurchasesByStudent(
  studentId: string | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: queryKeys.purchases.byStudent(studentId!),
    queryFn: () => getPurchasesByStudent(studentId!, options),
    enabled: !!studentId,
    staleTime: STALE_TIMES.STATIC,
  });
}

/**
 * Check if a student has purchased a course
 *
 * @param studentId - The student's user ID
 * @param courseId - The course ID
 * @returns TanStack Query result with boolean
 *
 * @example
 * ```tsx
 * const { data: hasPurchased } = useHasStudentPurchased('student-123', 'course-456');
 * ```
 */
export function useHasStudentPurchased(
  studentId: string | undefined,
  courseId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.purchases.check(studentId!, courseId!),
    queryFn: () => hasStudentPurchased(studentId!, courseId!),
    enabled: !!studentId && !!courseId,
    staleTime: STALE_TIMES.STATIC,
  });
}

/**
 * Get purchase for a specific student-course pair
 *
 * @param studentId - The student's user ID
 * @param courseId - The course ID
 * @returns TanStack Query result with purchase or null
 *
 * @example
 * ```tsx
 * const { data: purchase } = useStudentCoursePurchase('student-123', 'course-456');
 * ```
 */
export function useStudentCoursePurchase(
  studentId: string | undefined,
  courseId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.purchases.purchase(studentId!, courseId!),
    queryFn: () => getPurchase(studentId!, courseId!),
    enabled: !!studentId && !!courseId,
    staleTime: STALE_TIMES.STATIC,
  });
}

/**
 * Check if student can access a course (free or purchased)
 *
 * @param studentId - The student's user ID
 * @param courseId - The course ID
 * @param coursePrice - The course price
 * @returns TanStack Query result with boolean
 *
 * @example
 * ```tsx
 * const { data: canAccess } = useCanAccessCourse('student-123', 'course-456', 999);
 * ```
 */
export function useCanAccessCourse(
  studentId: string | undefined,
  courseId: string | undefined,
  coursePrice: number | undefined,
) {
  return useQuery({
    queryKey: [...queryKeys.purchases.check(studentId!, courseId!), "access"],
    queryFn: () => canAccessCourse(studentId!, courseId!, coursePrice!),
    enabled: !!studentId && !!courseId && coursePrice !== undefined,
    staleTime: STALE_TIMES.STATIC,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a Razorpay order
 *
 * Use this when you need to create an order separately from the purchase flow,
 * such as for manual checkout handling.
 *
 * @returns Mutation object for creating orders
 *
 * @example
 * ```tsx
 * const { mutateAsync: createOrder, isPending } = useCreateOrder();
 *
 * const handleCreateOrder = async () => {
 *   const result = await createOrder({
 *     courseId: 'course-123',
 *     studentId: 'student-456',
 *   });
 * };
 * ```
 */
export function useCreateOrder() {
  return useMutation({
    mutationFn: (input: CreateOrderInput) => createPaymentOrder(input),
    onError: (error) => {
      console.error("[useCreateOrder] Error:", error);
    },
  });
}

/**
 * Purchase a course (complete flow)
 *
 * This is the main hook for purchasing courses. It handles the entire flow:
 * 1. Creates a Razorpay order
 * 2. Opens the checkout modal
 * 3. Processes the payment
 * 4. Creates purchase and enrollment records
 * 5. Invalidates relevant queries
 *
 * @returns Mutation object for purchasing courses
 *
 * @example
 * ```tsx
 * const { mutateAsync: purchase, isPending } = usePurchaseCourse();
 *
 * const handlePurchase = async () => {
 *   const result = await purchase({
 *     courseId: 'course-123',
 *     student: currentUser,
 *     onPaymentSuccess: (purchase) => {
 *       console.log('Payment successful!', purchase);
 *     },
 *     onPaymentFailure: (error) => {
 *       Alert.alert('Payment Failed', error);
 *     },
 *   });
 * };
 * ```
 */
export function usePurchaseCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: PurchaseCourseOptions) => purchaseCourse(options),
    onMutate: async (options) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.purchases.check(
          options.student.id,
          options.course_id,
        ),
      });

      const previousPurchased = queryClient.getQueryData(
        queryKeys.purchases.check(options.student.id, options.course_id),
      );

      return { previousPurchased };
    },
    onSuccess: (result, options) => {
      if (result.success && result.purchase) {
        invalidateAfterPurchase(
          queryClient,
          options.student.id,
          options.course_id,
        );

        invalidateAfterEnrollment(
          queryClient,
          options.student.id,
          options.course_id,
        );

        queryClient.setQueryData(
          queryKeys.purchases.check(options.student.id, options.course_id),
          true,
        );

        queryClient.setQueryData<PurchaseRow>(
          queryKeys.purchases.purchase(options.student.id, options.course_id),
          result.purchase,
        );
      }
    },
    onError: (error, options, context) => {
      if (context?.previousPurchased !== undefined) {
        queryClient.setQueryData(
          queryKeys.purchases.check(options.student.id, options.course_id),
          context.previousPurchased,
        );
      }

      console.error("[usePurchaseCourse] Error:", error);
    },
    onSettled: (_, __, options) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchases.check(
          options.student.id,
          options.course_id,
        ),
      });
    },
  });
}

/**
 * Purchase a course with built-in alerts
 *
 * A convenience hook that wraps usePurchaseCourse with default alert handlers.
 *
 * @returns Object with purchase function and loading state
 *
 * @example
 * ```tsx
 * const { purchaseWithAlerts, isPurchasing } = usePurchaseCourseWithAlerts();
 *
 * <Button
 *   onPress={() => purchaseWithAlerts(courseId, student)}
 *   disabled={isPurchasing}
 * >
 *   {isPurchasing ? 'Processing...' : 'Buy Now'}
 * </Button>
 * ```
 */
export function usePurchaseCourseWithAlerts() {
  const mutation = usePurchaseCourse();

  const purchaseWithAlerts = async (
    course_id: string,
    student: ProfileRow,
    options?: {
      onSuccess?: (purchase: PurchaseRow) => void;
      onCancel?: () => void;
    },
  ): Promise<PaymentResult> => {
    const result = await mutation.mutateAsync({
      course_id,
      student,
      onPaymentSuccess: (purchase) => {
        Alert.alert(
          "Payment Successful! 🎉",
          "You now have access to this course.",
          [
            {
              text: "OK",
              onPress: () => options?.onSuccess?.(purchase),
            },
          ],
        );
      },
      onPaymentFailure: (error) => {
        Alert.alert("Payment Failed", error, [{ text: "OK" }]);
      },
      onPaymentCancel: () => {
        options?.onCancel?.();
      },
    });

    return result;
  };

  return {
    purchaseWithAlerts,
    isPurchasing: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Get purchase status for UI display
 *
 * Returns a convenient object with purchase state for rendering purchase buttons.
 *
 * @param studentId - The student's user ID
 * @param courseId - The course ID
 * @param coursePrice - The course price
 * @returns Object with hasPurchased, isFree, canAccess, and isLoading
 *
 * @example
 * ```tsx
 * const { hasPurchased, isFree, canAccess, isLoading } = usePurchaseStatus(
 *   student.id,
 *   course.id,
 *   course.price
 * );
 *
 * if (isLoading) return <Spinner />;
 * if (canAccess) return <Text>You have access!</Text>;
 * return <PurchaseButton />;
 * ```
 */
export function usePurchaseStatus(
  studentId: string | undefined,
  courseId: string | undefined,
  coursePrice: number | undefined,
) {
  const purchaseQuery = useStudentCoursePurchase(studentId, courseId);

  const isFree = coursePrice !== undefined && coursePrice <= 0;
  const hasPurchased =
    purchaseQuery.data?.payment_status === "completed" || false;
  const canAccess = isFree || hasPurchased;

  return {
    purchase: purchaseQuery.data,
    hasPurchased,
    isFree,
    canAccess,
    isLoading: purchaseQuery.isLoading,
    error: purchaseQuery.error,
    refetch: purchaseQuery.refetch,
  };
}
