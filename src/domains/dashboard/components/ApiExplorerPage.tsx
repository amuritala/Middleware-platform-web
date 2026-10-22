import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { apiCatalog, operationsForRole, type ApiDefinition } from "../../../lib/apiCatalog";
import { getValidAccessToken } from "../../../lib/auth";
import { useAuth } from "../../../lib/useAuth";

const API_SERVICE_BASE_URL =
  import.meta.env.VITE_API_SERVICE?.trim() ||
  (typeof window === "undefined"
    ? "/consolidated/api"
    : `${window.location.protocol}//${window.location.hostname}:8082/api`);

interface ExecutionResult {
  status: number;
  durationMs: number;
  body: unknown;
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function requestUrl(operation: ApiDefinition): string {
  const baseUrl = API_SERVICE_BASE_URL.replace(/\/+$/, "");
  const path =
    baseUrl.endsWith("/api") && operation.path.startsWith("/api/")
      ? operation.path.slice(4)
      : operation.path;
  return `${baseUrl}${path}`;
}

export default function ApiExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { claims } = useAuth();
  const roleFilter = searchParams.get("role");
  const operations = roleFilter ? operationsForRole(roleFilter) : apiCatalog;
  const requestedEndpoint = searchParams.get("endpoint");
  const selectedOperation =
    operations.find((operation) => operation.id === requestedEndpoint) ??
    operations[0];
  const [filter, setFilter] = useState("");
  const [requestBody, setRequestBody] = useState(() =>
    selectedOperation?.requestExample
      ? formatJson(selectedOperation.requestExample)
      : "",
  );
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const currentRoles = new Set(claims?.realm_access?.roles ?? []);

  const visibleOperations = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return operations;
    return operations.filter((operation) =>
      [
        operation.name,
        operation.path,
        operation.role,
        operation.group,
        operation.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [filter, operations]);

  const selectOperation = (operation: ApiDefinition) => {
    const next = new URLSearchParams(searchParams);
    next.set("endpoint", operation.id);
    setSearchParams(next);
    setRequestBody(
      operation.requestExample ? formatJson(operation.requestExample) : "",
    );
    setResult(null);
    setRequestError(null);
  };

  const execute = async () => {
    if (!selectedOperation) return;
    const token = await getValidAccessToken();
    if (!token) {
      setRequestError("Your sign-in has expired. Sign in again to test this API.");
      return;
    }

    let parsedBody: unknown;
    if (selectedOperation.method !== "GET") {
      try {
        parsedBody = JSON.parse(requestBody);
      } catch {
        setRequestError("Request body is not valid JSON.");
        return;
      }
    }

    if (
      selectedOperation.mutatesData &&
      !window.confirm(
        "This operation may create or change banking data. Execute it against the configured service?",
      )
    ) {
      return;
    }

    setRunning(true);
    setRequestError(null);
    setResult(null);
    const startedAt = performance.now();
    try {
      const response = await fetch(requestUrl(selectedOperation), {
        method: selectedOperation.method,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...(selectedOperation.method === "GET"
            ? {}
            : { "Content-Type": "application/json" }),
        },
        ...(selectedOperation.method === "GET"
          ? {}
          : { body: JSON.stringify(parsedBody) }),
      });
      const responseText = await response.text();
      let body: unknown = responseText;
      if (responseText) {
        try {
          body = JSON.parse(responseText);
        } catch {
          // Keep plain-text responses visible in the response panel.
        }
      } else {
        body = null;
      }
      setResult({
        status: response.status,
        durationMs: Math.round(performance.now() - startedAt),
        body,
      });
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? `${error.message}. Check the API base URL and browser CORS configuration.`
          : "The request could not be completed.",
      );
    } finally {
      setRunning(false);
    }
  };

  const canExecute =
    !!selectedOperation &&
    currentRoles.has("ROLE_CLIENT") &&
    currentRoles.has(selectedOperation.role);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav portal="vendor" />
      <Sidebar />
      <main className="ml-20 px-6 pb-10 pt-24">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
            Developer tools
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            API Explorer
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-500">
            Browse consolidated-service endpoints, inspect JSON examples, and
            send requests using your signed-in access token. The login endpoint
            is intentionally not listed here.
          </p>
        </div>

        {operations.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            No documented endpoint is linked to role{" "}
            <code className="font-mono">{roleFilter}</code>.
            <a href="/api-docs" className="ml-2 font-semibold underline">
              Browse all APIs
            </a>
          </div>
        ) : (
          <div className="grid min-h-[680px] grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-4">
                <label htmlFor="api-search" className="sr-only">
                  Search endpoints
                </label>
                <input
                  id="api-search"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Search endpoints..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                {roleFilter && (
                  <a
                    href="/api-docs"
                    className="mt-3 inline-block text-xs font-medium text-orange-600 hover:underline"
                  >
                    Clear role filter
                  </a>
                )}
              </div>
              <nav className="max-h-[620px] overflow-y-auto p-2" aria-label="API endpoints">
                {visibleOperations.map((operation) => {
                  const active = operation.id === selectedOperation?.id;
                  return (
                    <button
                      key={operation.id}
                      type="button"
                      onClick={() => selectOperation(operation)}
                      className={`mb-1 w-full rounded-xl p-3 text-left transition-colors ${
                        active
                          ? "bg-orange-50 ring-1 ring-orange-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                            operation.method === "GET"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {operation.method}
                        </span>
                        <span className="truncate text-sm font-semibold text-gray-800">
                          {operation.name}
                        </span>
                      </span>
                      <code className="mt-1.5 block truncate text-[10px] text-gray-400">
                        {operation.path}
                      </code>
                    </button>
                  );
                })}
                {visibleOperations.length === 0 && (
                  <p className="px-3 py-8 text-center text-sm text-gray-400">
                    No endpoints match this search.
                  </p>
                )}
              </nav>
            </aside>

            {selectedOperation ? (
              <section className="min-w-0 space-y-5">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-1 font-mono text-xs font-bold ${
                        selectedOperation.method === "GET"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {selectedOperation.method}
                    </span>
                    <code className="break-all text-sm font-semibold text-gray-800">
                      {selectedOperation.path}
                    </code>
                    <span className="ml-auto rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                      {selectedOperation.group}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-gray-900">
                    {selectedOperation.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedOperation.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      Required role:{" "}
                      <code className="font-mono font-semibold">
                        ROLE_CLIENT + {selectedOperation.role}
                      </code>
                    </span>
                    <span className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      Auth: Bearer token from current session
                    </span>
                  </div>
                  {selectedOperation.mutatesData && (
                    <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                      This operation can create or modify banking data. Use
                      sample values only in a safe test environment; execution
                      asks for confirmation.
                    </p>
                  )}
                  <div className="mt-4 rounded-xl bg-gray-950 px-4 py-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Request URL
                    </p>
                    <code className="break-all text-xs text-emerald-300">
                      {requestUrl(selectedOperation)}
                    </code>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Request body
                        </h3>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          Edit the JSON before executing.
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">
                        application/json
                      </span>
                    </div>
                    {selectedOperation.method === "GET" ? (
                      <div className="p-5 text-sm text-gray-500">
                        This GET endpoint does not require a request body.
                      </div>
                    ) : (
                      <textarea
                        aria-label="Editable request JSON"
                        spellCheck={false}
                        value={requestBody}
                        onChange={(event) => setRequestBody(event.target.value)}
                        className="min-h-[300px] w-full resize-y bg-gray-950 p-4 font-mono text-xs leading-5 text-emerald-200 outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400"
                      />
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
                      <p className="text-[11px] text-gray-400">
                        {canExecute
                          ? "Endpoint role is present in your access token."
                          : `Requires assigned role ${selectedOperation.role}.`}
                      </p>
                      <button
                        type="button"
                        onClick={() => void execute()}
                        disabled={running || !canExecute}
                        className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {running ? "Sending…" : "Execute request"}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Response
                        </h3>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {result
                            ? `HTTP ${result.status} · ${result.durationMs} ms`
                            : "Example response shape"}
                        </p>
                      </div>
                      {result && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            result.status >= 200 && result.status < 300
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {result.status >= 200 && result.status < 300
                            ? "SUCCESS"
                            : "ERROR"}
                        </span>
                      )}
                    </div>
                    {requestError ? (
                      <pre
                        role="alert"
                        className="min-h-[300px] whitespace-pre-wrap break-words bg-red-50 p-4 font-mono text-xs leading-5 text-red-700"
                      >
                        {requestError}
                      </pre>
                    ) : (
                      <pre className="min-h-[300px] overflow-auto whitespace-pre-wrap break-words bg-gray-950 p-4 font-mono text-xs leading-5 text-sky-200">
                        {formatJson(
                          result
                            ? result.body
                            : selectedOperation.responseExample,
                        )}
                      </pre>
                    )}
                    <div className="border-t border-gray-100 px-4 py-3">
                      <p className="text-[11px] leading-relaxed text-gray-400">
                        {selectedOperation.responseNote ??
                          "Example only. FCUBS response body fields vary with the downstream result; the response above shows the representative structure."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-500">
                Select an endpoint to view its request and response examples.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
