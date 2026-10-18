import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClients } from "../../../lib/useClients";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ActiveCompaniesCard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "active">("all");

  // Every client, fetched once — the tabs filter in memory so switching is instant.
  const { clients, status, error } = useClients();

  const activeCount = clients.filter((c) => c.status === "ACTIVE").length;
  const shown = tab === "all" ? clients : clients.filter((c) => c.status === "ACTIVE");

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Active Companies
            </h3>
            <p className="text-xs text-gray-400">
              Enterprise corporate accounts
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/admin/clients")}
          className="text-sm text-orange-500 hover:text-orange-600 font-medium"
        >
          View Directory ({clients.length}) <span className="ml-1">&gt;</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {(
          [
            { key: "all", label: `All (${clients.length})` },
            { key: "active", label: `Active (${activeCount})` },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {status === "loading" && (
        <div className="py-8 text-center text-sm text-gray-400">
          Loading companies…
        </div>
      )}

      {status === "error" && (
        <div className="py-8 text-center text-sm text-red-500">
          {error || "Failed to load companies"}
        </div>
      )}

      {status === "success" && shown.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-400">
          {tab === "active" ? "No active companies" : "No companies yet"}
        </div>
      )}

      {status === "success" && shown.length > 0 && (
        <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
          {shown.slice(0, 8).map((client) => (
            <button
              key={client.id}
              onClick={() => navigate("/admin/clients")}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                  {getInitials(client.companyName)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {client.companyName}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        client.status === "ACTIVE"
                          ? "text-green-600 bg-green-50"
                          : client.status === "PENDING"
                            ? "text-amber-600 bg-amber-50"
                            : "text-gray-500 bg-gray-100"
                      }`}
                    >
                      {client.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {client.industry && `${client.industry} · `}
                    {client.country || "—"} · {client.registrationNumber || "—"}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-900">
                  {client.userCount ?? 0} users
                </p>
                <p className="text-xs text-gray-400">
                  {client.createdAt
                    ? new Date(client.createdAt).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
