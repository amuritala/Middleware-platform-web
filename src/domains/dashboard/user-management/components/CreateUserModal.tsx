import { useEffect, useState } from "react";
import { governanceApi, ApiError, type ApprovalRequest } from "../../../../lib/api";
import type { AdminGovernanceRole, StaffMember } from "../../../../lib/types";
import { useAdminSession } from "../../../../lib/adminSession";
import StaffDirectoryPicker from "./StaffDirectoryPicker";
import { ROLE_THEME, PERMISSION_LABELS } from "../roleTheme";

interface CreateUserModalProps {
  onClose: () => void;
  /** Fires after a successful initiation so the queue can refetch. */
  onSubmitted: () => void;
}

const ROLE_ORDER: AdminGovernanceRole[] = [
  "SUPER_ADMIN",
  "CONTROL",
  "INITIATOR",
  "AUTHORIZER",
];

const ROLE_HIGHLIGHTS: Record<AdminGovernanceRole, string[]> = {
  SUPER_ADMIN: ["view.audit", "initiate.vendor_registration", "authorize"],
  CONTROL: ["initiate.admin_user_create", "initiate.admin_role_assign", "view.users"],
  INITIATOR: ["initiate.vendor_registration", "initiate.service_assignment", "initiate.client_suspend"],
  AUTHORIZER: ["authorize", "view.approvals", "view.role_requests"],
};

/**
 * The create-user wizard: pick a person from the bank directory, choose a governance role,
 * review, submit. The account does not exist yet at this point - an authorizer approves the
 * request, and only then is the temporary password generated and emailed.
 */
export default function CreateUserModal({ onClose, onSubmitted }: CreateUserModalProps) {
  const { me } = useAdminSession();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminGovernanceRole | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<ApprovalRequest | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, busy]);

  const selectStaff = (member: StaffMember) => {
    setStaff(member);
    setFullName(`${member.firstName} ${member.lastName}`.trim());
    setEmail(member.email);
    setError(null);
  };

  const clearStaff = () => {
    setStaff(null);
    setFullName("");
    setEmail("");
  };

  const stepOneValid = fullName.trim().length >= 2 && /\S+@\S+\.\S+/.test(email.trim());

  const next = () => {
    setError(null);
    if (step === 1 && !stepOneValid) {
      setError("Search the directory (or type a full name and a valid email) to continue.");
      return;
    }
    if (step === 2 && !role) {
      setError("Choose the governance role this administrator should hold.");
      return;
    }
    setStep((current) => (current + 1) as 1 | 2 | 3 | 4);
  };

  const submit = async () => {
    if (!role) return;
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || parts[0];
    setBusy(true);
    setError(null);
    try {
      const request = await governanceApi.initiateAdminUser({
        firstName,
        lastName,
        email: email.trim(),
        adminRole: role,
        comment: comment.trim() || undefined,
      });
      setCreated(request);
      setStep(4);
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with the wizard progress */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 px-7 pt-6 pb-5">
          <div className="absolute -top-16 -right-12 w-52 h-52 rounded-full bg-orange-500/25 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-44 h-44 rounded-full bg-amber-400/15 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-orange-300 text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                Maker-checker
              </span>
              <h2 className="text-xl font-bold text-white mt-2.5">
                {step === 4 ? "Request submitted" : "Create admin user"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {step === 4
                  ? "An authorizer will review it before the account goes live."
                  : ["Find the person", "Assign a role", "Review & submit"][step - 1]}
              </p>
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

          {step < 4 && (
            <div className="relative mt-4 flex items-center gap-2">
              {[1, 2, 3].map((index) => (
                <div key={index} className="flex-1 flex items-center gap-2">
                  <div
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      step >= index ? "bg-gradient-to-r from-orange-500 to-amber-400" : "bg-white/15"
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-7 overflow-y-auto">
          {error && (
            <div className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
              {error}
            </div>
          )}

          {/* ---- Step 1: directory + identity ---- */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-up">
              <StaffDirectoryPicker
                selected={staff}
                onSelect={selectStaff}
                onClear={clearStaff}
                disabled={busy}
              />

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-300">
                  Account details
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              <div>
                <label htmlFor="full-name" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Full name
                </label>
                <input
                  id="full-name"
                  value={fullName}
                  disabled={busy}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Amara Okonkwo"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled={busy}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@skybank.sl"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
                />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  The temporary password is emailed here once an authorizer approves the account.
                </p>
              </div>
            </div>
          )}

          {/* ---- Step 2: governance role ---- */}
          {step === 2 && (
            <div className="space-y-3 animate-fade-up">
              <p className="text-sm text-gray-500">
                Choose what this administrator may do. Only a Super Admin can grant the Super Admin role.
              </p>

              {ROLE_ORDER.map((roleOption) => {
                const theme = ROLE_THEME[roleOption];
                const description =
                  roleOption === "SUPER_ADMIN"
                    ? "Sees every screen and may both initiate and authorize actions - except ones they initiated themselves."
                    : roleOption === "CONTROL"
                      ? "Assigns governance roles to administrator accounts - deciding who becomes an initiator or an authorizer."
                      : roleOption === "INITIATOR"
                        ? "Initiates actions such as vendor registration and service assignments. Cannot authorize."
                        : "Authorizes actions initiated by others. Cannot initiate any action.";
                const active = role === roleOption;
                const locked = roleOption === "SUPER_ADMIN" && me?.adminRole !== "SUPER_ADMIN";

                return (
                  <button
                    key={roleOption}
                    type="button"
                    disabled={locked || busy}
                    onClick={() => {
                      setRole(roleOption);
                      setError(null);
                    }}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      active ? theme.cardActive : theme.card
                    } ${locked ? "opacity-45 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-xl ${theme.monogram} flex items-center justify-center text-xs font-bold flex-shrink-0`}
                      >
                        {theme.short}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{theme.label}</p>
                          {active && (
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {locked && (
                            <span className="text-[10px] font-semibold text-gray-400 uppercase">Super Admin only</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3 ml-12">
                      {ROLE_HIGHLIGHTS[roleOption].map((permission) => (
                        <span
                          key={permission}
                          className="px-2 py-0.5 rounded-md bg-white/70 border border-gray-100 text-[10px] text-gray-500"
                        >
                          {PERMISSION_LABELS[permission] ?? permission}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ---- Step 3: review ---- */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-up">
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Review before submitting
                  </span>
                </div>
                <dl className="divide-y divide-gray-50">
                  <div className="flex items-center justify-between px-5 py-3">
                    <dt className="text-xs text-gray-400">Full name</dt>
                    <dd className="text-sm font-medium text-gray-900">{fullName}</dd>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    <dt className="text-xs text-gray-400">Email</dt>
                    <dd className="text-sm font-medium text-gray-900">{email}</dd>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    <dt className="text-xs text-gray-400">Directory match</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {staff ? `Staff ID ${staff.staffId}` : "Manual entry"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    <dt className="text-xs text-gray-400">Governance role</dt>
                    <dd>
                      {role && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${ROLE_THEME[role].badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${ROLE_THEME[role].dot}`} />
                          {ROLE_THEME[role].label}
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 flex gap-3">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Submitting stages the account as <strong>PENDING</strong>. Nothing is created
                  for the user to sign in with until an authorizer approves this request - and
                  the temporary password is generated and emailed only at that point, never
                  shown here.
                </p>
              </div>

              <div>
                <label htmlFor="create-comment" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Comment <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="create-comment"
                  rows={3}
                  value={comment}
                  disabled={busy}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Anything the authorizer should know…"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* ---- Step 4: success ---- */}
          {step === 4 && (
            <div className="py-6 text-center animate-fade-up">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {fullName} is pending authorization
              </h3>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                An authorizer (or a Super Admin other than you) must approve this request.
                Once approved, the account activates and a temporary password is sent to{" "}
                <span className="font-medium text-gray-700">{email}</span>, to be changed at
                first sign-in.
              </p>
              {created && (
                <span className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {created.actionLabel} · awaiting decision
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        {step < 4 && (
          <div className="flex items-center justify-between gap-3 px-7 py-5 border-t border-gray-100 bg-gray-50/60">
            <button
              type="button"
              onClick={() => (step === 1 ? onClose() : setStep((s) => (s - 1) as 1 | 2 | 3))}
              disabled={busy}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={next}
                disabled={busy}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md shadow-orange-500/25 hover:shadow-lg transition-all disabled:opacity-40 flex items-center gap-2"
              >
                Continue
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md shadow-orange-500/25 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
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
        )}

        {step === 4 && (
          <div className="flex justify-end px-7 py-5 border-t border-gray-100 bg-gray-50/60">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md shadow-orange-500/25 hover:shadow-lg transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
