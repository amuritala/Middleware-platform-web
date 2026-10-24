import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../lib/useAuth";
import { useAdminSession } from "../../../lib/adminSession";
import { LuUserRoundCog } from "react-icons/lu";
import { VscGitPullRequestCreate } from "react-icons/vsc";

interface NavItem {
  name: string;
  icon: ReactNode | string;
  to?: string;
  soon?: boolean;
}

export default function Sidebar() {
  const { claims, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roles = claims?.realm_access?.roles ?? [];
  const isAdmin = roles.includes("ROLE_ADMIN");
  const { can } = useAdminSession();
  const homePath = isAdmin ? "/admin-dashboard" : "/vendor-dashboard";

  const items: NavItem[] = [
    {
      name: "Home",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      to: homePath,
    },
    {
      name: "Services",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
      to: "/services",
    },
    // Administration - rendered only where the caller's governance role grants access.
    ...(isAdmin
      ? [
          ...(can("view.clients")
            ? [
                {
                  name: "Clients",
                  icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                  to: "/admin/clients",
                },
              ]
            : []),
          ...(can("view.role_requests")
            ? [
                {
                  name: "Role Requests",
                  icon: <VscGitPullRequestCreate size={28} />,
                  to: "/admin/role-requests",
                },
              ]
            : []),
          ...(can("initiate.service_assignment")
            ? [
                {
                  name: "Users",
                  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                  to: "/admin/users",
                },
              ]
            : []),
          ...(can("view.approvals")
            ? [
                {
                  name: "User Management",
                  icon: <LuUserRoundCog size={28} />,
                  to: "/admin/user-management",
                },
              ]
            : []),
          ...(can("view.audit")
            ? [
                {
                  name: "Audit Log",
                  icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                  to: "/admin/audit",
                },
              ]
            : []),
        ]
      : []),
    {
      name: "Notifications",
      icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      soon: true,
    },
    {
      name: "Settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      to: "/settings",
    },
  ];

  const isActive = (item: NavItem) =>
    !!item.to && location.pathname === item.to;

  return (
    <aside className="fixed left-4 top-0 bottom-0 flex flex-col items-center py-6 px-2 w-16 z-50">
      <div className="flex flex-col items-center gap-3 flex-1 justify-center">
        {items.map((item) => {
          const active = isActive(item);

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => item.to && navigate(item.to)}
              aria-current={active ? "page" : undefined}
              title={item.soon ? `${item.name} (coming soon)` : item.name}
              className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                active
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : item.soon
                    ? "text-gray-300 hover:bg-gray-100"
                    : "text-gray-400 hover:bg-orange-50 hover:text-orange-500 hover:-translate-y-0.5"
              }`}
            >
              {typeof item.icon === "string" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={item.icon}
                  />
                </svg>
              ) : (
                <span className="flex items-center justify-center w-5 h-5">
                  {item.icon}
                </span>
              )}

              {/* Pending badge for sections without a page yet */}
              {item.soon && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gray-300" />
              )}

              {/* Hover tooltip */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
              >
                {item.name}
                {item.soon && (
                  <span className="ml-1.5 text-orange-300">Soon</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          logout();
          navigate("/login");
        }}
        title="Log out"
        className="group relative p-3 rounded-xl cursor-pointer text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
        >
          Log out
        </span>
      </button>
    </aside>
  );
}
