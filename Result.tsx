import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Sprout } from "lucide-react";
import axios from "axios";
import { TRANSLATIONS } from "../translations";
import { LoginSchema, type LoginFormErrors } from "../schema/loginSchema";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import signupImage from "../assets/signup_image.jpg";
import { toast } from "sonner";
import {
  RegisterBaseSchema,
  RegisterSchema,
  type RegisterFormErrors,
} from "../schema/registerSchema";
// ─── Types ─────────────────────────────────────────────────────────────────

type Language = "english" | "bangla";

interface RegisterFormState {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  language: Language;
  loading: boolean;
  agreedToTerms: boolean;
  errors: RegisterFormErrors & { terms?: string };
  touched: Partial<
    Record<"name" | "phone" | "password" | "confirmPassword", boolean>
  >;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const API_URL: string =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : `http://${window.location.hostname}:8000`;

// ─── Helper ────────────────────────────────────────────────────────────────

function validateField(
  field: "name" | "phone" | "password" | "confirmPassword",
  value: string,
): string | undefined {
  const result = RegisterBaseSchema.pick({ [field]: true } as any).safeParse({
    [field]: value,
  });

  if (!result.success) {
    return result.error.issues[0]?.message;
  }

  return undefined;
}

// ─── Sub-components ────────────────────────────────────────────────────────

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
      <span>⚠</span> {message}
    </p>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function Register(): React.JSX.Element {
  localStorage.removeItem("accessToken");

  const navigate = useNavigate();

  const [formState, setFormState] = useState<RegisterFormState>({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    language: "english",
    loading: false,
    agreedToTerms: false,
    errors: {},
    touched: {},
  });

  const {
    name,
    phone,
    password,
    confirmPassword,
    language,
    loading,
    agreedToTerms,
    errors,
    touched,
  } = formState;

  const t = TRANSLATIONS[language];

  const set = (patch: Partial<RegisterFormState>) =>
    setFormState((prev) => ({ ...prev, ...patch }));

  // ── onChange validation ──────────────────────────────────────────────────

  const handleFieldChange = (
    field: "name" | "phone" | "password" | "confirmPassword",
    value: string,
  ): void => {
    const error = validateField(field, value);

    const updatedValues = {
      name,
      phone,
      password,
      confirmPassword,
      [field]: value,
    };

    let confirmPasswordError = errors.confirmPassword;

    if (
      updatedValues.confirmPassword &&
      updatedValues.password !== updatedValues.confirmPassword
    ) {
      confirmPasswordError = "Passwords do not match";
    } else {
      confirmPasswordError = undefined;
    }

    set({
      [field]: value,
      touched: { ...touched, [field]: true },
      errors: {
        ...errors,
        [field]: error,
        confirmPassword: confirmPasswordError,
      },
    });
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    // Validate form fields
    const result = RegisterSchema.safeParse({
      name,
      phone,
      password,
      confirmPassword,
    });
    const fieldErrors: RegisterFormState["errors"] = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof RegisterFormErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
    }

    if (!agreedToTerms) {
      fieldErrors.terms = t.termsError;
    }

    if (Object.keys(fieldErrors).length > 0) {
      set({
        errors: fieldErrors,
        touched: {
          name: true,
          phone: true,
          password: true,
          confirmPassword: true,
        },
      });
      return;
    }

    set({ loading: true });

    try {
      const response = await axios.post(`${API_URL}/auth/signup`, {
        name,
        phone,
        password,
        language,
      });

      console.log("Response:", response);

      if (response.data.success) {
        localStorage.setItem("accessToken", response.data.token);

        toast.success(t.registerSuccess, {
          description: t.registerSuccessDesc,
        });
        setTimeout(() => {
          navigate("/main");
        }, 1500);
      } else {
        toast.error(response.data.message ?? t.registerFailed);
        set({ loading: false });
        navigate("/login");
      }
    } catch (err) {
      toast.error(t.registerFailed);
      console.error(err);
      set({ loading: false });
    }
  };

  return (
    <div className="flex mx-auto min-h-screen bg-gray-50">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col p-10 bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-14 h-14 bg-green-600 rounded-xl shadow-md">
            <Sprout size={30} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-none">{t.brand}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t.brand_desc}</p>
          </div>
        </div>

        <Card className="flex-1 overflow-hidden shadow-xl border-0 rounded-2xl">
          <div className="relative h-92 overflow-hidden">
            <img
              src={signupImage}
              alt="Farm"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          <CardContent className="p-6">
            <Badge className="mb-3 hover:bg-primary/20 border-0 flex justify-center items-center">
              {t.joinBadge}
            </Badge>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {t.joinTitle}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t.joinSubtitle}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
              <Sprout size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">
                {t.brand}
              </h1>
              <p className="text-xs text-gray-500">{t.brand_desc}</p>
            </div>
          </div>

          <Card className="shadow-xl border border-gray-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {t.createAccount}
              </CardTitle>
              <CardDescription className="text-gray-500">
                {t.startMonitoring}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {/* Language Toggle */}
              <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
                {(["english", "bangla"] as Language[]).map((lang) => (
                  <Button
                    key={lang}
                    type="button"
                    disabled={loading}
                    onClick={() => set({ language: lang })}
                    variant={language === lang ? "default" : "ghost"}
                    className={`flex-1 rounded-lg h-9 text-sm font-medium transition-all cursor-pointer
                      ${
                        language === lang
                          ? "bg-white text-primary shadow-sm border border-gray-200 hover:bg-white"
                          : "text-gray-500 hover:text-gray-700 hover:bg-transparent"
                      }`}
                  >
                    {lang === "english" ? "English" : "বাংলা"}
                  </Button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-5" noValidate>
                {/* Name Field */}
                <div className="space-y-1.5">
                  <RequiredLabel htmlFor="name">{t.fullName}</RequiredLabel>
                  <Input
                    id="name"
                    type="text"
                    disabled={loading}
                    value={name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    placeholder={t.placeholderName}
                    className={`h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors
                      ${
                        touched.name && errors.name
                          ? "border-red-400 focus:border-red-400 bg-red-50"
                          : touched.name && !errors.name
                            ? "border-green-400 focus:border-green-400"
                            : ""
                      }`}
                  />
                  <FieldError
                    message={touched.name ? errors.name : undefined}
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-1.5">
                  <RequiredLabel htmlFor="phone">{t.phone}</RequiredLabel>
                  <Input
                    id="phone"
                    type="tel"
                    disabled={loading}
                    value={phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    placeholder={t.placeholderPhone}
                    className={`h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors
                      ${
                        touched.phone && errors.phone
                          ? "border-red-400 focus:border-red-400 bg-red-50"
                          : touched.phone && !errors.phone
                            ? "border-green-400 focus:border-green-400"
                            : ""
                      }`}
                  />
                  <FieldError
                    message={touched.phone ? errors.phone : undefined}
                  />
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <RequiredLabel htmlFor="password">{t.password}</RequiredLabel>
                  <Input
                    id="password"
                    type="password"
                    disabled={loading}
                    value={password}
                    onChange={(e) =>
                      handleFieldChange("password", e.target.value)
                    }
                    placeholder={t.placeholderPassword}
                  />

                  <FieldError
                    message={touched.password ? errors.password : undefined}
                  />
                </div>

                {/* Confirm password field */}
                <div className="space-y-1.5">
                  <RequiredLabel htmlFor="confirmPassword">
                    {t.confirmPassword}
                  </RequiredLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    disabled={loading}
                    value={confirmPassword}
                    onChange={(e) =>
                      handleFieldChange("confirmPassword", e.target.value)
                    }
                    placeholder={t.placeholderConfirmPassword}
                  />

                  <FieldError
                    message={
                      touched.confirmPassword
                        ? errors.confirmPassword
                        : undefined
                    }
                  />
                </div>

                {/* Terms & Conditions */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      disabled={loading}
                      onCheckedChange={(checked) =>
                        set({
                          agreedToTerms: checked === true,
                          errors: { ...errors, terms: undefined },
                        })
                      }
                      className={`mt-0.5 border-gray-300 ${
                        errors.terms ? "border-red-400" : ""
                      }`}
                    />
                    <Label
                      htmlFor="terms"
                      className="text-sm text-gray-600 cursor-pointer leading-relaxed"
                    >
                      {t.termsLabel}{" "}
                      <button
                        type="button"
                        className="text-green-600 font-semibold hover:underline"
                      >
                        {t.termsLink}
                      </button>{" "}
                      {t.andText}{" "}
                      <button
                        type="button"
                        className="text-green-600 font-semibold hover:underline"
                      >
                        {t.privacyLink}
                      </button>
                    </Label>
                  </div>
                  <FieldError message={errors.terms} />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 hover:bg-primary-dark font-semibold rounded-xl text-base transition-all bg-green-600 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      {t.createAccountBtn} <ArrowRight size={18} />
                    </>
                  )}
                </Button>

                {/* Sign in link */}
                <p className="text-center text-gray-500">
                  {t.alreadyHaveAccount}{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="text-green-600 p-0 h-auto font-semibold cursor-pointer"
                    onClick={() => navigate("/login")}
                  >
                    {t.signIn}
                  </Button>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
