import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { accountApi, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/useAuth";
import { useAdminSession } from "../../lib/adminSession";
import logo from "../../assets/skybank-logo.png";

/**
 * The wall every temporary credential hits: until the new user replaces the password an
 * administrator emailed them, the rest of the portal stays locked. The server clears the
 * flag on the first successful change, so a reload lands back on the normal home screen.
 */
export default function ForcePasswordChangePage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { refresh } = useAdminSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login", { replace: true });
  }, [isAuthenticated, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("The two new passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      await accountApi.changePassword({ currentPassword, newPassword });
      setDone(true);
      await refresh();
      window.setTimeout(() => navigate("/", { replace: true }), 1400);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "The password could not be changed",
      );
    } finally {
      setBusy(false);
    }
  };

  const rules = [
    { label: "At least 8 characters", ok: newPassword.length >= 8 },
    {
      label: "An uppercase and a lowercase letter",
      ok: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    },
    { label: "A number", ok: /\d/.test(newPassword) },
    { label: "A special character", ok: /[^A-Za-z0-9]/.test(newPassword) },
  ];
  const rulesOk = rules.every((rule) => rule.ok);

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50 p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-scale-in">
          <svg
            className="w-10 h-10 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Password updated</h1>
          <p className="text-sm text-gray-500 mt-2">
            Your account is secured. Taking you to your portal…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50 p-6">
      <div className="w-full max-w-md animate-fade-up">
        <div className="bg-white rounded-3xl shadow-xl shadow-orange-500/5 border border-white p-8">
          <div className="flex flex-col items-center mb-7">
            <img src={logo} alt="Sky Bank" className="h-12 w-auto mb-4" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              First sign-in
            </span>
            <h1 className="text-xl font-bold text-gray-900 mt-3">
              Set your permanent password
            </h1>
            <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
              Your account was issued a temporary password. Choose your own
              before the portal unlocks.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="current"
                className="block text-xs font-semibold text-gray-600 mb-1.5"
              >
                Temporary password
              </label>
              <input
                id="current"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
                placeholder="The password from your email"
              />
            </div>

            <div>
              <label
                htmlFor="new"
                className="block text-xs font-semibold text-gray-600 mb-1.5"
              >
                New password
              </label>
              <input
                id="new"
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
                placeholder="Choose a strong password"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="block text-xs font-semibold text-gray-600 mb-1.5"
              >
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
                placeholder="Repeat it"
              />
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {rules.map((rule) => (
                <li
                  key={rule.label}
                  className="flex items-center gap-1.5 text-[11px]"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      rule.ok
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {rule.ok ? (
                      <svg
                        className="w-2.5 h-2.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-current" />
                    )}
                  </span>
                  <span
                    className={rule.ok ? "text-emerald-600" : "text-gray-400"}
                  >
                    {rule.label}
                  </span>
                </li>
              ))}
            </ul>

            {error && (
              <div className="px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !rulesOk || !currentPassword}
              className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md shadow-orange-500/25 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {busy && (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
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
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {busy ? "Updating…" : "Set password & continue"}
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="mt-5 mx-auto block text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign out instead
        </button>
      </div>
    </div>
  );
}
