import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { adminApi, ApiError } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import type { UserCreationRequestResponse } from "../../../lib/types";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-gray-100 text-gray-600",
};

function describe(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof Error ? err.message : fallback;
}

/** Queue of bank-user creation requests, bank users are decided by ROLE_AUTHORISE_USER_CREATION holders, clients by ROLE_AUTHORISE_REGISTRATION holders. */
export default function UserApprovalsPage() {
  const { claims } = useAuth();
  const roles = claims?.realm_access?.roles ?? [];
  const canDecideKind = (kind: string) =>
    roles.includes(
      kind === "CLIENT"
        ? "ROLE_AUTHORISE_REGISTRATION"
        : "ROLE_AUTHORISE_USER_CREATION",
    );
  const me = (claims?.email ?? claims?.preferred_username ?? "").toLowerCase();

  const [requests, setRequests] = useState<UserCreationRequestResponse[]>([]);
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible =
    filter === "PENDING" ? requests.filter((r) => r.status === "PENDING") : requests;
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRequests(await adminApi.getUserCreationRequests());
    } catch (err) {
      setError(describe(err, "Could not load requests"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    setError("");
    try {
      if (action === "approve") await adminApi.approveUserCreation(id);
      else await adminApi.rejectUserCreation(id);
      await load();
    } catch (err) {
      setError(describe(err, "The decision could not be saved"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-20 p-6">
        <TopNav portal="admin" />
        <div className="mb-6 mt-20">
          <h1 className="text-3xl font-bold text-gray-900">User Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Clients and bank users are created only after an authoriser approves the request.
            You cannot decide a request you submitted.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-4 flex gap-2">
          {(["PENDING", "ALL"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                filter === value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {value === "PENDING" ? `Pending (${pendingCount})` : "All requests"}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Requested by</th>
                <th className="p-4">Requested</th>
                <th className="p-4">Status</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td className="p-4 text-gray-500" colSpan={5}>
                    {filter === "PENDING" ? "No requests awaiting approval." : "No requests yet."}
                  </td>
                </tr>
              )}
              {visible.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="p-4">
                    <p className="font-medium text-gray-900">
                      {r.firstName} {r.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.kind === "CLIENT"
                        ? `Client · ${r.companyName ?? ""}`
                        : "Bank user"}{" "}
                      · {r.email}
                    </p>
                    {r.roles?.length > 0 && (
                      <p className="mt-0.5 font-mono text-[11px] text-gray-400">
                        {r.roles.join(", ")}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-gray-700">{r.requestedBy}</td>
                  <td className="p-4 text-gray-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[r.status]}`}
                    >
                      {r.status}
                    </span>
                    {r.reviewedBy && (
                      <p className="mt-1 text-xs text-gray-500">by {r.reviewedBy}</p>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {canDecideKind(r.kind) &&
                      r.status === "PENDING" &&
                      r.requestedBy.toLowerCase() !== me && (
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={busyId === r.id}
                            onClick={() => void decide(r.id, "approve")}
                            className="rounded-full bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            disabled={busyId === r.id}
                            onClick={() => void decide(r.id, "reject")}
                            className="rounded-full border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
