import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../lib/useAuth";
import ServiceDetailModal, {
  type RequestAvailability,
} from "./ServiceDetailModal";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import {
  useRoleApplications,
  pendingChangeForRole,
  SYSTEM_ROLES,
} from "../../../lib/useRoleApplications";
import {
  useServiceCatalog,
  serviceStyles,
  type ServiceInfo,
} from "../../../lib/serviceCatalog";
import type { RoleChangeApplicationResponse } from "../../../lib/types";

/* ─── Component ─────────────────────────────────────────────────── */

/** Rows per page in the All Platform Services table. */
const PAGE_SIZE = 8;

/** Rows per page in the Your Assigned Services table. */
const ASSIGNED_PAGE_SIZE = 5;

/** Little icons shown next to the table header labels. */
const HEADER_ICONS = {
  service:
    "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  category:
    "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 003.182 0l4.318-4.318a2.25 2.25 0 000-3.182L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z",
  access:
    "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
  status: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
} as const;

export default function ServicesPage() {
  const { isAuthenticated } = useAuth();
  const [viewingRole, setViewingRole] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  /** The complete set of service roles the vendor wants after the next approval. */
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  /** The All Platform Services table starts collapsed and can be drawn open. */
  const [allOpen, setAllOpen] = useState(false);
  /** Current page of the All Platform Services table (1-based). */
  const [page, setPage] = useState(1);
  /** Current page of the Your Assigned Services table (1-based). */
  const [assignedPage, setAssignedPage] = useState(1);
  /** Tracks the search/category key so a filter change resets the page (render-phase). */
  const [prevFilterKey, setPrevFilterKey] = useState("");
  /** Tracks the search key so a new search also restarts the assigned table. */
  const [prevAssignedKey, setPrevAssignedKey] = useState("");

  // A new search or category pick always restarts the list at page one.
  const filterKey = `${query}|${category}`;
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }
  // The assigned table only depends on the search, so only that resets it.
  if (prevAssignedKey !== query) {
    setPrevAssignedKey(query);
    setAssignedPage(1);
  }

  // The catalogue is read live from the backend, so a role added in Keycloak shows up here
  // without a frontend release.
  const {
    services: catalog,
    status: catalogStatus,
    error: catalogError,
    retry,
  } = useServiceCatalog();

  // Role updates appear in the access token after the user signs in again.
  const {
    roles: userRoles,
    pending,
    submit,
    decision,
    dismissDecision,
  } = useRoleApplications();

  const userRoleSet = useMemo(() => new Set(userRoles), [userRoles]);

  // The service roles the token currently carries (system roles are never requestable).
  const heldServiceRoles = useMemo(
    () =>
      catalog
        .map((s) => s.role)
        .filter((role) => userRoleSet.has(role) && !SYSTEM_ROLES.has(role)),
    [catalog, userRoleSet],
  );

  // The checkboxes only ever hold *newly requested* services — everything the
  // vendor already holds rides along automatically at submit time, and the rows
  // for held services are blocked (non-checkable) in the All Platform table.

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(catalog.map((s) => s.category))).sort()],
    [catalog],
  );

  // Search filters both sections; the category pills shape only the All
  // Platform Services table, as requested.
  const searchFiltered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return catalog;
    return catalog.filter(
      (service) =>
        service.displayName.toLowerCase().includes(needle) ||
        service.role.toLowerCase().includes(needle) ||
        service.description.toLowerCase().includes(needle),
    );
  }, [catalog, query]);

  const assignedServices = useMemo(
    () => searchFiltered.filter((s) => userRoleSet.has(s.role)),
    [searchFiltered, userRoleSet],
  );

  const allServices = useMemo(
    () =>
      category === "All"
        ? searchFiltered
        : searchFiltered.filter((s) => s.category === category),
    [searchFiltered, category],
  );

  // Pagination for the All Platform Services table.
  const totalPages = Math.max(1, Math.ceil(allServices.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedServices = useMemo(
    () =>
      allServices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [allServices, currentPage],
  );

  // Pagination for the Your Assigned Services table.
  const assignedTotalPages = Math.max(
    1,
    Math.ceil(assignedServices.length / ASSIGNED_PAGE_SIZE),
  );
  const assignedCurrentPage = Math.min(assignedPage, assignedTotalPages);
  const pagedAssignedServices = useMemo(
    () =>
      assignedServices.slice(
        (assignedCurrentPage - 1) * ASSIGNED_PAGE_SIZE,
        assignedCurrentPage * ASSIGNED_PAGE_SIZE,
      ),
    [assignedServices, assignedCurrentPage],
  );

  // Only vendor accounts may request service roles, and system roles are never requestable.
  const canRequestRoles = userRoleSet.has("ROLE_CLIENT");

  const availabilityFor = (role: string): RequestAvailability => {
    if (SYSTEM_ROLES.has(role)) {
      return {
        kind: "unavailable",
        reason:
          "This role is granted automatically with your account, so it can't be requested or removed.",
      };
    }
    if (!canRequestRoles) {
      return {
        kind: "unavailable",
        reason:
          "Only vendor accounts can request service roles. Ask an administrator to change the roles on this account.",
      };
    }
    if (pending) {
      return {
        kind: "awaiting-review",
        changeForThisRole: pendingChangeForRole(
          pending,
          role,
          userRoleSet.has(role),
        ),
        since: pending.createdAt,
      };
    }
    return { kind: "available" };
  };

  const toggleRole = (role: string) => {
    setJustSubmitted(false);
    setSubmitError(null);
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const toggleAllVisible = (checked: boolean) => {
    setJustSubmitted(false);
    setSubmitError(null);
    // "Select all" covers the selectable rows on the active page — already-held
    // services are blocked, so they are never swept into the selection.
    const heldSet = new Set(heldServiceRoles);
    const requestable = pagedServices
      .map((s) => s.role)
      .filter((role) => !SYSTEM_ROLES.has(role) && !heldSet.has(role));
    setSelectedRoles((prev) =>
      checked
        ? [...new Set([...prev, ...requestable])]
        : prev.filter((r) => !requestable.includes(r)),
    );
  };

  // What the request would add (there is no removal anymore — held services are
  // blocked in the table and always ride along at submit time).
  const diff = useMemo(() => {
    const held = new Set(heldServiceRoles);
    const adding = selectedRoles.filter((r) => !held.has(r));
    return { adding, removing: [] as string[] };
  }, [selectedRoles, heldServiceRoles]);

  const selectionChanged = diff.adding.length > 0;
  const canSubmit =
    canRequestRoles &&
    !pending &&
    !submitting &&
    selectionChanged &&
    selectedRoles.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Approving replaces the whole role set: everything already held rides
      // along untouched, plus the newly ticked services.
      await submit([...new Set([...heldServiceRoles, ...selectedRoles])]);
      setSelectedRoles([]);
      setJustSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "The request could not be sent",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const assignedCount = catalog.filter((s) => userRoleSet.has(s.role)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav portal="vendor" />

      <Sidebar />

      <div className="ml-20 pt-24 p-6">
        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Services</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage your platform services and role-based access
              </p>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-sm font-medium text-gray-700">
                {catalog.length} Services
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-gray-700">
                {assignedCount} Assigned
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-sm font-medium text-gray-700">
                {catalog.length - assignedCount} Available to Request
              </span>
            </div>
            {pending && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-medium text-amber-700">
                  1 Pending Review
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Outcome of the last request ── */}
        {decision && (
          <div
            className={`mb-8 flex items-start gap-4 rounded-2xl border p-5 ${
              decision.status === "APPROVED"
                ? "bg-emerald-50 border-emerald-100"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                decision.status === "APPROVED" ? "bg-emerald-100" : "bg-gray-200"
              }`}
            >
              {decision.status === "APPROVED" ? (
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
              ) : (
                <svg
                  className="w-5 h-5 text-gray-500"
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
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className={`text-sm font-semibold ${
                  decision.status === "APPROVED"
                    ? "text-emerald-900"
                    : "text-gray-900"
                }`}
              >
                {decision.status === "APPROVED"
                  ? "Your access has been updated"
                  : "Your request was declined"}
              </h3>
              <p
                className={`text-sm mt-1 leading-relaxed ${
                  decision.status === "APPROVED"
                    ? "text-emerald-700"
                    : "text-gray-500"
                }`}
              >
                {decision.status === "APPROVED"
                  ? `Your administrator approved ${formatRoles(decision.requestedRoles, catalog)}. Your new roles are active.`
                  : `Your administrator declined ${formatRoles(decision.requestedRoles, catalog)}. Your existing access is unchanged.`}
              </p>
            </div>

            <button
              onClick={dismissDecision}
              aria-label="Dismiss"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/70 transition-colors flex-shrink-0"
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

        {/* ── Search ── */}
        {catalogStatus === "success" && catalog.length > 0 && (
          <div className="mb-8">
            {/* Search — full width on mobile, capped once there is room */}
            <div className="relative w-full sm:max-w-md">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
                placeholder="Search by name, role or description…"
                className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
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
          </div>
        )}

        {/* ── Catalogue loading / error ── */}
        {catalogStatus === "loading" && (
          <div className="py-24">
            <LoadingSpinner />
          </div>
        )}

        {catalogStatus === "error" && (
          <div className="py-16 text-center">
            <p className="text-sm text-red-500 mb-4">
              {catalogError || "Could not load the service catalogue"}
            </p>
            <button
              onClick={() => void retry()}
              className="px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Section 1: Assigned services table ── */}
        {catalogStatus === "success" && assignedServices.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-emerald-600"
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
              <h2 className="text-lg font-semibold text-gray-900">
                Your Assigned Services
              </h2>
              <span className="ml-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">
                {assignedServices.length}
              </span>
            </div>

            <AssignedServicesTable
              services={pagedAssignedServices}
              pending={pending}
              onView={setViewingRole}
              pagination={{
                page: assignedCurrentPage,
                totalPages: assignedTotalPages,
                totalItems: assignedServices.length,
                onPage: setAssignedPage,
              }}
            />
          </section>
        )}

        {/* ── Section 2: All services — collapsible, filtered, paginated ── */}
        {catalogStatus === "success" && (
          <section className="mb-12">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                All Platform Services
              </h2>
              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full">
                {allServices.length}
              </span>
              {/* Collapse control sits on the section header itself. */}
              <button
                onClick={() => setAllOpen((v) => !v)}
                aria-expanded={allOpen}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-full hover:border-gray-300 hover:text-gray-700 transition-colors"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    allOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                {allOpen ? "Hide" : "Show"}
              </button>
            </div>

            {/* Category pills — scoped to this table only, immediately above it */}
            {allOpen && (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((c) => {
                    const count =
                      c === "All"
                        ? catalog.length
                        : catalog.filter((s) => s.category === c).length;
                    const active = category === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 active:scale-95 ${
                          active
                            ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                        }`}
                      >
                        {c}
                        <span
                          className={`px-1.5 py-px rounded-full text-[10px] font-semibold ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {allServices.length === 0 ? (
                  <div className="py-14 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-sm font-medium text-gray-700">
                      No services match “{query || category}”
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try another term, or clear the category filter.
                    </p>
                    <button
                      onClick={() => {
                        setQuery("");
                        setCategory("All");
                      }}
                      className="mt-4 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <ServiceRequestTable
                    services={pagedServices}
                    selectedRoles={selectedRoles}
                    heldServiceRoles={heldServiceRoles}
                    pending={pending}
                    canRequestRoles={canRequestRoles}
                    submitting={submitting}
                    submitError={submitError}
                    justSubmitted={justSubmitted}
                    selectionChanged={selectionChanged}
                    diff={diff}
                    onToggleRole={toggleRole}
                    onToggleAll={toggleAllVisible}
                    onSubmit={() => void handleSubmit()}
                    onView={setViewingRole}
                    pagination={{
                      page: currentPage,
                      totalPages,
                      totalItems: allServices.length,
                      onPage: setPage,
                    }}
                  />
                )}
              </>
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
          <p>
            Sky Bank Sierra Leone Limited · Authorized by Bank of Sierra Leone
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-600">
              API Documentation
            </a>
            <a href="#" className="hover:text-gray-600">
              Developer Sandbox
            </a>
            <a href="#" className="hover:text-gray-600">
              Security & Compliance
            </a>
          </div>
        </footer>
      </div>

      {/* ── Detail modal ── */}
      {viewingRole && (
        <ServiceDetailModal
          service={
            catalog.find((s) => s.role === viewingRole) ?? {
              role: viewingRole,
              displayName: viewingRole,
              description: "",
              category: "Services",
              color: "blue",
              gradient: "from-blue-500 to-cyan-400",
              icon: "",
              capabilities: [],
              accessLevel: "Standard",
            }
          }
          isAssigned={userRoleSet.has(viewingRole)}
          assignedRoles={userRoles}
          availability={availabilityFor(viewingRole)}
          onSubmit={submit}
          onClose={() => setViewingRole(null)}
        />
      )}
    </div>
  );
}

/* ─── Service request table ─────────────────────────────────────── */

interface ServiceRequestTableProps {
  services: ServiceInfo[];
  selectedRoles: string[];
  heldServiceRoles: string[];
  pending: RoleChangeApplicationResponse | null;
  canRequestRoles: boolean;
  submitting: boolean;
  submitError: string | null;
  justSubmitted: boolean;
  selectionChanged: boolean;
  diff: { adding: string[]; removing: string[] };
  onToggleRole: (role: string) => void;
  onToggleAll: (checked: boolean) => void;
  onSubmit: () => void;
  onView: (role: string) => void;
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
    onPage: (page: number) => void;
  };
}

function ServiceRequestTable({
  services,
  selectedRoles,
  heldServiceRoles,
  pending,
  canRequestRoles,
  submitting,
  submitError,
  justSubmitted,
  selectionChanged,
  diff,
  onToggleRole,
  onToggleAll,
  onSubmit,
  onView,
  pagination,
}: ServiceRequestTableProps) {
  const selected = useMemo(() => new Set(selectedRoles), [selectedRoles]);
  const held = useMemo(() => new Set(heldServiceRoles), [heldServiceRoles]);
  const lockSelection = !!pending || !canRequestRoles;
  /** Already-held services cannot be ticked at all. */
  const isSelectable = (role: string) =>
    !lockSelection && !SYSTEM_ROLES.has(role) && !held.has(role);
  /** The button enables when there is something to send: a changed, non-empty selection. */
  const tableCanSubmit =
    !lockSelection && !submitting && selectionChanged && selectedRoles.length > 0;

  const selectableRoles = services
    .map((s) => s.role)
    .filter((role) => isSelectable(role));
  const allVisibleSelected =
    selectableRoles.length > 0 &&
    selectableRoles.every((r) => selected.has(r));
  const someVisibleSelected = selectableRoles.some((r) => selected.has(r));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table — a real <table> so headers and cells share the same column grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th scope="col" className="w-12 pl-5 pr-0 py-3.5 align-middle">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el)
                      el.indeterminate =
                        !allVisibleSelected && someVisibleSelected;
                  }}
                  disabled={lockSelection}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 cursor-pointer disabled:opacity-40 rounded"
                  aria-label="Select all visible services"
                />
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
              >
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={HEADER_ICONS.service} />
                  </svg>
                  Service
                </span>
              </th>
              <th
                scope="col"
                className="hidden md:table-cell w-36 px-3 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
              >
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={HEADER_ICONS.category} />
                  </svg>
                  Category
                </span>
              </th>
              <th
                scope="col"
                className="hidden lg:table-cell w-28 px-3 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
              >
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={HEADER_ICONS.access} />
                  </svg>
                  Access
                </span>
              </th>
              <th
                scope="col"
                className="w-36 px-3 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
              >
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={HEADER_ICONS.status} />
                  </svg>
                  Status
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
            {services.map((service) => {
              const c = serviceStyles[service.color] ?? serviceStyles.blue;
              const isChecked = selected.has(service.role);
              const isHeld = held.has(service.role);
              const blocked = isHeld || SYSTEM_ROLES.has(service.role);
              const pendingChange = pendingChangeForRole(
                pending,
                service.role,
                isHeld,
              );
              return (
                <tr
                  key={service.role}
                  title={
                    isHeld
                      ? "Services already assigned to you"
                      : SYSTEM_ROLES.has(service.role)
                        ? "System roles are granted automatically and cannot be requested"
                        : undefined
                  }
                  className={`transition-colors ${
                    isHeld
                      ? "bg-gray-50/60" // blocked: muted row
                      : isChecked && !lockSelection
                        ? "bg-orange-50/40"
                        : "hover:bg-gray-50/70"
                  }`}
                >
                  <td className="pl-5 pr-0 py-3.5 align-middle">
                    {blocked ? (
                      /* Blocked checkbox: custom lock visual, never interactive */
                      <span
                        aria-hidden="true"
                        className="w-4 h-4 rounded border border-gray-200 bg-gray-100 flex items-center justify-center cursor-not-allowed"
                      >
                        <svg
                          className="w-2.5 h-2.5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                          />
                        </svg>
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={lockSelection}
                        onChange={() => onToggleRole(service.role)}
                        className="w-4 h-4 accent-orange-500 cursor-pointer disabled:opacity-40 rounded"
                        aria-label={`Select ${service.displayName}`}
                      />
                    )}
                  </td>

                  {/* Service identity */}
                  <td className="px-3 py-3.5 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 ${c.iconBg} rounded-lg flex items-center justify-center ring-1 ${c.ring} flex-shrink-0 ${
                          isHeld ? "opacity-50 grayscale" : ""
                        }`}
                      >
                        <svg
                          className={`w-5 h-5 ${c.iconText}`}
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
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isHeld ? "text-gray-500" : "text-gray-900"
                          }`}
                        >
                          {service.displayName}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono truncate">
                          {service.role}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="hidden md:table-cell px-3 py-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 ${c.badge} text-[10px] font-semibold uppercase tracking-wider rounded-md border`}
                    >
                      {service.category}
                    </span>
                  </td>

                  {/* Access level */}
                  <td className="hidden lg:table-cell px-3 py-3.5">
                    <span
                      className={`text-[11px] font-medium ${
                        service.accessLevel === "Read-only"
                          ? "text-sky-600"
                          : service.accessLevel === "Elevated"
                            ? "text-rose-500"
                            : "text-gray-500"
                      }`}
                    >
                      {service.accessLevel}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3.5">
                    {pendingChange ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-semibold rounded-full border border-amber-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {pendingChange === "remove"
                          ? "Removal pending"
                          : "Requested"}
                      </span>
                    ) : isHeld ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-semibold rounded-full border border-emerald-100">
                        <svg
                          className="w-3 h-3"
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
                        Assigned
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-semibold rounded-full border border-gray-100">
                        Available
                      </span>
                    )}
                  </td>

                  {/* Details */}
                  <td className="pl-3 pr-5 py-3.5 text-right">
                    <button
                      onClick={() => onView(service.role)}
                      className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <PaginationFooter
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={PAGE_SIZE}
        onPage={pagination.onPage}
      />

      {/* Request bar */}
      <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-4">
        {!canRequestRoles ? (
          <p className="text-sm text-gray-500">
            Only vendor accounts can request service roles. Ask an administrator
            to change the roles on this account.
          </p>
        ) : pending ? (
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
            <p className="text-sm text-amber-700">
              A request submitted {formatPendingSince(pending.createdAt)} is
              awaiting review — you can submit another once it is decided.
            </p>
          </div>
        ) : justSubmitted && !selectionChanged ? (
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-3.5 h-3.5 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p className="text-sm text-emerald-700 font-medium">
              Request sent — an administrator will review it shortly.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              {selectionChanged ? (
                <span className="flex flex-wrap items-center gap-2">
                  {diff.adding.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                      + {diff.adding.length} to add
                    </span>
                  )}
                  {diff.removing.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-600 text-xs font-semibold rounded-full border border-rose-100">
                      − {diff.removing.length} to remove
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {selectedRoles.length} of {services.length} selected
                  </span>
                </span>
              ) : (
                <span className="text-xs text-gray-400">
                  Tick the new services you want — everything you already hold
                  stays included automatically.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {submitError && (
                <p className="text-xs text-red-500 max-w-xs truncate" title={submitError}>
                  {submitError}
                </p>
              )}
              <button
                onClick={onSubmit}
                disabled={!tableCanSubmit}
                title={
                  selectedRoles.length === 0
                    ? "Select at least one service"
                    : !selectionChanged
                      ? "No changes from your current access"
                      : undefined
                }
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 flex items-center gap-2"
              >
                {submitting && (
                  <svg
                    className="w-4 h-4 animate-spin"
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
                )}
                {submitting
                  ? "Sending…"
                  : selectionChanged
                    ? `Request ${diff.adding.length + diff.removing.length} change${diff.adding.length + diff.removing.length === 1 ? "" : "s"}`
                    : "Request Services"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatPendingSince(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── Sub-components ────────────────────────────────────────────── */

/** Compact read-only table of the services the vendor currently holds. */
function AssignedServicesTable({
  services,
  pending,
  onView,
  pagination,
}: {
  services: ServiceInfo[];
  pending: RoleChangeApplicationResponse | null;
  onView: (role: string) => void;
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
    onPage: (page: number) => void;
  };
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] table-fixed text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th
                scope="col"
                className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
              >
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={HEADER_ICONS.service} />
                  </svg>
                  Service
                </span>
              </th>
              <th
                scope="col"
                className="hidden sm:table-cell w-36 px-3 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
              >
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={HEADER_ICONS.category} />
                  </svg>
                  Category
                </span>
              </th>
              <th
                scope="col"
                className="w-36 px-3 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
              >
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={HEADER_ICONS.status} />
                  </svg>
                  Status
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
            {services.map((service) => {
              const c = serviceStyles[service.color] ?? serviceStyles.blue;
              const pendingChange = pendingChangeForRole(pending, service.role, true);
              return (
                <tr key={service.role} className="hover:bg-gray-50/70 transition-colors">
                  <td className="pl-5 pr-3 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 ${c.iconBg} rounded-lg flex items-center justify-center ring-1 ${c.ring} flex-shrink-0`}
                      >
                        <svg
                          className={`w-5 h-5 ${c.iconText}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d={service.icon} />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {service.displayName}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono truncate">
                          {service.role}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-3 py-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 ${c.badge} text-[10px] font-semibold uppercase tracking-wider rounded-md border`}
                    >
                      {service.category}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    {pendingChange ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-semibold rounded-full border border-amber-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {pendingChange === "remove" ? "Removal pending" : "Change pending"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-semibold rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="pl-3 pr-5 py-3.5 text-right">
                    <button
                      onClick={() => onView(service.role)}
                      className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination footer — same style as the All Platform Services table */}
      <PaginationFooter
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={ASSIGNED_PAGE_SIZE}
        onPage={pagination.onPage}
      />
    </div>
  );
}

/** Shared pagination footer: “Page X of Y” + prev/next. */
function PaginationFooter({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPage,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
      <p className="text-xs text-gray-500">
        Showing <span className="font-semibold text-gray-700">{from}</span>–
        <span className="font-semibold text-gray-700">{to}</span> of{" "}
        <span className="font-semibold text-gray-700">{totalItems}</span> services
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            aria-current={p === page ? "page" : undefined}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
              p === page
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function formatRoles(roles: string[], catalog: ServiceInfo[]): string {
  const names = roles.map(
    (role) => catalog.find((s) => s.role === role)?.displayName ?? role,
  );
  if (names.length === 0) return "your requested services";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function LoadingSpinner() {
  return (
    <div className="text-center">
      <div className="relative inline-block mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 bg-orange-500/20 blur-xl rounded-2xl animate-ping" />
      </div>
      <p className="text-gray-500 text-sm font-medium tracking-wider uppercase">
        Loading services…
      </p>
      <div className="mt-4 w-40 h-1 bg-gray-200 rounded-full overflow-hidden mx-auto">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full animate-shimmer"
          style={{ width: "40%" }}
        />
      </div>
    </div>
  );
}
