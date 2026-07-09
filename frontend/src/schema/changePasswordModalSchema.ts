import { z } from "zod";
import { type Language, TRANSLATIONS } from "../translations";

export const changePasswordModalBaseSchema = (language: Language) => {
  const lang = TRANSLATIONS[language];

  return z.object({
    oldPassword: z.string().min(1, lang.oldPasswordValidationMessage),

    newPassword: z
      .string()
      .min(8, lang.errors.passwordTooShort)
      .max(50, lang.errors.passwordTooLong),

    confirmNewPassword: z.string().min(1, lang.errors.confirmPasswordError),
  });
};

export const changePasswordModalSchema = (language: Language) => {
  const lang = TRANSLATIONS[language];

  return changePasswordModalBaseSchema(language)
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: lang.errors.passwordsNotMatchedError,
      path: ["confirmNewPassword"],
    })
    .refine((data) => data.oldPassword != data.newPassword, {
      message: lang.errors.newPasswordMustBeDifferent,
      path: ["newPassword"],
    });
};

export type ChangePasswordModalFormValues = z.infer<
  ReturnType<typeof changePasswordModalSchema>
>;

export type ChangePasswordModalFormErrors = Partial<
  Record<keyof ChangePasswordModalFormValues, string>
>;
