import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import RegisterForm from "../../auth/components/RegisterForm";
import { adminApi, ApiError } from "../../../lib/api";

type UserKind = "CLIENT" | "BANK_USER";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const inputClass =
  "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent";

/**
 * Bank users are staff: they get ROLE_ADMIN, belong to no client company, and must replace
 * the temporary password at first sign-in.
 */
function BankUserForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.password.length < 8) {
      setError("Use a temporary password of at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createBankUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setSuccess(
        "Bank user created with ROLE_ADMIN. They must replace the temporary password at first sign-in.",
      );
      setTimeout(onCreated, 2000);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Could not create the bank user.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {error && (
        <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          className={inputClass}
          placeholder="First name"
          value={form.firstName}
          onChange={(e) => set("firstName")(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Last name"
          value={form.lastName}
          onChange={(e) => set("lastName")(e.target.value)}
        />
      </div>
      <input
        className={inputClass}
        type="email"
        placeholder="Work email"
        autoComplete="off"
        value={form.email}
        onChange={(e) => set("email")(e.target.value)}
      />
      <div className="relative">
        <input
          className={`${inputClass} pr-16`}
          type={showPassword ? "text" : "password"}
          placeholder="Temporary password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => set("password")(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-800"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Role: <span className="font-mono">ROLE_ADMIN</span> (assigned
        automatically)
      </p>

      <button
        type="submit"
        disabled={submitting || !!success}
        className="rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create bank user"}
      </button>
    </form>
  );
}

/**
 * Admin screen for onboarding either kind of user. A client is a vendor company
 * (`POST /api/admin/clients`, ROLE_CLIENT); a bank user is staff (`POST /api/admin/users`,
 * ROLE_ADMIN). Both receive a temporary password and must change it at first sign-in.
 */
export default function RegisterUsersPage() {
  const navigate = useNavigate();
  const [kind, setKind] = useState<UserKind>("CLIENT");

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="ml-20 p-6">
        <TopNav portal="admin" />

        <div className="mb-6 mt-20">
          <h1 className="text-3xl font-bold text-gray-900">Register Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a client (vendor company) or a bank user (staff administrator).
            Both sign in with the temporary password you set and must change it at
            first sign-in
          </p>
        </div>

        <div className="mb-4 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
          {(
            [
              ["CLIENT", "Client", "A vendor company that consumes banking services (ROLE_CLIENT)"],
              ["BANK_USER", "Bank User", "A bank staff administrator (ROLE_ADMIN)"],
            ] as const
          ).map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              aria-pressed={kind === value}
              className={`rounded-2xl border-2 p-4 text-left transition-colors ${
                kind === value
                  ? "border-orange-500 bg-white shadow-sm"
                  : "border-transparent bg-white/60 hover:bg-white"
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="mt-1 text-xs text-gray-500">{hint}</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm max-w-3xl">
          {kind === "CLIENT" ? (
            <RegisterForm
              onBackHome={() => navigate("/admin-dashboard")}
              onRegistered={() => navigate("/admin/clients")}
              showLoginLink={false}
              variant="admin"
            />
          ) : (
            <>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                New bank user
              </h2>
              <BankUserForm onCreated={() => navigate("/admin/users")} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
