import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { governanceApi } from "../../../lib/api";
import type { GovernanceAuditEntry, PageResponse } from "../../../lib/types";
import { ACTION_THEME } from "../user-management/roleTheme";

const PAGE_SIZE = 20;

const OUTCOME_STYLE: Record<string, string> = {
  INITIATED: "bg-sky-50 text-sky-600 border-sky-100",
  APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-100",
  REJECTED: "bg-rose-50 text-rose-600 border-rose-100",
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Every governance action this platform has seen: who initiated it, who decided it, in
 * which role, and why. Append-only on the server - the page only reads.
 */
export default function GovernanceAuditPanel() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<GovernanceAuditEntry> | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (pageNumber: number) => {
    setStatus("loading");
    setError(null);
    try {
      setData(await governanceApi.getAudit({ page: pageNumber, size: PAGE_SIZE }));
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the audit trail");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [page, load]);

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = filter.trim().toLowerCase();
    if (!needle) return data.content;
    return data.content.filter((entry) =>
      [entry.summary, entry.actionType, entry.actorName ?? "", entry.actorEmail ?? "", entry.actorRole ?? "", entry.comment ?? "", entry.outcome]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [data, filter]);

  if (status === "loading") {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-12 rounded-xl bg-gray-50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
        <p className="text-sm text-red-500 mb-3">{error}</p>
        <button
          type="button"
          onClick={() => void load(page)}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Governance actions</h2>
            <p className="text-xs text-gray-400">
              Initiation, approval and rejection of every maker-checker request
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by action, actor or comment…"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
          />
        </div>
      </div>

      {rows.length === 0 && (
        <div className="py-14 text-center text-sm text-gray-400">
          {data && data.totalElements === 0
            ? "No governance actions recorded yet."
            : `Nothing matches “${filter.trim()}”.`}
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr className="text-[11px] text-gray-400 border-b border-gray-100 bg-gray-50/60">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">When</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Action</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Summary</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Actor</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => {
                const theme =
                  (entry.actionType as keyof typeof ACTION_THEME) in ACTION_THEME
                    ? ACTION_THEME[entry.actionType as keyof typeof ACTION_THEME]
                    : null;
                const expanded = expandedId === entry.id;
                return (
                  <Fragment key={entry.id}>
                    <tr
                      onClick={() => setExpandedId(expanded ? null : entry.id)}
                      className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatWhen(entry.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${theme?.chip ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                          {theme?.label ?? entry.actionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 max-w-md">
                        <span className="line-clamp-2">{entry.summary}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs font-medium text-gray-700">{entry.actorName ?? "—"}</p>
                        <p className="text-[10px] text-gray-400">{entry.actorRole ?? "—"}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${OUTCOME_STYLE[entry.outcome] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                          {entry.outcome}
                        </span>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-gray-50/70 border-b border-gray-50">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Target</p>
                              <p className="text-xs text-gray-600">{entry.targetLabel ?? "—"}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{entry.actorEmail}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Comment</p>
                              <p className="text-xs text-gray-600 leading-relaxed">{entry.comment ?? "No comment given"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Payload</p>
                              <pre className="text-[10px] font-mono text-gray-500 bg-white border border-gray-100 rounded-lg p-2.5 max-h-40 overflow-auto whitespace-pre-wrap break-all">
                                {entry.detail ? JSON.stringify(JSON.parse(entry.detail), null, 2) : "—"}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Page {data.number + 1} of {Math.max(data.totalPages, 1)} · {data.totalElements} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={data.first}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
