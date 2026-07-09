import { z } from "zod";
import { TRANSLATIONS, type Language } from "../translations";

export const createRegisterBaseSchema = (language: Language) => {
  const t = TRANSLATIONS[language];

  return z.object({
    name: z
      .string()
      .min(1, t.errors.nameRequired)
      .max(50, t.errors.nameTooLong),

    phone: z
      .string()
      .min(10, t.errors.phoneTooShort)
      .max(11, t.errors.invalidPhone)
      .regex(/^[0-9০-৯+]+$/, t.errors.invalidPhoneCharacters),

    password: z
      .string()
      .min(8, t.errors.passwordTooShort)
      .max(50, t.errors.passwordTooLong),

    confirmPassword: z
      .string()
      .min(1, t.errors.confirmPasswordError),
  });
};

export const createRegisterSchema = (language: Language) => {
  const t = TRANSLATIONS[language];

  return createRegisterBaseSchema(language).refine(
    (data) => data.password === data.confirmPassword,
    {
      message: t.errors.passwordsNotMatchedError,
      path: ["confirmPassword"],
    }
  );
};

export type RegisterFormValues = z.infer<
  ReturnType<typeof createRegisterSchema>
>;

export type RegisterFormErrors = Partial<
  Record<keyof RegisterFormValues, string>
>;