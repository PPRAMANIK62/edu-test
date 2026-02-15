import { describe, it, expect, vi, beforeEach } from "vitest";

function createMockContext(overrides: Record<string, any> = {}) {
  const resJson = vi.fn((body: any, status?: number) => ({ body, status }));
  return {
    req: {
      method: "POST",
      body: JSON.stringify({ courseId: "c1", studentId: "s1" }),
      headers: {},
      ...overrides,
    },
    res: { json: resJson },
    log: vi.fn(),
    error: vi.fn(),
  };
}

const mockGetDocument = vi.fn();
const mockListDocuments = vi.fn();
const mockCreateOrder = vi.fn();

vi.mock("node-appwrite", () => {
  class Client {
    setEndpoint() {
      return this;
    }
    setProject() {
      return this;
    }
    setKey() {
      return this;
    }
  }
  class Databases {
    getDocument = mockGetDocument;
    listDocuments = mockListDocuments;
  }
  return {
    Client,
    Databases,
    Query: {
      equal: vi.fn((field: string, value: any) => `${field}=${value}`),
      limit: vi.fn((n: number) => `limit=${n}`),
    },
  };
});

vi.mock("razorpay", () => {
  class Razorpay {
    orders = { create: mockCreateOrder };
  }
  return { default: Razorpay };
});

const REQUIRED_ENV = {
  RAZORPAY_KEY_ID: "rzp_test_key",
  RAZORPAY_KEY_SECRET: "rzp_test_secret",
  APPWRITE_ENDPOINT: "https://cloud.appwrite.io/v1",
  APPWRITE_PROJECT_ID: "proj_123",
  APPWRITE_API_KEY: "api_key_123",
  APPWRITE_DATABASE_ID: "db_123",
  APPWRITE_COURSES_TABLE_ID: "courses_123",
  APPWRITE_PURCHASES_TABLE_ID: "purchases_123",
};

import createOrder from "../../functions/create-order/src/main.js";

describe("create-order validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const [key, value] of Object.entries(REQUIRED_ENV)) {
      process.env[key] = value;
    }
  });

  it("rejects non-POST methods", async () => {
    const ctx = createMockContext({ method: "GET" });
    await createOrder(ctx as any);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Method not allowed" },
      405,
    );
  });

  it("rejects missing courseId", async () => {
    const ctx = createMockContext({
      body: JSON.stringify({ studentId: "s1" }),
    });
    await createOrder(ctx as any);
    expect(ctx.res.json).toHaveBeenCalledWith(
      {
        success: false,
        error: "Missing required fields: courseId and studentId are required",
      },
      400,
    );
  });

  it("rejects missing studentId", async () => {
    const ctx = createMockContext({
      body: JSON.stringify({ courseId: "c1" }),
    });
    await createOrder(ctx as any);
    expect(ctx.res.json).toHaveBeenCalledWith(
      {
        success: false,
        error: "Missing required fields: courseId and studentId are required",
      },
      400,
    );
  });

  it("rejects unpublished courses", async () => {
    mockGetDocument.mockResolvedValueOnce({
      $id: "c1",
      isPublished: false,
      price: 499,
      currency: "INR",
      title: "Test Course",
    });

    const ctx = createMockContext();
    await createOrder(ctx as any);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "Course is not available for purchase" },
      400,
    );
  });

  it("rejects free courses (price <= 0)", async () => {
    mockGetDocument.mockResolvedValueOnce({
      $id: "c1",
      isPublished: true,
      price: 0,
      currency: "INR",
      title: "Free Course",
    });

    const ctx = createMockContext();
    await createOrder(ctx as any);
    expect(ctx.res.json).toHaveBeenCalledWith(
      { success: false, error: "This course is free. No payment required." },
      400,
    );
  });

  it("returns 409 for already purchased course", async () => {
    mockGetDocument.mockResolvedValueOnce({
      $id: "c1",
      isPublished: true,
      price: 499,
      currency: "INR",
      title: "Test Course",
    });
    mockListDocuments.mockResolvedValueOnce({ total: 1, documents: [{}] });

    const ctx = createMockContext();
    await createOrder(ctx as any);
    expect(ctx.res.json).toHaveBeenCalledWith(
      {
        success: false,
        error: "You have already purchased this course",
        alreadyPurchased: true,
      },
      409,
    );
  });

  it("calculates amount in paise correctly", async () => {
    mockGetDocument.mockResolvedValueOnce({
      $id: "c1",
      isPublished: true,
      price: 1299,
      currency: "INR",
      title: "Premium Course",
      imageUrl: "https://example.com/img.jpg",
    });
    mockListDocuments.mockResolvedValueOnce({ total: 0, documents: [] });
    mockCreateOrder.mockResolvedValueOnce({
      id: "order_test123",
      amount: 129900,
      currency: "INR",
      receipt: "crs_test_abc",
    });

    const ctx = createMockContext({
      body: JSON.stringify({
        courseId: "c1",
        studentId: "s1",
        studentEmail: "s@test.com",
        studentName: "Test Student",
      }),
    });
    await createOrder(ctx as any);

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 129900,
        currency: "INR",
      }),
    );
  });

  it("generates valid receipt format", async () => {
    mockGetDocument.mockResolvedValueOnce({
      $id: "course_abcdef12",
      isPublished: true,
      price: 499,
      currency: "INR",
      title: "Test Course",
      imageUrl: "https://example.com/img.jpg",
    });
    mockListDocuments.mockResolvedValueOnce({ total: 0, documents: [] });
    mockCreateOrder.mockResolvedValueOnce({
      id: "order_test",
      amount: 49900,
      currency: "INR",
      receipt: "crs_bcdef12_abc123",
    });

    const ctx = createMockContext({
      body: JSON.stringify({
        courseId: "course_abcdef12",
        studentId: "s1",
      }),
    });
    await createOrder(ctx as any);

    const callArgs = mockCreateOrder.mock.calls[0][0];
    expect(callArgs.receipt).toMatch(/^crs_/);
    expect(callArgs.receipt.length).toBeLessThanOrEqual(40);
  });
});
