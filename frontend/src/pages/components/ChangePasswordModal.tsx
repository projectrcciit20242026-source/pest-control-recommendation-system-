import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  changePasswordModalBaseSchema,
  changePasswordModalSchema,
  type ChangePasswordModalFormErrors,
} from "../../schema/changePasswordModalSchema";
import { Field, FieldGroup } from "../../components/ui/field";
import { Button } from "../../components/ui/button";
import api from "../../axios/apiConfig";
import { toast } from "sonner";
import { TRANSLATIONS } from "../../translations";

type Language = "english" | "bangla";

interface ChangePasswordModalFormState {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  loading: boolean;
  errors: ChangePasswordModalFormErrors;
  touched: Partial<
    Record<"oldPassword" | "newPassword" | "confirmNewPassword", boolean>
  >;
}

interface ChangePasswordModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lang: Language;
}

function RequiredLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
      {children}
      <span className="text-red-500" aria-hidden="true">
        *
      </span>
    </Label>
  );
}

function FieldError({
  message,
}: {
  message?: string;
}): React.JSX.Element | null {
  if (!message) return null;
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      {message}
    </p>
  );
}

export default function ChangePasswordModal({
  isOpen,
  onOpenChange,
  lang,
}: ChangePasswordModalProps) {
  const t = TRANSLATIONS[lang];

  const initialValues: ChangePasswordModalFormState = {
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
    loading: false,
    errors: {},
    touched: {},
  };

  const [formState, setFormState] = useState<ChangePasswordModalFormState>({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
    loading: false,
    errors: {},
    touched: {},
  });

  const {
    oldPassword,
    newPassword,
    confirmNewPassword,
    loading,
    errors,
    touched,
  } = formState;

  const set = (patch: Partial<ChangePasswordModalFormState>) =>
    setFormState((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    if (isOpen) {
      setFormState(initialValues);
    }
  }, [isOpen, lang]);

  function validateField(
    field: "oldPassword" | "newPassword" | "confirmNewPassword",
    value: string,
    language: Language,
  ) {
    const schema = changePasswordModalBaseSchema(language);

    const result = schema.pick({ [field]: true } as any).safeParse({
      [field]: value,
    });

    return result.success ? undefined : result.error.issues[0]?.message;
  }

  const handleFieldChange = (
    field: "oldPassword" | "newPassword" | "confirmNewPassword",
    value: string,
  ): void => {
    const error = validateField(field, value, lang);

    const updatedValues = {
      oldPassword,
      newPassword,
      confirmNewPassword,
      [field]: value,
    };

    const newErrors = {
      ...errors,
      [field]: error,
    };

    if (updatedValues.newPassword && updatedValues.confirmNewPassword) {
      const result = changePasswordModalSchema(lang).safeParse(updatedValues);

      if (!result.success) {
        const confirmIssue = result.error.issues.find(
          (issue) => issue.path[0] === "confirmNewPassword",
        );

        const newPasswordIssue = result.error.issues.find(
          (issue) => issue.path[0] === "newPassword",
        );

        newErrors.confirmNewPassword = confirmIssue?.message;
        newErrors.newPassword = newPasswordIssue?.message;
      } else {
        newErrors.confirmNewPassword = undefined;
        newErrors.newPassword = undefined;
      }
    }

    set({
      [field]: value,
      touched: { ...touched, [field]: true },
      errors: newErrors,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    console.log("Handle submit called");

    const schema = changePasswordModalSchema(lang);

    const result = schema.safeParse({
      oldPassword,
      newPassword,
      confirmNewPassword,
    });
    const fieldErrors: ChangePasswordModalFormState["errors"] = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ChangePasswordModalFormErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      set({
        errors: fieldErrors,
        touched: {
          oldPassword: true,
          newPassword: true,
          confirmNewPassword: true,
        },
      });
      return;
    }

    set({ loading: true });

    try {
      const response = await api.patch("/auth/profile", {
        oldPassword,
        newPassword,
      });

      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      set({ loading: false });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t.changePasswordModalTitle}</DialogTitle>
            <DialogDescription>{t.changePasswordModalDesc}</DialogDescription>
          </DialogHeader>

          <FieldGroup className="mt-3">
            <Field>
              <RequiredLabel htmlFor="oldPassword">
                {t.oldPasswordInputLabel}
              </RequiredLabel>
              <Input
                id="oldPassword"
                type="password"
                disabled={loading}
                value={oldPassword}
                onChange={(e) =>
                  handleFieldChange("oldPassword", e.target.value)
                }
                placeholder={t.oldPasswordInputPlaceholder}
              />

              <FieldError
                message={touched.oldPassword ? errors.oldPassword : undefined}
              />
            </Field>

            <Field>
              <RequiredLabel htmlFor="newPassword">
                {t.newPasswordInputLabel}
              </RequiredLabel>
              <Input
                id="newPassword"
                type="password"
                disabled={loading}
                value={newPassword}
                onChange={(e) =>
                  handleFieldChange("newPassword", e.target.value)
                }
                placeholder={t.newPasswordInputPlaceholder}
              />

              <FieldError
                message={touched.newPassword ? errors.newPassword : undefined}
              />
            </Field>

            <Field>
              <RequiredLabel htmlFor="confirmNewPassword">
                {t.confirmNewPasswordInputLabel}
              </RequiredLabel>
              <Input
                id="confirmNewPassword"
                type="password"
                disabled={loading}
                value={confirmNewPassword}
                onChange={(e) =>
                  handleFieldChange("confirmNewPassword", e.target.value)
                }
                placeholder={t.confirmNewPasswordInputPlaceholder}
              />

              <FieldError
                message={
                  touched.confirmNewPassword
                    ? errors.confirmNewPassword
                    : undefined
                }
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {lang === "english" ? "Cancel" : "বাতিল করুন"}
            </Button>
            <Button type="submit">
              {lang === "english" ? "Save Changes" : "সংরক্ষণ করুন"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
