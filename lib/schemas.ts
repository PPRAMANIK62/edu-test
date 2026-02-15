import { z } from "zod";

// ============================================
// Common / Reusable Schemas
// ============================================

export const subjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  questionCount: z.number(),
});

export const questionOptionSchema = z.object({
  id: z.string(),
  label: z.enum(["A", "B", "C", "D", "E", "F"]),
  text: z.string(),
});

// ============================================
// Auth Schemas
// ============================================

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignInFormData = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

// ============================================
// Course Schemas
// ============================================

export const courseFormSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().min(1, "Description is required").trim(),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Price must be a positive number",
    }),
  subjects: z.array(z.string()).optional(),
  estimatedHours: z.string().optional(),
  imageUri: z.string().nullable().optional(),
});

export type CourseFormData = z.infer<typeof courseFormSchema>;

// ============================================
// Test Schemas
// ============================================

export const testFormSchema = z.object({
  title: z.string().min(1, "Test title is required").trim(),
  description: z.string().min(1, "Description is required").trim(),
  durationMinutes: z
    .string()
    .min(1, "Duration is required")
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
      message: "Duration must be a positive number",
    }),
  passingScore: z
    .string()
    .min(1, "Passing score is required")
    .refine(
      (val) => {
        const score = parseInt(val);
        return !isNaN(score) && score >= 0 && score <= 100;
      },
      { message: "Passing score must be between 0 and 100" },
    ),
  subjects: z.array(subjectSchema).min(1, "At least one subject is required"),
});

export type TestFormData = z.infer<typeof testFormSchema>;

// ============================================
// Question Schemas
// ============================================

export const mcqFormSchema = z
  .object({
    text: z.string().min(1, "Question text is required").trim(),
    subjectId: z.string().min(1, "Please select a subject"),
    options: z.array(questionOptionSchema),
    correctOptionId: z.string(),
    explanation: z.string().min(1, "Explanation is required").trim(),
  })
  .superRefine((data, ctx) => {
    // Validate at least 2 options have text
    const filledOptions = data.options.filter((o) => o.text.trim());
    if (filledOptions.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least 2 options are required",
        path: ["options"],
      });
    }

    // Validate correct option is selected
    if (!data.correctOptionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select the correct answer",
        path: ["correctOptionId"],
      });
    } else {
      // Validate correct option has text
      const correctOption = data.options.find(
        (o) => o.id === data.correctOptionId,
      );
      if (!correctOption?.text.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "The correct answer option must have text",
          path: ["correctOptionId"],
        });
      }
    }
  });

export type MCQFormSchemaData = z.infer<typeof mcqFormSchema>;

// ============================================
// Utility Functions
// ============================================

/**
 * Validates form data against a zod schema and returns field errors
 * @param schema - Zod schema to validate against
 * @param data - Form data to validate
 * @returns Object with isValid boolean and errors record
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { isValid: boolean; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      if (field && !errors[field]) {
        errors[field] = issue.message;
      }
    });
    return { isValid: false, errors };
  }

  return { isValid: true, errors: {} };
}
