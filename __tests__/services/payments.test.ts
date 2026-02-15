import { describe, it, expect, vi } from "vitest";

vi.mock("react-native-razorpay", () => ({
  default: { open: vi.fn() },
}));
vi.mock("appwrite", () => {
  function Functions() {
    return { createExecution: vi.fn() };
  }
  return {
    ExecutionMethod: { POST: "POST" },
    Functions,
    ID: { unique: () => "test-id" },
  };
});
vi.mock("../../lib/appwrite", () => ({
  APPWRITE_CONFIG: {
    databaseId: "test-db",
    tables: { purchases: "test-purchases", enrollments: "test-enrollments" },
  },
  client: {},
  databases: {
    listRows: vi.fn(),
    createRow: vi.fn(),
    updateRow: vi.fn(),
    getRow: vi.fn(),
  },
}));
vi.mock("../../lib/razorpay", () => ({
  CREATE_ORDER_FUNCTION_ID: "test-func",
  DEFAULT_CURRENCY: "INR",
  RAZORPAY_KEY_ID: "rzp_test",
  RAZORPAY_MERCHANT_NAME: "Test",
  RAZORPAY_THEME_COLOR: "#000",
  isRazorpayConfigured: () => true,
}));
vi.mock("../../lib/services/enrollments", () => ({
  enrollStudent: vi.fn(),
  isStudentEnrolled: vi.fn().mockResolvedValue(false),
}));
vi.mock("../../lib/services/helpers", () => ({
  nowISO: () => "2026-01-01T00:00:00.000Z",
}));
vi.mock("../../lib/services/purchases", () => ({
  getPurchase: vi.fn().mockResolvedValue(null),
}));

import {
  verifySignatureFormat,
  isPaymentCancelled,
  courseRequiresPayment,
} from "../../lib/services/payments";

describe("verifySignatureFormat", () => {
  it("returns false for empty orderId", () => {
    expect(verifySignatureFormat("", "pay_123", "sig")).toBe(false);
  });

  it("returns false for empty paymentId", () => {
    expect(verifySignatureFormat("order_123", "", "sig")).toBe(false);
  });

  it("returns false for empty signature", () => {
    expect(verifySignatureFormat("order_123", "pay_123", "")).toBe(false);
  });

  it("returns false for orderId not starting with 'order_'", () => {
    expect(verifySignatureFormat("ord_123", "pay_123", "sig")).toBe(false);
  });

  it("returns false for paymentId not starting with 'pay_'", () => {
    expect(verifySignatureFormat("order_123", "payment_123", "sig")).toBe(
      false,
    );
  });

  it("returns true for valid format", () => {
    expect(
      verifySignatureFormat("order_abc123", "pay_xyz789", "valid_sig_here"),
    ).toBe(true);
  });
});

describe("isPaymentCancelled", () => {
  it("returns true when error has code 0", () => {
    expect(isPaymentCancelled({ code: 0 })).toBe(true);
  });

  it("returns false when error has code 2", () => {
    expect(isPaymentCancelled({ code: 2 })).toBe(false);
  });

  it("returns false for generic errors without code", () => {
    expect(isPaymentCancelled(new Error("something"))).toBe(false);
  });

  it("returns false for null", () => {
    expect(isPaymentCancelled(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isPaymentCancelled(undefined)).toBe(false);
  });
});

describe("courseRequiresPayment", () => {
  it("returns true when price > 0", () => {
    expect(courseRequiresPayment({ price: 499 } as any)).toBe(true);
  });

  it("returns false when price is 0", () => {
    expect(courseRequiresPayment({ price: 0 } as any)).toBe(false);
  });

  it("returns false when price is negative", () => {
    expect(courseRequiresPayment({ price: -10 } as any)).toBe(false);
  });
});
