import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { getDisplayName } from "../../../lib/user";
import { useServiceCatalog } from "../../../lib/serviceCatalog";
import { useRoleApplications } from "../../../lib/useRoleApplications";

export default function VendorDashboard() {
  const displayName = getDisplayName();
  const { services, status: catalogStatus } = useServiceCatalog();
  const {
    roles,
    pending,
    applications,
    status: applicationsStatus,
  } = useRoleApplications();

  const roleSet = new Set(roles);
  const assigned = services.filter((s) => roleSet.has(s.role));
  const approvedCount = applications.filter(
    (a) => a.status === "APPROVED",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <Sidebar />

      <div className="ml-20 pt-24 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome Back, {displayName} !
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Vendor Operations & API Services Hub
            </p>
          </div>
        </div>

        {/* Summary - everything here is read live from the backend and your token */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 tracking-wide">
                ASSIGNED SERVICES
              </p>
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-orange-500"
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
            </div>
            <span className="text-3xl font-bold text-gray-900">
              {catalogStatus === "success" ? assigned.length : "—"}
            </span>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                of {catalogStatus === "success" ? services.length : "—"} on the
                platform
              </span>
              <a
                href="/services"
                className="text-xs font-semibold text-orange-500 hover:text-orange-600"
              >
                Browse →
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 tracking-wide">
                PENDING REQUESTS
              </p>
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <span className="text-3xl font-bold text-gray-900">
              {applicationsStatus === "success" ? (pending ? 1 : 0) : "—"}
            </span>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {pending
                  ? "Awaiting administrator review"
                  : "Nothing awaiting review"}
              </span>
              <a
                href="/services"
                className="text-xs font-semibold text-orange-500 hover:text-orange-600"
              >
                Request →
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 tracking-wide">
                REQUESTS APPROVED
              </p>
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <span className="text-3xl font-bold text-gray-900">
              {applicationsStatus === "success" ? approvedCount : "—"}
            </span>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Lifetime role approvals
              </span>
            </div>
          </div>
        </div>

        {/* Assigned services */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Your Assigned Services
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                The service roles your access token currently carries
              </p>
            </div>
            <a
              href="/services"
              className="px-4 py-2 text-xs font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors"
            >
              Manage Services
            </a>
          </div>

          {catalogStatus === "loading" && (
            <p className="py-6 text-center text-sm text-gray-400">
              Loading services…
            </p>
          )}

          {catalogStatus === "error" && (
            <p className="py-6 text-center text-sm text-red-500">
              Could not load the service catalogue
            </p>
          )}

          {catalogStatus === "success" &&
            (assigned.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-gray-700">
                  No services assigned yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Browse the services page to request access from an
                  administrator.
                </p>
                <a
                  href="/services"
                  className="inline-block mt-4 px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Request Services
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {assigned.map((service) => (
                  <a
                    key={service.role}
                    href="/services"
                    className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/40 transition-colors"
                  >
                    <code className="px-2 py-1 bg-white text-gray-500 text-[10px] font-mono rounded border border-gray-100 flex-shrink-0">
                      {service.role}
                    </code>
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {service.displayName}
                    </span>
                  </a>
                ))}
              </div>
            ))}
        </div>

        <footer className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
          <p>Sky Bank Sierra Leone Limited · Authorized by Bank of Sierra Leone</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-600">API Documentation</a>
            <a href="#" className="hover:text-gray-600">Developer Sandbox</a>
            <a href="#" className="hover:text-gray-600">Security & Compliance</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
