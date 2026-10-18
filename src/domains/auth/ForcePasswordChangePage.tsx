import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/useAuth";
import { accountApi, ApiError } from "../../lib/api";
import logo from "../../assets/skybank-logo.png";

/**
 * Vendors an administrator created sign in with a temporary password; this screen is the
 * only place they can go until they replace it. The backend clears the flag on a
 * successful change, and `refreshCredentials` re-reads it so the route gate lifts.
 */
export default function ForcePasswordChangePage() {
  const { refreshCredentials, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("Enter the temporary password you signed in with.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Choose a password different from the temporary one.");
      return;
    }

    setSubmitting(true);
    try {
      await accountApi.changePassword({ currentPassword, newPassword });
      await refreshCredentials();
      setDone(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? `${cause.message}${cause.details ? ` - ${Object.values(cause.details)[0]}` : ""}`
          : cause instanceof Error
            ? cause.message
            : "The password could not be changed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-slate-50 via-purple-50/40 to-orange-50/30 p-6 text-center">
        <img src={logo} alt="Sky Bank Sierra Leone" className="h-16 w-auto" />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Password updated</h1>
        <p className="max-w-sm text-sm text-gray-500">
          Your password has been saved. You can now continue to your portal.
        </p>
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          className="rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
        >
          Continue to dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(rgba(100,116,139,0.22)_1px,transparent_1px)] p-8"
      style={{ backgroundSize: "20px 20px" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <img src={logo} alt="Sky Bank Sierra Leone" className="h-14" />
        </div>

        <div className="mb-8 text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            First sign-in
          </span>
          <h1 className="text-2xl font-bold text-gray-900">Set your own password</h1>
          <p className="mt-2 text-sm text-gray-500">
            You signed in with a temporary password. Choose your own before
            continuing to the portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-gray-800">
              Temporary password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-gray-800">
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            <p className="mt-1.5 text-xs text-gray-400">
              8+ characters with upper case, lower case, a digit and a symbol.
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-800">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Set password and continue"}
          </button>

          <button
            type="button"
            onClick={() => logout()}
            className="w-full text-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
          >
            Sign out instead
          </button>
        </form>
      </div>
    </div>
  );
}
