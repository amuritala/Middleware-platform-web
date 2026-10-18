import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { adminApi } from "../../../lib/api";
import type { DownstreamAuditResponse, PageResponse } from "../../../lib/types";

type Status = "loading" | "success" | "error";

const PAGE_SIZE = 20;

export default function AuditPage() {
  const [page, setPage] = useState(0);
  const [data, setData] =
    useState<PageResponse<DownstreamAuditResponse> | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(async (pageNumber: number) => {
    setStatus("loading");
    setError(null);
    try {
      setData(
        await adminApi.getDownstreamAudit({
          page: pageNumber,
          size: PAGE_SIZE,
        }),
      );
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load the audit log",
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [page, load]);

  // Client-side filter over the current page - the endpoint has no server-side search.
  const visibleRows = useMemo(() => {
    if (!data) return [];
    const needle = filter.trim().toLowerCase();
    if (!needle) return data.content;
    return data.content.filter((record) => {
      const haystack = [
        record.userId,
        String(record.httpStatus),
        serviceOf(record),
        operationOf(record),
        summarize(record.request),
        record.request,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [data, filter]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="ml-20 p-6">
        <TopNav portal="admin" />

        <div className="mb-6 mt-20">
          <h1 className="text-3xl font-bold text-gray-900">Downstream DB</h1>
          <p className="text-sm text-gray-500 mt-1">
            Every call this service made to a downstream system on behalf of a
            user
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
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
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Audit records
                </h2>
                <p className="text-xs text-gray-400">
                  Click a row to inspect the request and response payloads
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter - narrows the current page across every rendered column */}
              <div className="relative w-full sm:w-72">
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
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter by service, operation, user…"
                  className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-colors"
                />
                {filter && (
                  <button
                    onClick={() => setFilter("")}
                    aria-label="Clear filter"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
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
                )}
              </div>

              {data && (
                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full whitespace-nowrap">
                  {filter
                    ? `${visibleRows.length} of ${data.content.length}`
                    : `${data.totalElements} records`}
                </span>
              )}
            </div>
          </div>

          {status === "loading" && (
            <div className="py-10 text-center text-sm text-gray-400">
              Loading audit records…
            </div>
          )}

          {status === "error" && (
            <div className="py-10 text-center">
              <p className="text-sm text-red-500 mb-3">
                {error || "Failed to load the audit log"}
              </p>
              <button
                onClick={() => void load(page)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {status === "success" &&
            data &&
            visibleRows.length === 0 &&
            data.content.length > 0 && (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-gray-700">
                  No records match “{filter}”
                </p>
                <button
                  onClick={() => setFilter("")}
                  className="mt-3 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Clear filter
                </button>
              </div>
            )}

          {status === "success" && data && data.content.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              No downstream calls have been recorded yet.
            </div>
          )}

          {status === "success" && data && visibleRows.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="py-3 pr-4 font-medium">Started</th>
                      <th className="py-3 pr-4 font-medium">Service</th>
                      <th className="py-3 pr-4 font-medium">Operation</th>
                      <th className="py-3 pr-4 font-medium">User</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 pr-4 font-medium">Duration</th>
                      <th className="py-3 font-medium">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((record) => {
                      const open = expandedId === record.id;
                      return (
                        <tr
                          key={record.id}
                          onClick={() => setExpandedId(open ? null : record.id)}
                          className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors cursor-pointer align-top"
                        >
                          <td className="py-3 pr-4 text-xs text-gray-600 whitespace-nowrap">
                            {formatDateTime(record.startTime)}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[11px] font-semibold">
                              {serviceOf(record)}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-xs font-medium text-gray-700">
                            {operationOf(record)}
                          </td>
                          <td className="py-3 pr-4 text-xs font-mono text-gray-600">
                            {record.userId || "—"}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                record.httpStatus >= 200 &&
                                record.httpStatus < 300
                                  ? "bg-emerald-50 text-emerald-600"
                                  : record.httpStatus >= 400 &&
                                      record.httpStatus < 500
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-red-50 text-red-600"
                              }`}
                            >
                              {record.httpStatus}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-xs text-gray-500 whitespace-nowrap">
                            {duration(record)}
                          </td>
                          <td className="py-3 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <svg
                                className={`w-3.5 h-3.5 text-gray-300 transition-transform ${
                                  open ? "rotate-90" : ""
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                              <span className="truncate max-w-xs">
                                {summarize(record.request)}
                              </span>
                            </div>

                            {open && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Payload
                                  label="Request"
                                  value={record.request}
                                />
                                <Payload
                                  label="Response"
                                  value={record.response}
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Page {data.number + 1} of {Math.max(data.totalPages, 1)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={data.first}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    disabled={data.last}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Payload({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <pre className="text-[11px] font-mono text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3 max-h-52 overflow-auto whitespace-pre-wrap break-all">
        {pretty(value)}
      </pre>
    </div>
  );
}

function pretty(raw: string): string {
  if (!raw) return "—";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function summarize(raw: string): string {
  if (!raw) return "No payload recorded";
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      const keys = Array.isArray(parsed)
        ? `${parsed.length} item(s)`
        : Object.keys(parsed).slice(0, 4).join(", ");
      return keys || "Empty payload";
    } catch {
      // fall through
    }
  }
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
}

function duration(record: DownstreamAuditResponse): string {
  const start = new Date(record.startTime).getTime();
  const end = new Date(record.endTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return "—";
  const ms = Math.max(0, end - start);
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** The downstream service a call targeted, derived from the request payload. */
function serviceOf(record: DownstreamAuditResponse): string {
  return /customer/i.test(record.request)
    ? "Customer Service"
    : "Account Service";
}

/** The operation performed - the orchestrator's `operation` field, falling back
 * to the request payload for records recorded before that column existed. */
function operationOf(record: DownstreamAuditResponse): string {
  if (record.operation) return record.operation;
  const raw = record.request.trim();
  if (!raw) return "—";
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const op =
        parsed.operation ??
        parsed.operationName ??
        parsed.action ??
        parsed.method;
      if (typeof op === "string" && op) return op;
    }
  } catch {
    // fall through to plain-text handling
  }
  return raw.length > 24 ? `${raw.slice(0, 24)}…` : raw || "—";
}
