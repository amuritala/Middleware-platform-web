import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { adminApi, ApiError } from "../../../lib/api";
import type { AdminUserResponse } from "../../../lib/types";
import { describeRoleName } from "../../../lib/serviceCatalog";

type Status = "loading" | "success" | "error";

/** Roles that may never be granted or revoked through this screen. */
const PROTECTED_ROLES = new Set(["ROLE_ADMIN", "ROLE_CLIENT"]);

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async (search: string) => {
    setStatus("loading");
    setError(null);
    try {
      setUsers(await adminApi.getUsers(search.trim() || undefined));
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users");
      setStatus("error");
    }
  }, []);

  // Debounced search - the endpoint matches on username, email and name.
  useEffect(() => {
    const timer = setTimeout(() => void load(query), 300);
    return () => clearTimeout(timer);
  }, [query, load]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="ml-20 p-6">
        <TopNav portal="admin" />

        <div className="mb-6 mt-20 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500 mt-1">
              Search Keycloak accounts and grant or revoke their service roles
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username, email or name…"
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">
              {query ? `Results for “${query}”` : "All users"}
            </h2>
            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
              {status === "success" ? users.length : "—"}
            </span>
          </div>

          {status === "loading" && (
            <div className="py-10 text-center text-sm text-gray-400">
              Loading users…
            </div>
          )}

          {status === "error" && (
            <div className="py-10 text-center">
              <p className="text-sm text-red-500 mb-3">
                {error || "Failed to load users"}
              </p>
              <button
                onClick={() => void load(query)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {status === "success" && users.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              No users match that search.
            </div>
          )}

          {status === "success" && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="py-3 pr-4 font-medium">User</th>
                    <th className="py-3 pr-4 font-medium">Email</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Roles</th>
                    <th className="py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.keycloakUserId}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-orange-50 rounded-full flex items-center justify-center text-xs font-bold text-orange-600 flex-shrink-0">
                            {initials(user)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.firstName
                                ? `${user.firstName} ${user.lastName}`.trim()
                                : user.username}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {user.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            user.enabled
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.enabled ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                          />
                          {user.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {user.roles.length === 0 ? (
                            <span className="text-xs text-gray-400">
                              No roles
                            </span>
                          ) : (
                            user.roles.map((role) => (
                              <span
                                key={role}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                  PROTECTED_ROLES.has(role)
                                    ? "bg-gray-50 text-gray-400 border-gray-100"
                                    : "bg-orange-50 text-orange-600 border-orange-100"
                                }`}
                              >
                                {role}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedId(user.keycloakUserId)}
                          className="px-3.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedId && (
        <UserDetailModal
          userId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={(updated) =>
            setUsers((prev) =>
              prev.map((u) =>
                u.keycloakUserId === updated.keycloakUserId ? updated : u,
              ),
            )
          }
        />
      )}
    </div>
  );
}

/* ─── Detail / role management ──────────────────────────────────── */

function UserDetailModal({
  userId,
  onClose,
  onChanged,
}: {
  userId: string;
  onClose: () => void;
  onChanged: (user: AdminUserResponse) => void;
}) {
  const [user, setUser] = useState<AdminUserResponse | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** The ticked service roles - applied in one diff when the admin presses Apply. */
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roleQuery, setRoleQuery] = useState("");

  // Re-seed the checkboxes whenever a different user is opened or their roles change.
  useEffect(() => {
    if (user) setSelectedRoles(user.roles.filter((r) => !PROTECTED_ROLES.has(r)));
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([adminApi.getUser(userId), adminApi.getRoles()])
      .then(([u, roles]) => {
        if (cancelled) return;
        setUser(u);
        setAvailableRoles(roles);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Could not load this user",
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const run = async (action: () => Promise<AdminUserResponse>) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await action();
      setUser(updated);
      onChanged(updated);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `${err.message} (${err.status})`
          : err instanceof Error
            ? err.message
            : "That change could not be saved",
      );
    } finally {
      setBusy(false);
    }
  };

  const assigned = user?.roles ?? [];
  const heldServiceRoles = assigned.filter((r) => !PROTECTED_ROLES.has(r));

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

  const grant = selectedRoles.filter((r) => !heldServiceRoles.includes(r));
  const revoke = heldServiceRoles.filter((r) => !selectedRoles.includes(r));
  const hasChanges = grant.length > 0 || revoke.length > 0;

  const applyRoleChanges = async () => {
    if (!user || !hasChanges) return;
    setBusy(true);
    setError(null);
    try {
      let updated = user;
      if (revoke.length > 0) {
        updated = await adminApi.unassignRoles(user.keycloakUserId, revoke);
      }
      if (grant.length > 0) {
        updated = await adminApi.assignRoles(user.keycloakUserId, grant);
      }
      setUser(updated);
      onChanged(updated);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `${err.message} (${err.status})`
          : err instanceof Error
            ? err.message
            : "That change could not be saved",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Manage user</h2>
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

        <div className="p-6 overflow-y-auto">
          {loading && (
            <div className="py-10 text-center text-sm text-gray-400">
              Loading user…
            </div>
          )}

          {error && !loading && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
              {error}
            </div>
          )}

          {user && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-sm font-bold text-orange-600">
                  {initials(user)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.firstName
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : user.username}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* Account switches */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Account
                </h4>
                <div className="space-y-2">
                  <Toggle
                    label="Sign-in enabled"
                    hint="Turning this off blocks the user from signing in without deleting the account."
                    checked={user.enabled}
                    busy={busy}
                    onChange={(next) =>
                      void run(() =>
                        adminApi.updateUser(user.keycloakUserId, {
                          enabled: next,
                        }),
                      )
                    }
                  />
                  <Toggle
                    label="Email verified"
                    hint="Marks the email address as confirmed with Keycloak."
                    checked={user.emailVerified}
                    busy={busy}
                    onChange={(next) =>
                      void run(() =>
                        adminApi.updateUser(user.keycloakUserId, {
                          emailVerified: next,
                        }),
                      )
                    }
                  />
                </div>
              </div>

              {/* Roles - multi-select table with one Apply bar */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Service roles
                  </h4>
                  <span className="text-[11px] text-gray-400">
                    {selectedRoles.length} selected
                  </span>
                </div>

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

                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  {/* Header with select-all */}
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <input
                      type="checkbox"
                      checked={
                        filteredRoles.length > 0 &&
                        filteredRoles.every((r) => selectedRoles.includes(r))
                      }
                      ref={(el) => {
                        if (el)
                          el.indeterminate =
                            filteredRoles.length > 0 &&
                            !filteredRoles.every((r) => selectedRoles.includes(r)) &&
                            filteredRoles.some((r) => selectedRoles.includes(r));
                      }}
                      disabled={busy}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoles((prev) => [
                            ...new Set([...prev, ...filteredRoles]),
                          ]);
                        } else {
                          setSelectedRoles((prev) =>
                            prev.filter((r) => !filteredRoles.includes(r)),
                          );
                        }
                      }}
                      className="w-4 h-4 accent-orange-500 cursor-pointer disabled:opacity-40 rounded"
                      aria-label="Select all roles"
                    />
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Service
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {filteredRoles.map((role) => {
                      const info = describeRoleName(role);
                      const isProtected = PROTECTED_ROLES.has(role);
                      const checked = selectedRoles.includes(role) || isProtected;
                      return (
                        <label
                          key={role}
                          className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                            isProtected
                              ? "cursor-default opacity-70"
                              : "cursor-pointer hover:bg-orange-50/40"
                          } ${checked && !isProtected ? "bg-orange-50/60" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={busy || isProtected}
                            onChange={() =>
                              setSelectedRoles((prev) =>
                                prev.includes(role)
                                  ? prev.filter((r) => r !== role)
                                  : [...prev, role],
                              )
                            }
                            className="w-4 h-4 accent-orange-500 cursor-pointer disabled:opacity-40 rounded flex-shrink-0"
                            aria-label={info.displayName}
                          />
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

                {/* Protected roles stay listed but fixed */}
                {assigned.filter((r) => PROTECTED_ROLES.has(r)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {assigned
                      .filter((r) => PROTECTED_ROLES.has(r))
                      .map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono text-gray-500"
                        >
                          {role}
                          <span className="text-[9px] uppercase tracking-wide text-gray-400">
                            fixed
                          </span>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with the single Apply action */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-100">
          <div className="text-xs text-gray-500 min-w-0">
            {error ? (
              <span className="text-red-500">{error}</span>
            ) : hasChanges ? (
              <span className="flex flex-wrap items-center gap-2">
                {grant.length > 0 && (
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full font-semibold">
                    + {grant.length} to grant
                  </span>
                )}
                {revoke.length > 0 && (
                  <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-full font-semibold">
                    − {revoke.length} to revoke
                  </span>
                )}
              </span>
            ) : (
              <span className="text-gray-400">No pending role changes</span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => void applyRoleChanges()}
              disabled={busy || !hasChanges}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
            >
              {busy && (
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
              {busy ? "Applying…" : "Apply Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  busy,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  busy: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 p-3 bg-gray-50 rounded-xl cursor-pointer">
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        <span className="block text-xs text-gray-400 mt-0.5">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={busy}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${
          checked ? "bg-orange-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </label>
  );
}

function initials(user: AdminUserResponse) {
  const source =
    (user.firstName || user.lastName)
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.username;
  return source
    .split(/[\s._-]+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
