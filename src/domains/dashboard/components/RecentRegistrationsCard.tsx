import { useState } from "react";
import { usePendingClients } from "../../../lib/useClients";
import ClientDetailModal from "./ClientDetailModal";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecentRegistrationsCard() {
  const { clients, status, error, approve, reject } = usePendingClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const handleApprove = async (clientId: string, roles: string[] = []) => {
    try {
      await approve(clientId, roles);
    } catch {
      // error handled silently for now
    }
  };

  const handleReject = async (clientId: string) => {
    try {
      await reject(clientId);
    } catch {
      // error handled silently for now
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Recent Registrations Awaiting Approval
              </h3>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {clients.length} New Requests
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {clients.length} pending company verification reviews
            </p>
          </div>
        </div>
      </div>

      {status === "loading" && (
        <div className="py-8 text-center text-sm text-gray-400">
          Loading registrations…
        </div>
      )}

      {status === "error" && (
        <div className="py-8 text-center text-sm text-red-500">
          {error || "Failed to load registrations"}
        </div>
      )}

      {status === "success" && clients.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-400">
          No pending registrations
        </div>
      )}

      {status === "success" && clients.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">COMPANY</th>
                <th className="pb-3 font-medium">SUBMITTED</th>
                <th className="pb-3 font-medium">INDUSTRY</th>
                <th className="pb-3 font-medium">CONTACT</th>
                <th className="pb-3 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                        {getInitials(client.companyName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {client.companyName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {client.country || "—"} ·{" "}
                          {client.registrationNumber || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="text-sm text-gray-900">
                      {client.createdAt ? formatDate(client.createdAt) : "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {client.createdAt ? formatTime(client.createdAt) : "—"}
                    </p>
                  </td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-50 text-orange-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      {client.industry || "Pending"}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-gray-600">
                      {client.contactFirstName} {client.contactLastName}
                    </span>
                  </td>
                  <td className="py-4">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedClientId(client.id)}
                        className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleApprove(client.id)}
                        className="px-4 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(client.id)}
                        className="px-4 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedClientId && (
        <ClientDetailModal
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
