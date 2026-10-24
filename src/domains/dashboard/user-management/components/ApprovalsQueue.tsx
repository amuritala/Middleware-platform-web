import { useCallback, useEffect, useState } from "react";
import { governanceApi, ApiError, type ApprovalRequest } from "../../../../lib/api";
import { useAdminSession } from "../../../../lib/adminSession";
import RoleBadge from "./RoleBadge";
import { ACTION_THEME, ROLE_THEME } from "../roleTheme";
import type { AdminGovernanceRole } from "../../../../lib/types";

type Status = "loading" | "success" | "error";
type Flash = { kind: "approved" | "rejected" | "error"; message: string } | null;

interface ApprovalsQueueProps {
  /** PENDING shows work waiting on a checker; ALL adds the decided history. */
  refreshKey: number;
}

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseRole(role: string | null | undefined): AdminGovernanceRole | null {
  return role === "SUPER_ADMIN" || role === "CONTROL" || role === "INITIATOR" || role === "AUTHORIZER"
    ? role
    : null;
}

function initials(name: string | null | undefined, fallback: string) {
  if (!name) return fallback;
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Human summary of whatever the payload holds, per action type. */
function payloadLines(request: ApprovalRequest): { label: string; value: string }[] {
  const p = request.payload as Record<string, string | string[] | undefined>;
  const lines: { label: string; value: string }[] = [];

  switch (request.actionType) {
    case "VENDOR_REGISTRATION":
      if (p.companyName) lines.push({ label: "Company", value: String(p.companyName) });
      if (p.contactEmail) lines.push({ label: "Contact", value: String(p.contactEmail) });
      if (p.registrationNumber) lines.push({ label: "Reg. no.", value: String(p.registrationNumber) });
      if (p.industry) lines.push({ label: "Industry", value: String(p.industry) });
      break;
    case "ADMIN_USER_CREATE":
      if (p.firstName || p.lastName)
        lines.push({ label: "Name", value: `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() });
      if (p.email) lines.push({ label: "Email", value: String(p.email) });
      if (p.adminRole)
        lines.push({ label: "Role", value: ROLE_THEME[p.adminRole as AdminGovernanceRole]?.label ?? String(p.adminRole) });
      break;
    case "SERVICE_ASSIGNMENT": {
      const mode = p.mode === "REVOKE" ? "Revoke" : "Grant";
      lines.push({ label: mode, value: Array.isArray(p.roles) ? p.roles.join(", ") : "—" });
      if (p.targetLabel) lines.push({ label: "Target", value: String(p.targetLabel) });
      break;
    }
    case "CLIENT_SUSPEND":
    case "CLIENT_ACTIVATE":
      if (p.companyName) lines.push({ label: "Vendor", value: String(p.companyName) });
      if (p.currentStatus) lines.push({ label: "Current status", value: String(p.currentStatus) });
      if (request.actionType === "CLIENT_ACTIVATE" && Array.isArray(p.roles) && p.roles.length > 0)
        lines.push({ label: "Roles", value: p.roles.join(", ") });
      break;
    case "ADMIN_ROLE_ASSIGN": {
      const current = p.currentRole ? ROLE_THEME[p.currentRole as AdminGovernanceRole]?.label : null;
      const next = p.adminRole ? ROLE_THEME[p.adminRole as AdminGovernanceRole]?.label : String(p.adminRole ?? "");
      lines.push({ label: "Role change", value: current ? `${current} → ${next}` : next });
      if (p.targetLabel) lines.push({ label: "Target", value: String(p.targetLabel) });
      break;
    }
    case "USER_SUSPEND":
    case "USER_UNSUSPEND":
    case "USER_LOCK":
      if (p.targetLabel) lines.push({ label: "Account", value: String(p.targetLabel) });
      if (request.actionType === "USER_LOCK" && p.lockMinutes)
        lines.push({ label: "Lock duration", value: `${p.lockMinutes} minutes` });
      break;
  }
  return lines;
}

/**
 * The approvals queue. Authorizers and Super Admins decide; initiators and control watch
 * their own requests. Your own requests are locked with an explicit four-eyes notice -
 * including for a Super Admin, because nobody signs off what they proposed themselves.
 */
export default function ApprovalsQueue({ refreshKey }: ApprovalsQueueProps) {
  const { me, can } = useAdminSession();

  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<"PENDING" | "ALL">("PENDING");
  const [flash, setFlash] = useState<Flash>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decisionComment, setDecisionComment] = useState("");

  const mayAuthorize = can("authorize");

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      setRequests(await governanceApi.getApprovals(scope));
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the queue");
      setStatus("error");
    }
  }, [scope]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const decide = async (request: ApprovalRequest, approve: boolean) => {
    const comment = decisionComment.trim();
    if (request.commentRequired && !comment) {
      setFlash({ kind: "error", message: `A comment is required for ${request.actionLabel.toLowerCase()} decisions.` });
      return;
    }
    setBusyId(request.id);
    setFlash(null);
    try {
      if (approve) {
        await governanceApi.approveRequest(request.id, comment);
      } else {
        await governanceApi.rejectRequest(request.id, comment);
      }
      setFlash({
        kind: approve ? "approved" : "rejected",
        message: approve
          ? `${request.actionLabel} approved for ${request.targetLabel} - the action has been applied.`
          : `${request.actionLabel} rejected for ${request.targetLabel}.`,
      });
      setDecidingId(null);
      setDecisionComment("");
      await load();
    } catch (err) {
      setFlash({
        kind: "error",
        message:
          err instanceof ApiError
            ? `${err.message} (${err.status})`
            : err instanceof Error
              ? err.message
              : "The decision failed",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Queue header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(["PENDING", "ALL"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setScope(value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                scope === value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {value === "PENDING" ? "Awaiting decision" : "Everything"}
            </button>
          ))}
        </div>
        {!mayAuthorize && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[11px] font-medium text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Read-only - you can watch progress but not decide
          </span>
        )}
      </div>

      {flash && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 ${
            flash.kind === "error"
              ? "border-red-100 bg-red-50"
              : flash.kind === "approved"
                ? "border-emerald-100 bg-emerald-50"
                : "border-amber-100 bg-amber-50"
          }`}
        >
          <p className={`flex-1 text-sm ${flash.kind === "error" ? "text-red-600" : flash.kind === "approved" ? "text-emerald-700" : "text-amber-700"}`}>
            {flash.message}
          </p>
          <button type="button" onClick={() => setFlash(null)} className="text-gray-400 hover:text-gray-600" aria-label="Dismiss">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {status === "loading" && (
        <div className="space-y-3">
          {[0, 1].map((index) => (
            <div key={index} className="h-32 rounded-2xl bg-white border border-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <button type="button" onClick={() => void load()} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            Try again
          </button>
        </div>
      )}

      {status === "success" && requests.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 py-14 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">
            {scope === "PENDING" ? "Nothing is waiting for a decision." : "No requests yet."}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            New initiations appear here the moment an initiator submits them.
          </p>
        </div>
      )}

      {status === "success" &&
        requests.map((request, index) => {
          const theme = ACTION_THEME[request.actionType];
          const isOwn = me?.keycloakUserId === request.initiatedByKeycloakUserId;
          const pending = request.status === "PENDING";
          const deciding = decidingId === request.id;
          const lockedOwn = pending && mayAuthorize && isOwn;

          return (
            <article
              key={request.id}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden animate-fade-up"
              style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${theme.chip}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={theme.icon} />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{theme.label}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            request.status === "PENDING"
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : request.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {request.status === "PENDING"
                            ? "Awaiting decision"
                            : request.status === "APPROVED"
                              ? "Approved"
                              : "Rejected"}
                        </span>
                        {request.commentRequired && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-400 border border-gray-100">
                            Comment required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 font-medium mt-1 truncate">{request.targetLabel}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] text-gray-400">{formatWhen(request.createdAt)}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(request.createdAt).toISOString().slice(0, 10)}
                    </p>
                  </div>
                </div>

                {/* Payload summary */}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-4 pl-[52px]">
                  {payloadLines(request).map((line) => (
                    <div key={line.label} className="flex items-baseline gap-2 min-w-0">
                      <dt className="text-[11px] text-gray-400 flex-shrink-0">{line.label}</dt>
                      <dd className="text-xs text-gray-600 font-medium truncate">{line.value}</dd>
                    </div>
                  ))}
                </dl>

                {/* Who initiated, with the four-eyes notice */}
                <div className="flex flex-wrap items-center gap-3 mt-4 pl-[52px]">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold">
                      {initials(request.initiatedByName, "?")}
                    </span>
                    <div className="leading-tight">
                      <p className="text-xs font-medium text-gray-700">
                        {request.initiatedByName}
                        {isOwn && <span className="text-orange-500"> · you</span>}
                      </p>
                      <p className="text-[10px] text-gray-400">Initiated</p>
                    </div>
                    <RoleBadge role={parseRole(request.initiatedByRole)} />
                  </div>

                  {request.authorizedByName && (
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                        {initials(request.authorizedByName, "?")}
                      </span>
                      <div className="leading-tight">
                        <p className="text-xs font-medium text-gray-700">{request.authorizedByName}</p>
                        <p className="text-[10px] text-gray-400">
                          {request.status === "APPROVED" ? "Authorized" : "Decided"} ·{" "}
                          {formatWhen(request.authorizedAt)}
                        </p>
                      </div>
                      <RoleBadge role={parseRole(request.authorizedByRole)} />
                    </div>
                  )}
                </div>

                {/* Comments */}
                {(request.initiatedComment || request.authorizationComment) && (
                  <div className="mt-4 pl-[52px] space-y-2">
                    {request.initiatedComment && (
                      <div className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                          Initiator comment
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">{request.initiatedComment}</p>
                      </div>
                    )}
                    {request.authorizationComment && (
                      <div className="rounded-xl bg-orange-50/60 border border-orange-100 px-3.5 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-400 mb-0.5">
                          Authorizer comment
                        </p>
                        <p className="text-xs text-orange-800 leading-relaxed">{request.authorizationComment}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Decision area */}
              {pending && (
                <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-4">
                  {lockedOwn ? (
                    <div className="flex items-start gap-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 px-3.5 py-2.5">
                      <svg className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        <strong>Four-eyes rule:</strong> you initiated this request, so you cannot
                        authorize it. Another authorizer or Super Admin must review it.
                      </p>
                    </div>
                  ) : !mayAuthorize ? (
                    <p className="text-xs text-gray-400">
                      Waiting for an authorizer or Super Admin to decide.
                    </p>
                  ) : deciding ? (
                    <div className="space-y-3">
                      <textarea
                        rows={2}
                        value={decisionComment}
                        onChange={(e) => setDecisionComment(e.target.value)}
                        placeholder={
                          request.commentRequired
                            ? "Required - why are you making this decision?"
                            : "Optional comment…"
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-colors resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDecidingId(null);
                            setDecisionComment("");
                          }}
                          className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={
                            busyId === request.id ||
                            (request.commentRequired && !decisionComment.trim())
                          }
                          onClick={() => void decide(request, false)}
                          className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors disabled:opacity-40"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={
                            busyId === request.id ||
                            (request.commentRequired && !decisionComment.trim())
                          }
                          onClick={() => void decide(request, true)}
                          className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all disabled:opacity-40 flex items-center gap-1.5"
                        >
                          {busyId === request.id && (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          )}
                          Approve
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-400">
                        {isOwn ? "Your request is in the queue for another pair of eyes." : "Ready for your decision."}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDecidingId(request.id);
                            setDecisionComment("");
                            setFlash(null);
                          }}
                          className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
    </div>
  );
}
