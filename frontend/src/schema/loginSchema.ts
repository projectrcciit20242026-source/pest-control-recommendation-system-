import { z } from "zod";

export const LoginSchema = z.object({
  name: z
    .string()
    .min(1, "You must enter your full name")
    .max(50, "Name must be under 50 characters")
    .regex(/^[a-zA-Z\s\u0980-\u09FF]+$/, "Name can only contain letters"),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(11, "Please enter a valid phone number")
    .regex(/^[0-9+]+$/, "Phone number can only contain digits"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must be under 50 characters")
    // .regex(
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    //   "Password must contain uppercase, lowercase and a number",
    // ),
});

export type LoginFormValues = z.infer<typeof LoginSchema>;

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;
