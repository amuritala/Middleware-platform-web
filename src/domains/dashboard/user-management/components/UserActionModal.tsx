import { useEffect, useState } from "react";
import { governanceApi } from "../../../../lib/api";
import type { AdminUserSummary } from "../../../../lib/types";

export type UserAccessAction = "SUSPEND" | "UNSUSPEND" | "LOCK";

interface UserActionModalProps {
  member: AdminUserSummary;
  action: UserAccessAction;
  onClose: () => void;
  /** Called after a successful initiation so the page can refresh the directory. */
  onSubmitted: () => void;
}

const ACTION_CONFIG: Record<
  UserAccessAction,
  {
    title: string;
    effect: string;
    placeholder: string;
    gradient: string;
    monogram: string;
    submit: string;
  }
> = {
  SUSPEND: {
    title: "Suspend user",
    effect:
      "Once approved, this person can no longer sign in or use the system until a reinstatement is approved.",
    placeholder: "Why must this account be suspended?",
    gradient: "from-rose-500 to-red-500",
    monogram: "bg-rose-100 text-rose-700",
    submit: "Submit suspension",
  },
  UNSUSPEND: {
    title: "Reinstate user",
    effect:
      "Once approved, the suspension is lifted and this person regains access immediately.",
    placeholder: "Why should this person regain access?",
    gradient: "from-emerald-500 to-teal-500",
    monogram: "bg-emerald-100 text-emerald-700",
    submit: "Submit reinstatement",
  },
  LOCK: {
    title: "Time-lock user",
    effect:
      "Once approved, this person cannot sign in until the lock expires. The lock releases automatically — no second approval needed to unlock.",
    placeholder: "Why must this account be locked?",
    gradient: "from-sky-500 to-cyan-500",
    monogram: "bg-sky-100 text-sky-700",
    submit: "Submit time lock",
  },
};

const MINUTE_PRESETS = [15, 30, 60, 240, 1440];
const MAX_LOCK_MINUTES = 10080; // 7 days

/** Maker-checker modal for suspending / reinstating / time-locking a staff account. */
export default function UserActionModal({
  member,
  action,
  onClose,
  onSubmitted,
}: UserActionModalProps) {
  const config = ACTION_CONFIG[action];
  const [comment, setComment] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const parsedMinutes = Number.parseInt(minutes, 10);
  const minutesValid =
    action !== "LOCK" ||
    (Number.isFinite(parsedMinutes) &&
      parsedMinutes >= 1 &&
      parsedMinutes <= MAX_LOCK_MINUTES);
  const canSubmit = Boolean(comment.trim()) && minutesValid && !busy;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await governanceApi.initiateUserAccess({
        action,
        targetKeycloakUserId: member.keycloakUserId,
        targetLabel: member.email,
        ...(action === "LOCK" ? { lockMinutes: parsedMinutes } : {}),
        comment: comment.trim(),
      });
      setDone(true);
      onSubmitted();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Submitting the change failed",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={config.title}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Change submitted
              </h2>
              <p className="text-sm text-gray-500 mb-1">
                Your proposed {config.title.toLowerCase()} for{" "}
                <span className="font-semibold text-gray-700">
                  {member.fullName}
                </span>{" "}
                is in the approvals queue.
              </p>
              <p className="text-xs text-gray-400">
                An authorizer must approve it (with their own comment) before
                anything changes.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0`}
                >
                  {member.firstName?.[0]}
                  {member.lastName?.[0]}
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {config.title}
                  </h2>
                  <p className="text-sm text-gray-500 truncate">
                    {member.fullName} · {member.email}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-2.5 text-xs text-gray-500 leading-relaxed mb-4">
                {config.effect}
              </div>

              {action === "LOCK" && (
                <div className="mb-4">
                  <label
                    htmlFor="lock-minutes"
                    className="block text-xs font-semibold text-gray-600 mb-1.5"
                  >
                    Lock duration <span className="text-orange-500">•</span>{" "}
                    minutes
                  </label>
                  <input
                    id="lock-minutes"
                    type="number"
                    min={1}
                    max={MAX_LOCK_MINUTES}
                    value={minutes}
                    disabled={busy}
                    onChange={(e) => {
                      setMinutes(e.target.value);
                      setError(null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:bg-white transition-colors"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {MINUTE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setMinutes(String(preset));
                          setError(null);
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                          minutes === String(preset)
                            ? "bg-sky-50 text-sky-600 border-sky-200"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {preset >= 1440 ? `${preset / 1440}d` : `${preset}m`}
                      </button>
                    ))}
                  </div>
                  {!minutesValid && (
                    <p className="mt-1.5 text-[11px] text-red-500">
                      Enter a duration between 1 minute and 10,080 minutes (7
                      days).
                    </p>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="access-comment"
                  className="block text-xs font-semibold text-gray-600 mb-1.5"
                >
                  Comment <span className="text-orange-500">•</span> required
                </label>
                <textarea
                  id="access-comment"
                  rows={3}
                  value={comment}
                  disabled={busy}
                  onChange={(e) => {
                    setComment(e.target.value);
                    setError(null);
                  }}
                  placeholder={config.placeholder}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:bg-white transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            {done ? "Close" : "Cancel"}
          </button>
          {!done && (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!canSubmit}
              className={`px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r ${config.gradient} rounded-xl shadow-md shadow-black/10 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2`}
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
              {busy ? "Submitting…" : config.submit}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
