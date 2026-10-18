import { useState, useEffect } from "react";
import { SYSTEM_ROLES } from "../../../lib/useRoleApplications";
import { serviceStyles, type ServiceInfo } from "../../../lib/serviceCatalog";

export type RequestAction = "add" | "remove";

/** Whether this service can be requested, and what is already in flight for it. */
export type RequestAvailability =
  | { kind: "unavailable"; reason: string }
  | {
      kind: "awaiting-review";
      changeForThisRole: RequestAction | null;
      since: string | null;
    }
  | { kind: "available" };

interface ServiceDetailModalProps {
  service: ServiceInfo;
  isAssigned: boolean;
  assignedRoles: string[];
  availability: RequestAvailability;
  onSubmit: (requestedRoles: string[]) => Promise<void>;
  onClose: () => void;
}

export default function ServiceDetailModal({
  service,
  isAssigned,
  assignedRoles,
  availability,
  onSubmit,
  onClose,
}: ServiceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "access">("overview");
  const [submitting, setSubmitting] = useState<RequestAction | null>(null);
  const [result, setResult] = useState<RequestAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const colors = serviceStyles[service.color] ?? serviceStyles.blue;

  // Requests carry the whole target set, not a diff - the server replaces the roles held.
  // System roles (ROLE_ADMIN, ROLE_CLIENT, the realm defaults) ride along in the JWT but are
  // never requestable: the backend 400s the whole payload if one is present.
  const heldServiceRoles = assignedRoles.filter((role) => !SYSTEM_ROLES.has(role));

  const targetRolesFor = (action: RequestAction) =>
    action === "add"
      ? Array.from(new Set([...heldServiceRoles, service.role]))
      : heldServiceRoles.filter((role) => role !== service.role);

  const isSystemRole = SYSTEM_ROLES.has(service.role);
  const wouldDropLastRole =
    !isSystemRole &&
    heldServiceRoles.length > 0 &&
    heldServiceRoles.every((role) => role === service.role);

  const send = async (action: RequestAction) => {
    setError(null);
    setSubmitting(action);
    try {
      await onSubmit(targetRolesFor(action));
      setResult(action);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send your request",
      );
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-up"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div
          className={`relative flex-shrink-0 bg-gradient-to-r ${service.gradient} px-8 pt-8 pb-12`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={service.icon}
                />
              </svg>
            </div>
            <span className="inline-block px-2.5 py-0.5 bg-white/20 rounded-full text-white text-xs font-medium backdrop-blur-sm">
              {service.category}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {service.displayName}
          </h2>
          <p className="text-white/80 text-sm font-mono">{service.role}</p>

          <div className="mt-4">
            {isAssigned ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/25 rounded-full text-white text-xs font-medium backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Active on your account
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-white/70 text-xs font-medium backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-white/40" />
                Not assigned
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 border-b border-gray-100 px-8">
          <div className="flex gap-1 -mb-px">
            {(["overview", "access"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? `border-current ${colors.modalText}`
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab === "overview" ? "Overview" : "Access"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 min-h-0">
          {activeTab === "overview" ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                {service.description}
              </p>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${colors.modalBadge}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${colors.modalDot}`}
                  />
                  {service.accessLevel}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  JWT Protected
                </span>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  What this service does
                </h4>
                <ul className="space-y-2.5">
                  {service.capabilities.map((cap, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className={`mt-1 w-5 h-5 rounded-full ${colors.modalBg} flex items-center justify-center flex-shrink-0`}
                      >
                        <svg
                          className={`w-3 h-3 ${colors.modalText}`}
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
                      </span>
                      <span className="text-sm text-gray-700">{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Current state */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Your current set of service roles
                </p>
                {heldServiceRoles.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {heldServiceRoles.map((role) => (
                      <code
                        key={role}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded border ${
                          role === service.role
                            ? "bg-white border-gray-200 text-gray-700"
                            : "bg-white border-gray-100 text-gray-400"
                        }`}
                      >
                        {role}
                      </code>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    None yet - this would be your first service role.
                  </p>
                )}
                <p className="text-[11px] text-gray-400 mt-2">
                  A request replaces this whole set, so every role above is sent
                  along with the one you are changing.
                </p>
              </div>

              {/* The endpoints behind a request */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Endpoints involved in a request
                </h4>
                <div className="space-y-3">
                  <AccessRow
                    method="POST"
                    path="/api/customer-management/role-applications"
                    description="Submit the target set of roles"
                  />
                  <AccessRow
                    method="GET"
                    path="/api/customer-management/role-applications/mine"
                    description="Track your own requests"
                  />
                  <AccessRow
                    method="PUT"
                    path="/api/customer-management/role-applications/{id}/approve"
                    description="Administrator approves - roles applied"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-3">
                  While {service.role} is granted it travels in your Keycloak
                  access token, which is what downstream APIs check.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-8 py-5 border-t border-gray-100">
          {result ? (
            /* The request really was recorded - it is now awaiting review. */
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {result === "add"
                    ? "Access request submitted"
                    : "Removal request submitted"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Now awaiting administrator review for {service.displayName}.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                Done
              </button>
            </div>
          ) : availability.kind === "unavailable" ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="flex-1 text-xs text-gray-400">
                {availability.reason}
              </p>
              <button
                onClick={onClose}
                className="w-full sm:w-auto shrink-0 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          ) : availability.kind === "awaiting-review" ? (
            <div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {availability.changeForThisRole === "add"
                      ? "Access request pending"
                      : availability.changeForThisRole === "remove"
                        ? "Removal request pending"
                        : "A role change is already pending"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {availability.changeForThisRole
                      ? `Your administrator is reviewing your request for ${service.displayName}.`
                      : "You have a request awaiting review. Only one can be open at a time."}
                    {availability.since
                      ? ` Submitted ${formatDate(availability.since)}.`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3">
                {isAssigned
                  ? "Need to change your access? Send a request to your administrator."
                  : "This service is not assigned to you. Request access from your administrator."}
              </p>

              {error && (
                <div className="flex items-start gap-2 mb-3 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                  <svg
                    className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                  <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                </div>
              )}

              {wouldDropLastRole && !error && (
                <p className="text-xs text-amber-600 mb-3">
                  You must keep at least one service role, so this one can&apos;t
                  be removed on its own.
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  onClick={onClose}
                  className="order-3 sm:order-1 w-full sm:w-auto shrink-0 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>

                <div className="hidden sm:block sm:order-2 sm:flex-1" />

                {isAssigned && (
                  <button
                    onClick={() => send("remove")}
                    disabled={submitting !== null || wouldDropLastRole}
                    className="order-2 sm:order-3 w-full sm:w-auto shrink-0 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-50"
                  >
                    {submitting === "remove" ? (
                      <Spinner className="w-4 h-4 shrink-0" />
                    ) : (
                      <svg
                        className="w-4 h-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20 12H4"
                        />
                      </svg>
                    )}
                    {submitting === "remove" ? "Sending…" : "Request to Remove"}
                  </button>
                )}

                <button
                  onClick={() => send("add")}
                  disabled={submitting !== null}
                  className="order-1 sm:order-4 w-full sm:w-auto shrink-0 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-orange-500"
                >
                  {submitting === "add" ? (
                    <Spinner className="w-4 h-4 shrink-0" />
                  ) : (
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  )}
                  {submitting === "add" ? "Sending…" : "Request to Add"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AccessRow({
  method,
  path,
  description,
}: {
  method: string;
  path: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
          method === "GET"
            ? "bg-emerald-100 text-emerald-700"
            : method === "POST"
              ? "bg-blue-100 text-blue-700"
              : "bg-orange-100 text-orange-700"
        }`}
      >
        {method}
      </span>
      <code className="text-xs font-mono text-gray-700 flex-1 break-all">
        {path}
      </code>
      <span className="text-[11px] text-gray-400 hidden sm:block">
        {description}
      </span>
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ""}`}
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
  );
}
