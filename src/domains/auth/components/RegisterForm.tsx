import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { adminApi, publicApi, ApiError } from "../../../lib/api";
import { API_BASE_URL } from "../../../lib/apiBaseUrl";

/* ------------------------------------------------------------------ */
/* Small shared field primitives                                       */
/* ------------------------------------------------------------------ */

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block text-[13px] font-medium text-gray-800 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-500">{message}</p>;
}

function TextInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  type = "text",
  rightSlot,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: boolean;
  type?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full rounded-xl bg-slate-50/80 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none ring-1 transition ${rightSlot ? "pr-11" : ""} ${
          error
            ? "ring-red-300 focus:ring-red-400"
            : "ring-gray-200 focus:ring-orange-400 focus:bg-white"
        }`}
      />
      {rightSlot && (
        <div className="absolute inset-y-0 right-1 flex items-center">
          {rightSlot}
        </div>
      )}
    </div>
  );
}

function EyeButton({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Hide password" : "Show password"}
      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
    >
      {show ? (
        <svg
          className="w-4.5 h-4.5"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg
          className="w-4.5 h-4.5"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Data model                                                          */
/* ------------------------------------------------------------------ */

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Other",
];

type Step1 = {
  companyName: string;
  companyEmail: string;
  phone: string;
  industry: string;
  address: string;
  taxId: string;
  registrationNumber: string;
};

type Step2 = {
  firstName: string;
  lastName: string;
  contactEmail: string;
  contactPhone: string;
  password: string;
  confirmPassword: string;
};

const emptyStep1: Step1 = {
  companyName: "",
  companyEmail: "",
  phone: "",
  industry: "",
  address: "",
  taxId: "",
  registrationNumber: "",
};

const emptyStep2: Step2 = {
  firstName: "",
  lastName: "",
  contactEmail: "",
  contactPhone: "",
  password: "",
  confirmPassword: "",
};

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function validateStep1(f: Step1) {
  const errors: Partial<Record<keyof Step1, string>> = {};
  if (!f.companyName.trim()) errors.companyName = "Company name is required.";
  if (!f.companyEmail.trim())
    errors.companyEmail = "Company email is required.";
  else if (!EMAIL_RE.test(f.companyEmail))
    errors.companyEmail = "Enter a valid email address.";
  return errors;
}

function validateStep2(f: Step2) {
  const errors: Partial<Record<keyof Step2, string>> = {};
  if (!f.firstName.trim()) errors.firstName = "First name is required.";
  if (!f.lastName.trim()) errors.lastName = "Last name is required.";
  if (!f.contactEmail.trim())
    errors.contactEmail = "Contact email is required.";
  else if (!EMAIL_RE.test(f.contactEmail))
    errors.contactEmail = "Enter a valid email address.";
  if (!f.password) errors.password = "Password is required.";
  else if (f.password.length < 8)
    errors.password = "Use at least 8 characters.";
  if (!f.confirmPassword)
    errors.confirmPassword = "Please confirm your password.";
  else if (f.password !== f.confirmPassword)
    errors.confirmPassword = "Passwords do not match.";
  return errors;
}

type StepErrors = Record<string, string | undefined>;

const EMAIL_TAKEN_MSG = "This email address is already registered.";

/**
 * `GET /api/check-availability` - the account username is the contact email, so both flags
 * describe the same value. Returns `null` when the check itself failed, in which case the
 * form lets the server reject a real duplicate on submit.
 */
async function lookupEmail(email: string): Promise<boolean | null> {
  try {
    const result = await publicApi.checkAvailability({
      username: email,
      email,
    });
    return result.emailAvailable && result.usernameAvailable;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

export default function RegisterForm({
  onBackHome,
  onRegistered,
  showLoginLink = true,
  variant = "public",
}: {
  onBackHome: () => void;
  /** Runs instead of navigating home after a successful registration. */
  onRegistered?: () => void;
  /** The "Already have an account?" footer - hidden when embedded in the admin portal. */
  showLoginLink?: boolean;
  /**
   * `public` posts to the open signup endpoint and the account joins the approval queue.
   * `admin` posts to the admin-only endpoint: the vendor goes live immediately and must
   * replace the temporary password at first sign-in.
   */
  variant?: "public" | "admin";
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [step1, setStep1] = useState<Step1>(emptyStep1);
  const [step2, setStep2] = useState<Step2>(emptyStep2);
  const [errors, setErrors] = useState<StepErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  /** Live result of the availability lookup for the contact email. */
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "checking" | "free" | "taken"
  >("idle");

  const s1 = (key: keyof Step1) => (v: string) =>
    setStep1((p) => ({ ...p, [key]: v }));

  const s2 = (key: keyof Step2) => (v: string) => {
    if (key === "contactEmail") {
      setEmailStatus("idle");
      setErrors((prev) => {
        if (prev.contactEmail !== EMAIL_TAKEN_MSG) return prev;
        const next = { ...prev };
        delete next.contactEmail;
        return next;
      });
    }
    setStep2((p) => ({ ...p, [key]: v }));
  };

  /** Inline duplicate-email check, run when the field loses focus. */
  const checkContactEmail = async () => {
    const email = step2.contactEmail.trim();
    if (!EMAIL_RE.test(email)) return;

    setEmailStatus("checking");
    const available = await lookupEmail(email);

    if (available === false) {
      setEmailStatus("taken");
      setErrors((prev) => ({ ...prev, contactEmail: EMAIL_TAKEN_MSG }));
    } else {
      setEmailStatus(available === true ? "free" : "idle");
      setErrors((prev) => {
        if (prev.contactEmail !== EMAIL_TAKEN_MSG) return prev;
        const next = { ...prev };
        delete next.contactEmail;
        return next;
        }
      );
    }
  };

  const goNext = () => {
    const errs = validateStep1(step1);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setErrors({});
      setStep(2);
    }
  };

  const goBack = () => {
    setErrors({});
    setStep(1);
  };

  const submit = async () => {
    const errs = validateStep2(step2);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setApiError("");
    setApiSuccess("");
    setSubmitting(true);

    // Last line of defence before the POST: a duplicate email is a 409 from the server,
    // but catching it here keeps the message next to the field.
    const email = step2.contactEmail.trim();
    const available = EMAIL_RE.test(email) ? await lookupEmail(email) : true;
    if (available === false) {
      setEmailStatus("taken");
      setErrors((prev) => ({ ...prev, contactEmail: EMAIL_TAKEN_MSG }));
      setSubmitting(false);
      return;
    }

    try {
      if (variant === "admin") {
        // Admin-only endpoint: the vendor is created ACTIVE with ROLE_CLIENT and the
        // temporary password the admin typed - no approval queue.
        await adminApi.createClient({
          companyName: step1.companyName,
          registrationNumber: step1.registrationNumber,
          contactFirstName: step2.firstName,
          contactLastName: step2.lastName,
          contactEmail: email,
          contactPhone: step2.contactPhone,
          phoneNumber: step1.phone,
          companyAddress: step1.address,
          taxId: step1.taxId,
          industry: step1.industry,
          country: "",
          password: step2.password,
        });
        setApiSuccess(
          "Vendor account created and activated. It must replace the temporary password at first sign-in."
        );
        setTimeout(() => {
          if (onRegistered) onRegistered();
          else navigate("/");
        }, 2500);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/register`,
        {
          companyName: step1.companyName,
          contactEmail: step2.contactEmail || step1.companyEmail,
          phoneNumber: step1.phone,
          companyAddress: step1.address,
          industry: step1.industry,
          taxId: step1.taxId,
          registrationNumber: step1.registrationNumber,
          contactFirstName: step2.firstName,
          contactLastName: step2.lastName,
          contactPhone: step2.contactPhone,
          password: step2.password,
          country: "",
        }
      );

      if (response.status === 201) {
        setApiSuccess(
          "Registration submitted successfully! An admin will review your application."
        );
        setTimeout(() => {
          if (onRegistered) onRegistered();
          else navigate("/");
        }, 3000);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        // Admin endpoint (fetch wrapper): first field-level message wins, like the public form.
        setApiError(
          err.details && Object.keys(err.details).length > 0
            ? (Object.values(err.details)[0] as string)
            : err.message || "Registration failed. Please try again."
        );
        return;
      }
      const errorMessage =
        (err as any).response?.data?.details
          ? Object.values((err as any).response.data.details)[0]
          : (err as any).response?.data?.error ||
            "Registration failed. Please try again.";
      setApiError(errorMessage as string);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- stepper ---------------- */

  const stepsMeta = [
    { n: 1, label: "Company Information" },
    { n: 2, label: "Contact & Security" },
  ];

  return (
    <div>
      {done ? (
        <div className="animate-scale-in text-center py-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg
              className="w-8 h-8 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="mt-5 text-xl font-semibold text-gray-900">
            Application received{step2.firstName ? `, ${step2.firstName}` : ""}
          </h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
            Thank you for registering{" "}
            <span className="font-medium text-gray-700">
              {step1.companyName || "your company"}
            </span>
            . Our onboarding team will reach out to{" "}
            <span className="font-medium text-gray-700">
              {step1.companyEmail || "you"}
            </span>{" "}
            to verify your details.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={onBackHome}
              className="w-full max-w-xs px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-purple-700 transition-all"
            >
              Back to Home
            </button>
            <button
              type="button"
              onClick={() => {
                setDone(false);
                setStep(1);
                setStep1(emptyStep1);
                setStep2(emptyStep2);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Register another company
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stepper */}
          <div className="flex items-center">
            {stepsMeta.map((s, i) => {
              const active = step === s.n;
              const completed = step > s.n;
              return (
                <div
                  key={s.n}
                  className={`flex items-center ${i > 0 ? "flex-1" : ""}`}
                >
                  {i > 0 && (
                    <div
                      className={`flex-1 h-px mx-3 ${completed ? "bg-orange-400" : "bg-gray-200"}`}
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        completed
                          ? "bg-orange-500 text-white"
                          : active
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {completed ? (
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        s.n
                      )}
                    </span>
                    <span
                      className={`text-xs font-medium whitespace-nowrap ${
                        active ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            className="mt-8"
            onSubmit={(e) => {
              e.preventDefault();
              if (step === 1) goNext();
              else submit();
            }}
            noValidate
          >
            {apiError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                {apiError}
              </div>
            )}
            {apiSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-600">
                {apiSuccess}
              </div>
            )}
            <div key={step} className="animate-fade-up">
              {step === 1 ? (
                <>
                  <h3 className="text-[15px] font-semibold text-gray-900">
                    Company Information
                  </h3>
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                    <div>
                      <FieldLabel label="Company Name" required />
                      <TextInput
                        id="companyName"
                        value={step1.companyName}
                        onChange={s1("companyName")}
                        placeholder="Acme Financial Ltd."
                        error={!!errors.companyName}
                      />
                      <FieldError message={errors.companyName} />
                    </div>
                    <div>
                      <FieldLabel label="Company Email" required />
                      <TextInput
                        id="companyEmail"
                        type="email"
                        value={step1.companyEmail}
                        onChange={s1("companyEmail")}
                        placeholder="finance@company.com"
                        error={!!errors.companyEmail}
                      />
                      <FieldError message={errors.companyEmail} />
                    </div>
                    <div>
                      <FieldLabel label="Phone Number" />
                      <TextInput
                        id="companyPhone"
                        type="tel"
                        value={step1.phone}
                        onChange={s1("phone")}
                        placeholder="+232 00 000 000"
                      />
                    </div>
                    <div>
                      <FieldLabel label="Industry" />
                      <div className="relative">
                        <select
                          id="industry"
                          value={step1.industry}
                          onChange={(e) => s1("industry")(e.target.value)}
                          className={`w-full appearance-none rounded-xl bg-slate-50/80 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-200 focus:ring-orange-400 transition pr-10 ${
                            step1.industry ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          <option value="" disabled>
                            Select Industry
                          </option>
                          {industries.map((ind) => (
                            <option
                              key={ind}
                              value={ind}
                              className="text-gray-900"
                            >
                              {ind}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel label="Company Address" />
                      <TextInput
                        id="companyAddress"
                        value={step1.address}
                        onChange={s1("address")}
                        placeholder="Street, City, Country"
                      />
                    </div>
                    <div>
                      <FieldLabel label="Tax ID" />
                      <TextInput
                        id="taxId"
                        value={step1.taxId}
                        onChange={s1("taxId")}
                        placeholder="e.g. 123-456-789"
                      />
                    </div>
                    <div>
                      <FieldLabel label="Registration Number" />
                      <TextInput
                        id="registrationNumber"
                        value={step1.registrationNumber}
                        onChange={s1("registrationNumber")}
                        placeholder="e.g. RC-2024-00123"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-[15px] font-semibold text-gray-900">
                    Contact Person
                  </h3>
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                    <div>
                      <FieldLabel label="First Name" required />
                      <TextInput
                        id="firstName"
                        value={step2.firstName}
                        onChange={s2("firstName")}
                        placeholder="Jane"
                        error={!!errors.firstName}
                      />
                      <FieldError message={errors.firstName} />
                    </div>
                    <div>
                      <FieldLabel label="Last Name" required />
                      <TextInput
                        id="lastName"
                        value={step2.lastName}
                        onChange={s2("lastName")}
                        placeholder="Doe"
                        error={!!errors.lastName}
                      />
                      <FieldError message={errors.lastName} />
                    </div>
                    <div>
                      <FieldLabel label="Contact Email" required />
                      <TextInput
                        id="contactEmail"
                        type="email"
                        value={step2.contactEmail}
                        onChange={s2("contactEmail")}
                        onBlur={() => void checkContactEmail()}
                        placeholder="jane@company.com"
                        error={!!errors.contactEmail}
                      />
                      {emailStatus === "free" && !errors.contactEmail && (
                        <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M20 6L9 17l-5-5"
                            />
                          </svg>
                          Available - this address is free to register.
                        </p>
                      )}
                      <FieldError message={errors.contactEmail} />
                    </div>
                    <div>
                      <FieldLabel label="Contact Phone" />
                      <TextInput
                        id="contactPhone"
                        type="tel"
                        value={step2.contactPhone}
                        onChange={s2("contactPhone")}
                        placeholder="+232 00 000 000"
                      />
                    </div>
                  </div>

                  <h3 className="mt-8 text-[15px] font-semibold text-gray-900">
                    Security
                  </h3>
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                    <div>
                      <FieldLabel label="Password" required />
                      <TextInput
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={step2.password}
                        onChange={s2("password")}
                        placeholder="8+ characters"
                        error={!!errors.password}
                        rightSlot={
                          <EyeButton
                            show={showPassword}
                            onToggle={() => setShowPassword((v) => !v)}
                          />
                        }
                      />
                      <FieldError message={errors.password} />
                    </div>
                    <div>
                      <FieldLabel label="Confirm Password" required />
                      <TextInput
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        value={step2.confirmPassword}
                        onChange={s2("confirmPassword")}
                        placeholder="Repeat password"
                        error={!!errors.confirmPassword}
                        rightSlot={
                          <EyeButton
                            show={showConfirm}
                            onToggle={() => setShowConfirm((v) => !v)}
                          />
                        }
                      />
                      <FieldError message={errors.confirmPassword} />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="mt-9 flex items-center gap-3">
              {step === 2 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="px-6 py-3 rounded-full text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  ← Back
                </button>
              )}
              {step === 1 ? (
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-full bg-[#ff6600] text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-gray-900/15"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-purple-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-90"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      Registering…
                    </span>
                  ) : (
                    "Register Company"
                  )}
                </button>
              )}
            </div>
          </form>

          {showLoginLink && (
            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-medium text-orange-600 hover:text-orange-700 hover:underline"
              >
                Login here
              </button>
            </p>
          )}
        </>
      )}
    </div>
  );
}
