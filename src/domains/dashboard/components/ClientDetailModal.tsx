import { useEffect, useState } from "react";
import { adminApi, type ClientResponse } from "../../../lib/api";
import { describeRoleName } from "../../../lib/serviceCatalog";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ClientDetailModalProps {
  clientId: string;
  onClose: () => void;
  onApprove: (clientId: string, roles: string[]) => Promise<void>;
  onReject: (clientId: string) => Promise<void>;
  /** Suspend an approved / active client. Omit where the caller cannot suspend. */
  onSuspend?: (clientId: string) => Promise<void>;
  /** Reactivate a suspended or rejected client. */
  onActivate?: (clientId: string, roles: string[]) => Promise<void>;
}

export default function ClientDetailModal({
  clientId,
  onClose,
  onApprove,
  onReject,
  onSuspend,
  onActivate,
}: ClientDetailModalProps) {
  const [client, setClient] = useState<ClientResponse | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roleQuery, setRoleQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  /** Review mode unlocks the approve/reject footer; closed cards only offer Review. */
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setReviewing(false);
    setSelectedRoles([]);
    setActionError(null);

    adminApi
      .getClient(clientId)
      .then((data) => {
        if (!cancelled) {
          setClient(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load client",
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    let cancelled = false;
    setRolesLoading(true);

    adminApi
      .getRoles()
      .then((data) => {
        if (!cancelled) {
          setAvailableRoles(data);
          setRolesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableRoles([]);
          setRolesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const filteredRoles = availableRoles.filter((role) => {
    if (!roleQuery.trim()) return true;
    const needle = roleQuery.trim().toLowerCase();
    const info = describeRoleName(role);
    return (
      role.toLowerCase().includes(needle) ||
      info.displayName.toLowerCase().includes(needle) ||
      info.category.toLowerCase().includes(needle)
    );
  });

  const run = async (action: () => Promise<void>) => {
    setActing(true);
    setActionError(null);
    try {
      await action();
      onClose();
    } catch (err) {
      setActing(false);
      setActionError(
        err instanceof Error ? err.message : "The action could not be completed",
      );
    }
  };

  const canDecide = client?.status === "PENDING";
  const showDecisionButtons = reviewing && canDecide;
  const rolesSelected = selectedRoles.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Client Details
            </h2>
            {canDecide && !reviewing && (
              <p className="text-xs text-gray-400 mt-0.5">
                Review the registration before deciding
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
        </div>

        {/* Body */}
        <div className="p-6">
          {loading && (
            <div className="py-12 text-center text-sm text-gray-400">
              Loading client details…
            </div>
          )}

          {error && (
            <div className="py-12 text-center text-sm text-red-500">
              {error}
            </div>
          )}

          {client && (
            <div className="space-y-6">
              {/* Company header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-lg font-bold text-orange-600">
                  {getInitials(client.companyName)}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {client.companyName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {client.industry || "—"} · {client.country || "—"}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">
                  Status:
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-50 text-orange-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  {client.status}
                </span>
              </div>

              {/* Company info */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Company Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <DetailField
                    label="Registration Number"
                    value={client.registrationNumber}
                  />
                  <DetailField label="Tax ID" value={client.taxId} />
                  <DetailField
                    label="Company Address"
                    value={client.address || client.companyAddress}
                    span={2}
                  />
                  <DetailField label="Phone" value={client.phoneNumber} />
                  <DetailField label="Country" value={client.country} />
                </div>
              </div>

              {/* Contact info */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Contact Person
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <DetailField
                    label="Name"
                    value={`${client.contactFirstName} ${client.contactLastName}`}
                  />
                  <DetailField label="Email" value={client.contactEmail} />
                  <DetailField label="Phone" value={client.contactPhone} />
                  <DetailField
                    label="Users"
                    value={String(client.userCount ?? 0)}
                  />
                </div>
              </div>

              {/* Dates */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Timeline
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <DetailField
                    label="Registered"
                    value={formatDate(client.createdAt)}
                  />
                  <DetailField
                    label="Approved"
                    value={formatDate(client.approvedAt)}
                  />
                </div>
              </div>

              {/* Role assignment */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Assign Service Roles
                </h4>
                <p className="text-xs text-gray-400 mb-3">
                  {rolesLoading
                    ? "Loading roles…"
                    : canDecide
                      ? `${selectedRoles.length} selected — at least one role is required before approval.`
                      : "Read-only: roles are only assigned when the registration is approved."}
                  {" "}
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                    ROLE_CLIENT
                  </code>{" "}
                  is always assigned automatically.
                </p>

                {!rolesLoading && availableRoles.length > 0 && (
                  <div className="relative mb-3">
                    <svg
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                    <input
                      value={roleQuery}
                      onChange={(e) => setRoleQuery(e.target.value)}
                      placeholder="Filter roles…"
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
                    />
                  </div>
                )}

                {rolesLoading ? null : availableRoles.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    No additional roles available
                  </p>
                ) : (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    {/* Selectable table header with select-all for pending clients */}
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                      {canDecide && (
                        <input
                          type="checkbox"
                          checked={
                            filteredRoles.length > 0 &&
                            filteredRoles.every((r) =>
                              selectedRoles.includes(r),
                            )
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoles((prev) => [
                                ...new Set([...prev, ...filteredRoles]),
                              ]);
                            } else {
                              setSelectedRoles((prev) =>
                                prev.filter(
                                  (r) => !filteredRoles.includes(r),
                                ),
                              );
                            }
                          }}
                          className="w-4 h-4 accent-orange-500 cursor-pointer"
                          aria-label="Select all roles"
                        />
                      )}
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Service
                      </span>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                      {filteredRoles.map((role) => {
                        const info = describeRoleName(role);
                        const checked = selectedRoles.includes(role);
                        const disabled = !canDecide;
                        return (
                          <label
                            key={role}
                            className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                              disabled
                                ? "cursor-default"
                                : "cursor-pointer hover:bg-orange-50/40"
                            } ${checked ? "bg-orange-50/60" : ""}`}
                          >
                            {!disabled && (
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleRole(role)}
                                className="w-4 h-4 accent-orange-500 cursor-pointer"
                                aria-label={info.displayName}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {info.displayName}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">
                                {info.description}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-mono rounded border border-gray-100 flex-shrink-0 hidden sm:inline-block">
                              {info.category}
                            </span>
                          </label>
                        );
                      })}
                      {filteredRoles.length === 0 && (
                        <p className="px-4 py-6 text-center text-xs text-gray-400">
                          No roles match “{roleQuery}”
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {actionError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  {actionError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Closed card shows Review; review mode shows Approve / Reject / Close */}
        {client && (
          <div className="flex flex-wrap items-center justify-end gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
            {canDecide && !reviewing ? (
              <>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => setReviewing(true)}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Review
                </button>
              </>
            ) : showDecisionButtons ? (
              <>
                <button
                  onClick={() => {
                    setReviewing(false);
                    setSelectedRoles([]);
                  }}
                  disabled={acting}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={() => void run(() => onReject(client.id))}
                  disabled={acting}
                  className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {acting ? "Processing…" : "Reject"}
                </button>
                <button
                  onClick={() => void run(() => onApprove(client.id, selectedRoles))}
                  disabled={acting || !rolesSelected}
                  title={
                    rolesSelected
                      ? undefined
                      : "Select at least one service role to approve"
                  }
                  className="px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {acting ? "Processing…" : "Approve"}
                </button>
              </>
            ) : (
              /* Non-pending lifecycle actions */
              <>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>

                {(client.status === "APPROVED" || client.status === "ACTIVE") &&
                  onSuspend && (
                    <button
                      onClick={() => void run(() => onSuspend(client.id))}
                      disabled={acting}
                      className="px-5 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      {acting ? "Processing…" : "Suspend"}
                    </button>
                  )}

                {(client.status === "SUSPENDED" || client.status === "REJECTED") &&
                  onActivate && (
                    <button
                      onClick={() => void run(() => onActivate(client.id, selectedRoles))}
                      disabled={acting}
                      className="px-5 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      {acting
                        ? "Processing…"
                        : client.status === "REJECTED"
                          ? "Reinstate"
                          : "Activate"}
                    </button>
                  )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  span,
}: {
  label: string;
  value: string | null | undefined;
  span?: number;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
    </div>
  );
}
