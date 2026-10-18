import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import ClientDetailModal from "../components/ClientDetailModal";
import { adminApi, ApiError, type ClientResponse } from "../../../lib/api";
import { useClients } from "../../../lib/useClients";

type Filter = ClientResponse["status"] | "ALL";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "APPROVED", label: "Approved" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600 border-amber-100",
  APPROVED: "bg-blue-50 text-blue-600 border-blue-100",
  ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-100",
  SUSPENDED: "bg-red-50 text-red-600 border-red-100",
  REJECTED: "bg-gray-100 text-gray-500 border-gray-200",
  INACTIVE: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function ClientsPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // The hook loads every client once and filters in memory, so switching tabs is instant.
  const filterArg = filter === "ALL" ? undefined : filter;
  const { clients, status, error, refetch } = useClients(filterArg);

  const run = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
      await refetch();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `${err.message} (${err.status})`
          : err instanceof Error
            ? err.message
            : "The action failed";
      setActionError(message);
      // The modal keeps itself open when the caller throws, so the admin can retry.
      throw err;
    }
  };

  const approve = (clientId: string, roles: string[]) =>
    run(() => adminApi.approveClient(clientId, roles));

  const reject = (clientId: string) =>
    run(() => adminApi.rejectClient(clientId));

  const suspend = (clientId: string) =>
    run(() => adminApi.suspendClient(clientId));

  const activate = (clientId: string, roles: string[]) =>
    run(() => adminApi.activateClient(clientId, roles));

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="ml-20 p-6">
        <TopNav portal="admin" />

        <div className="mb-6 mt-20">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review onboarding applications and manage the lifecycle of every
            registered company
          </p>
        </div>

        {actionError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="flex-1 text-sm text-red-600">{actionError}</p>
            <button
              onClick={() => setActionError(null)}
              className="text-red-400 hover:text-red-600"
              aria-label="Dismiss"
            >
              <svg
                className="w-4 h-4"
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
        )}

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                filter === f.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">
              {FILTERS.find((f) => f.value === filter)?.label} clients
            </h2>
            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
              {status === "success" ? clients.length : "—"}
            </span>
          </div>

          {status === "loading" && (
            <div className="py-10 text-center text-sm text-gray-400">
              Loading clients…
            </div>
          )}

          {status === "error" && (
            <div className="py-10 text-center">
              <p className="text-sm text-red-500 mb-3">
                {error || "Failed to load clients"}
              </p>
              <button
                onClick={() => void refetch()}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {status === "success" && clients.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              No clients in this view.
            </div>
          )}

          {status === "success" && clients.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] table-fixed text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th
                      scope="col"
                      className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
                          />
                        </svg>
                        Company
                      </span>
                    </th>
                    <th
                      scope="col"
                      className="hidden md:table-cell w-44 px-3 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 003.182 0l4.318-4.318a2.25 2.25 0 000-3.182L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z"
                          />
                        </svg>
                        Industry
                      </span>
                    </th>
                    <th
                      scope="col"
                      className="w-32 px-3 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                          />
                        </svg>
                        Status
                      </span>
                    </th>
                    <th
                      scope="col"
                      className="hidden lg:table-cell w-28 px-3 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                          />
                        </svg>
                        Users
                      </span>
                    </th>
                    <th
                      scope="col"
                      className="hidden lg:table-cell w-32 px-3 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Registered
                      </span>
                    </th>
                    <th
                      scope="col"
                      className="w-20 pl-3 pr-5 py-3.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      <span className="sr-only">Details</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="pl-5 pr-3 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-[11px] font-bold text-gray-500 flex-shrink-0">
                            {client.companyName
                              .split(" ")
                              .map((w) => w[0])
                              .filter(Boolean)
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {client.companyName}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {client.contactEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 py-3.5">
                        <span className="text-xs text-gray-500 truncate block">
                          {client.industry || "—"}
                          {client.country && (
                            <span className="text-gray-400"> · {client.country}</span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                            STATUS_STYLES[client.status] ?? STATUS_STYLES.INACTIVE
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-3 py-3.5">
                        <span className="text-sm font-semibold text-gray-700">
                          {client.userCount ?? 0}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-3 py-3.5">
                        <span className="text-xs text-gray-400">
                          {client.createdAt ? formatDate(client.createdAt) : "—"}
                        </span>
                      </td>
                      <td className="pl-3 pr-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedId(client.id)}
                          className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
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
        <ClientDetailModal
          clientId={selectedId}
          onClose={() => setSelectedId(null)}
          onApprove={approve}
          onReject={reject}
          onSuspend={suspend}
          onActivate={activate}
        />
      )}
    </div>
  );
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
