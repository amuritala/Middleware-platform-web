import { useState } from "react";
import { useAuth } from "../../../lib/useAuth";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { accountApi, ApiError } from "../../../lib/api";
import { getDisplayName } from "../../../lib/user";
import { useNavigate } from "react-router-dom";

/**
 * Self-service settings, available to both portals. Currently holds the password change,
 * which is one backend endpoint for vendors and administrators alike.
 */
export default function SettingsPage() {
  const { claims, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = (claims?.realm_access?.roles ?? []).includes("ROLE_ADMIN");

  const portal = isAdmin ? "admin" : "vendor";
  const displayName = getDisplayName();
  const email =
    claims?.email ?? "";

  return (
    <div className={`min-h-screen ${isAdmin ? "bg-gray-100" : "bg-gray-50"}`}>
      <Sidebar />

      <div className={`ml-20 ${isAdmin ? "p-6" : "pt-24 p-6"}`}>
        <TopNav portal={portal} />

        <div className={`mb-6 ${isAdmin ? "mt-20" : ""}`}>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account security
          </p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Profile summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                {displayName
                  .split(" ")
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-gray-900 truncate">
                  {displayName}
                </p>
                <p className="text-sm text-gray-400 truncate">{email}</p>
                <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-orange-50 text-orange-600">
                  {isAdmin ? "Administrator" : "Vendor"}
                </span>
              </div>
            </div>
          </div>

          <PasswordChangeCard
            disabled={!isAuthenticated}
            onDone={() => {
              logout();
              navigate("/login");
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PasswordChangeCard({
  disabled,
  onDone,
}: {
  disabled: boolean;
  onDone: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const rules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    digit: /[0-9]/.test(newPassword),
    special: /[@#$%^&+=!*()_+{}|:<>?,.~`-]/.test(newPassword),
  };
  const allRulesPass = Object.values(rules).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit =
    !disabled &&
    currentPassword.length > 0 &&
    allRulesPass &&
    passwordsMatch &&
    !submitting;

  const showFieldError = (ok: boolean) => touched && !ok;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await accountApi.changePassword({ currentPassword, newPassword });
      setSucceeded(true);
      // Give the user a moment to read the confirmation before the forced re-login.
      setTimeout(onDone, 1800);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 401
            ? "Your current password is incorrect."
            : `${err.message}`
          : err instanceof Error
            ? err.message
            : "The password could not be changed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (succeeded) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Password updated
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          For your security you will be signed out — sign back in with your new
          password.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Change Password
            </h3>
            <p className="text-xs text-gray-400">
              Your current password is verified before the change is applied
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <PasswordInput
          label="Current password"
          value={currentPassword}
          onChange={(v) => setCurrentPassword(v)}
          invalid={showFieldError(currentPassword.length === 0)}
          hint={
            showFieldError(currentPassword.length === 0)
              ? "Enter your current password"
              : undefined
          }
          disabled={disabled || submitting}
        />

        <PasswordInput
          label="New password"
          value={newPassword}
          onChange={(v) => setNewPassword(v)}
          invalid={showFieldError(!allRulesPass)}
          hint={
            showFieldError(!allRulesPass)
              ? "Does not meet the requirements below"
              : undefined
          }
          disabled={disabled || submitting}
        />

        {/* Live strength checklist */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(
            [
              ["At least 8 characters", rules.length],
              ["One uppercase", rules.upper],
              ["One lowercase", rules.lower],
              ["One number", rules.digit],
              ["One special character", rules.special],
            ] as [string, boolean][]
          ).map(([label, ok]) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1.5 text-xs ${
                ok ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  ok ? "bg-emerald-500" : "bg-gray-300"
                }`}
              />
              {label}
            </span>
          ))}
        </div>

        <PasswordInput
          label="Confirm new password"
          value={confirmPassword}
          onChange={(v) => setConfirmPassword(v)}
          invalid={showFieldError(!passwordsMatch && confirmPassword.length > 0)}
          hint={
            showFieldError(!passwordsMatch && confirmPassword.length > 0)
              ? "Passwords do not match"
              : undefined
          }
          disabled={disabled || submitting}
        />

        {error && (
          <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
          >
            {submitting && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {submitting ? "Updating…" : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  invalid,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  hint?: string;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete="new-password"
          className={`w-full pr-11 pl-4 py-2.5 bg-gray-50 border rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors disabled:opacity-50 ${
            invalid ? "border-red-300" : "border-gray-200"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {visible ? (
            <svg
              className="w-4.5 h-4.5 w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>
      {hint && <p className="text-xs text-red-500 mt-1">{hint}</p>}
    </div>
  );
}
