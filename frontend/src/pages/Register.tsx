import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Loader2, Sprout } from "lucide-react";
import axios from "axios";
import { TRANSLATIONS } from "../translations";
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
import { Badge } from "../components/ui/badge";
import signupImage from "../assets/signup_image.jpg";
import { toast } from "sonner";
import {
  createRegisterBaseSchema,
  createRegisterSchema,
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
  errors: RegisterFormErrors;
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
  language: Language,
) {
  const schema = createRegisterBaseSchema(language);

  const result = schema.pick({ [field]: true } as any).safeParse({
    [field]: value,
  });

  return result.success ? undefined : result.error.issues[0]?.message;
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLength, setPasswordLength] = useState(0);
  const [confirmPasswordLength, setConfirmPasswordLength] = useState(0);

  localStorage.removeItem("accessToken");

  const navigate = useNavigate();

  const [formState, setFormState] = useState<RegisterFormState>({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    language: "english",
    loading: false,
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
  ) => {
    field === "password"
      ? setPasswordLength(value.length)
      : field === "confirmPassword" && setConfirmPasswordLength(value.length);

    const error = validateField(field, value, language);

    const updatedValues = {
      name,
      phone,
      password,
      confirmPassword,
      [field]: value,
    };

    const newErrors = {
      ...errors,
      [field]: error,
    };

    if (updatedValues.password && updatedValues.confirmPassword) {
      const result = createRegisterSchema(language).safeParse(updatedValues);

      if (!result.success) {
        const confirmIssue = result.error.issues.find(
          (issue) => issue.path[0] === "confirmPassword",
        );

        newErrors.confirmPassword = confirmIssue?.message;
      } else {
        newErrors.confirmPassword = undefined;
      }
    }

    set({
      [field]: value,
      touched: {
        ...touched,
        [field]: true,
      },
      errors: newErrors,
    });
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    // Validate form fields
    const schema = createRegisterSchema(language);

    const result = schema.safeParse({
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
    <div className="flex flex-col lg:flex-row mx-auto min-h-screen bg-gray-50">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col p-6 xl:p-10 bg-gradient-to-br from-green-50 to-emerald-100">
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
          <div className="relative h-64 xl:h-92 overflow-hidden">
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
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8 lg:hidden">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl shrink-0">
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
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                {t.createAccount}
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                {t.startMonitoring}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 px-4 sm:px-6">
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
              <form
                onSubmit={handleRegister}
                className="space-y-4 sm:space-y-5"
                noValidate
              >
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      disabled={loading}
                      value={password}
                      onChange={(e) =>
                        handleFieldChange("password", e.target.value)
                      }
                      placeholder={t.placeholderPassword}
                      className={`h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors pr-11
                      ${
                        touched.password && errors.password
                          ? "border-red-400 focus:border-red-400 bg-red-50"
                          : touched.password && !errors.password
                            ? "border-green-400 focus:border-green-400"
                            : ""
                      }`}
                    />

                    {passwordLength > 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-1 my-auto h-8 w-8 p-0 flex items-center justify-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                    )}
                  </div>

                  <FieldError
                    message={touched.password ? errors.password : undefined}
                  />
                </div>

                {/* Confirm password field */}
                <div className="space-y-1.5">
                  <RequiredLabel htmlFor="confirmPassword">
                    {t.confirmPassword}
                  </RequiredLabel>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      disabled={loading}
                      value={confirmPassword}
                      onChange={(e) =>
                        handleFieldChange("confirmPassword", e.target.value)
                      }
                      placeholder={t.placeholderConfirmPassword}
                      className={`h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors pr-11
                      ${
                        touched.confirmPassword && errors.confirmPassword
                          ? "border-red-400 focus:border-red-400 bg-red-50"
                          : touched.confirmPassword && !errors.confirmPassword
                            ? "border-green-400 focus:border-green-400"
                            : ""
                      }`}
                    />

                    {confirmPasswordLength > 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-1 my-auto h-8 w-8 p-0 flex items-center justify-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                    )}
                  </div>

                  <FieldError
                    message={
                      touched.confirmPassword
                        ? errors.confirmPassword
                        : undefined
                    }
                  />
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
                <p className="text-center text-sm sm:text-base text-gray-500">
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
