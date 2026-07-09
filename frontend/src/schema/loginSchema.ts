import { z } from "zod";
import { TRANSLATIONS, type Language } from "../translations";

export const createLoginSchema = (language: Language) => {
  const t = TRANSLATIONS[language];

  return z.object({
    name: z
      .string()
      .min(1, t.errors.nameRequired)
      .max(50, t.errors.nameTooLong)
      .regex(/^[a-zA-Z\s\u0980-\u09FF]+$/, t.errors.invalidName),

    phone: z
      .string()
      .min(10, t.errors.phoneTooShort)
      .max(11, t.errors.invalidPhone)
      .regex(/^[0-9০-৯+]+$/, t.errors.invalidPhone),

    password: z
      .string()
      .min(8, t.errors.passwordTooShort)
      .max(50, t.errors.passwordTooLong),
  });
};

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;
