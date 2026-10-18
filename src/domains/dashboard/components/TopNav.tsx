import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/skybank-logo.png";
import { getDisplayName, getInitials } from "../../../lib/user";
import { useAuth } from "../../../lib/useAuth";
import { useServiceCatalog } from "../../../lib/serviceCatalog";
import { useClients } from "../../../lib/useClients";
import { adminApi } from "../../../lib/api";

interface TopNavProps {
  portal?: "admin" | "vendor";
}

interface SearchResult {
  label: string;
  hint: string;
  to: string;
}

/** Static destinations, scoped per portal. */
function staticResults(isAdmin: boolean): SearchResult[] {
  const common: SearchResult[] = [
    { label: "Home", hint: "Dashboard", to: isAdmin ? "/admin-dashboard" : "/vendor-dashboard" },
    { label: "Services", hint: "Browse & request platform services", to: "/services" },
    { label: "Settings", hint: "Password & account security", to: "/settings" },
  ];
  if (!isAdmin) {
    common.push({
      label: "API Explorer",
      hint: "Endpoint docs and interactive requests",
      to: "/api-docs",
    });
    return common;
  }
  return [
    ...common,
    { label: "Register Users", hint: "Onboard a client or add a bank user", to: "/admin/register" },
    { label: "Clients", hint: "Company registrations & lifecycle", to: "/admin/clients" },
    { label: "Role Requests", hint: "Approve or decline service access", to: "/admin/role-requests" },
    { label: "All Users", hint: "Clients & bank users, accounts & roles", to: "/admin/users" },
    { label: "Audit Log", hint: "Downstream DB traffic", to: "/admin/audit" },
  ];
}

export default function TopNav({ portal = "vendor" }: TopNavProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const displayName = getDisplayName();
  const initials = getInitials();
  const isAdmin = portal === "admin";

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [users, setUsers] = useState<{ username: string; email: string; userType: string }[]>([]);
  const [roleRequests, setRoleRequests] = useState<
    { username: string; id: string }[]
  >([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { services } = useServiceCatalog();
  const { clients } = useClients();

  // Admin-only datasets for the search index, loaded once.
  useEffect(() => {
    if (!isAdmin) return;
    adminApi
      .getUsers()
      .then((u) =>
        setUsers(u.map((x) => ({ username: x.username, email: x.email, userType: x.userType }))),
      )
      .catch(() => undefined);
    adminApi
      .getPendingRoleApplications()
      .then((apps) =>
        setRoleRequests(apps.map((a) => ({ username: a.username, id: a.id }))),
      )
      .catch(() => undefined);
  }, [isAdmin]);

  // ⌘K / Ctrl+K focuses the search field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click-outside closes both dropdowns.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const out: SearchResult[] = [];

    for (const s of services) {
      if (
        s.displayName.toLowerCase().includes(needle) ||
        s.role.toLowerCase().includes(needle) ||
        s.category.toLowerCase().includes(needle)
      ) {
        out.push({
          label: s.displayName,
          hint: `Service · ${s.category}`,
          to: "/services",
        });
      }
      if (out.length >= 6) return out;
    }

    for (const c of clients) {
      if (
        c.companyName.toLowerCase().includes(needle) ||
        c.contactEmail.toLowerCase().includes(needle) ||
        c.registrationNumber?.toLowerCase().includes(needle)
      ) {
        out.push({
          label: c.companyName,
          hint: `Client · ${c.status.toLowerCase()}`,
          to: isAdmin ? "/admin/clients" : "/vendor-dashboard",
        });
      }
      if (out.length >= 8) return out;
    }

    if (isAdmin) {
      for (const u of users) {
        if (
          u.username.toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle)
        ) {
          out.push({ label: u.username, hint: `${u.userType === "BANK_USER" ? "Bank User" : "Client User"} · ${u.email}`, to: "/admin/users" });
        }
        if (out.length >= 10) return out;
      }
      for (const r of roleRequests) {
        if (r.username.toLowerCase().includes(needle)) {
          out.push({
            label: r.username,
            hint: "Role request · pending review",
            to: "/admin/role-requests",
          });
        }
        if (out.length >= 12) return out;
      }
    }

    for (const p of staticResults(isAdmin)) {
      if (p.label.toLowerCase().includes(needle)) {
        out.push(p);
      }
    }
    return out.slice(0, 12);
  }, [query, services, clients, users, roleRequests, isAdmin]);

  const go = (to: string) => {
    setSearchOpen(false);
    setQuery("");
    navigate(to);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Sky Bank Sierra Leone" className="h-10" />
          <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg tracking-wide">
            {isAdmin ? "ADMIN PORTAL" : "VENDOR PORTAL"}
          </span>
        </div>

        {/* ── Live search ── */}
        <div ref={searchRef} className="relative flex-1 max-w-2xl mx-8">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search services, clients, users..."
            className="w-full pl-12 pr-14 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md font-mono border border-gray-200 pointer-events-none">
            ⌘K
          </span>

          {searchOpen && query.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
              {results.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">
                  No matches for “{query}”
                </p>
              ) : (
                <ul className="max-h-96 overflow-y-auto py-1.5">
                  {results.map((r, i) => (
                    <li key={`${r.label}-${i}`}>
                      <button
                        onClick={() => go(r.to)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-orange-50/60 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {r.label}
                        </span>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">
                          {r.hint}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white" />
          </button>

          {/* ── Profile dropdown ── */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                {initials}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {displayName}
                </p>
                <p className="text-xs text-gray-400">
                  {isAdmin ? "Administrator" : "Vendor"}
                </p>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden py-1.5"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50/60 hover:text-gray-900 transition-colors text-left"
                >
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                  Profile
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                    />
                  </svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
