import { useEffect, useState } from "react";
import { governanceApi, ApiError, type AdminUserSummary } from "../../../../lib/api";
import type { AdminGovernanceRole } from "../../../../lib/types";
import { useAdminSession } from "../../../../lib/adminSession";
import RoleBadge from "./RoleBadge";
import { ROLE_THEME } from "../roleTheme";

interface AssignRoleModalProps {
  member: AdminUserSummary;
  onClose: () => void;
  onSubmitted: () => void;
}

const ROLE_OPTIONS: Exclude<AdminGovernanceRole, "SUPER_ADMIN">[] = [
  "CONTROL",
  "INITIATOR",
  "AUTHORIZER",
];

/**
 * Control's daily move: propose a different governance role for a staff member. The change
 * is a maker-checker request like any other - an authorizer signs it off, and the rules
 * refuse self-changes and unauthorized Super Admin promotions up front.
 */
export default function AssignRoleModal({ member, onClose, onSubmitted }: AssignRoleModalProps) {
  const { me } = useAdminSession();

  const [role, setRole] = useState<AdminGovernanceRole | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const isSelf = me?.keycloakUserId === member.keycloakUserId;
  const mayProposeSuperAdmin = me?.adminRole === "SUPER_ADMIN";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, busy]);

  const submit = async () => {
    if (!role || !comment.trim()) {
      setError("Pick a role and explain the change - both are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await governanceApi.initiateRoleAssignment({
        targetKeycloakUserId: member.keycloakUserId,
        adminRole: role,
        comment: comment.trim(),
      });
      setDone(true);
      onSubmitted();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `${err.message} (${err.status})`
          : err instanceof Error
            ? err.message
            : "The request could not be submitted",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-gray-900 px-6 py-5">
          <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-300">
                Role assignment
              </span>
              <h2 className="text-lg font-bold text-white mt-1">{member.fullName || member.email}</h2>
              <div className="mt-2 flex items-center gap-2">
                <RoleBadge role={member.adminRole} />
                <span className="text-[11px] text-gray-400 truncate">{member.email}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !busy && onClose()}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {done ? (
            <div className="text-center py-4 animate-fade-up">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Change submitted</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                An authorizer must approve before {member.firstName || member.email} picks up the
                new role.
              </p>
            </div>
          ) : (
            <>
              {isSelf && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-xs text-red-600">
                  You cannot change your own governance role.
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600">New role</p>
                <div className="grid grid-cols-1 gap-2">
                  {(["SUPER_ADMIN", ...ROLE_OPTIONS] as AdminGovernanceRole[]).map((option) => {
                    const theme = ROLE_THEME[option];
                    const locked =
                      (option === "SUPER_ADMIN" && !mayProposeSuperAdmin) ||
                      (option === member.adminRole);
                    const active = role === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={locked || isSelf || busy}
                        onClick={() => {
                          setRole(option);
                          setError(null);
                        }}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                          active ? theme.cardActive : theme.card
                        } ${locked || isSelf ? "opacity-45 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <span className={`w-8 h-8 rounded-lg ${theme.monogram} flex items-center justify-center text-[11px] font-bold`}>
                          {theme.short}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{theme.label}</span>
                            {option === member.adminRole && (
                              <span className="text-[10px] font-semibold text-gray-400 uppercase">current</span>
                            )}
                            {option === "SUPER_ADMIN" && !mayProposeSuperAdmin && (
                              <span className="text-[10px] font-semibold text-gray-400">Super Admin only</span>
                            )}
                          </span>
                          <span className="block text-[11px] text-gray-500 leading-snug">
                            {option === "SUPER_ADMIN"
                              ? "Full access, minus self-authorization"
                              : option === "CONTROL"
                                ? "Assigns roles to admin users"
                                : option === "INITIATOR"
                                  ? "Initiates vendor and service actions"
                                  : "Authorizes actions, cannot initiate"}
                          </span>
                        </span>
                        {active && (
                          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="assign-comment" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Comment <span className="text-orange-500">•</span> required
                </label>
                <textarea
                  id="assign-comment"
                  rows={3}
                  value={comment}
                  disabled={busy}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Why should this person hold this role?"
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
              disabled={busy || isSelf || !role || !comment.trim()}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl shadow-md shadow-sky-500/25 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {busy && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {busy ? "Submitting…" : "Submit for approval"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
