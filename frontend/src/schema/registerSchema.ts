import { z } from "zod";

export const RegisterBaseSchema = z.object({
  name: z
    .string()
    .min(1, "You must enter your full name")
    .max(50, "Name must be under 50 characters"),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(11, "Please enter a valid phone number"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  confirmPassword: z
    .string()
    .min(1, "Please confirm your password"),
});

export const RegisterSchema = RegisterBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

export type RegisterFormValues = z.infer<typeof RegisterSchema>;

export type RegisterFormErrors = Partial<
  Record<keyof RegisterFormValues, string>
>;