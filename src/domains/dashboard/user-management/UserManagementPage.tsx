import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { governanceApi, type AdminUserSummary, type ApprovalRequest } from "../../../lib/api";
import { useAdminSession } from "../../../lib/adminSession";
import CreateUserModal from "./components/CreateUserModal";
import AssignRoleModal from "./components/AssignRoleModal";
import UserActionModal, { type UserAccessAction } from "./components/UserActionModal";
import ApprovalsQueue from "./components/ApprovalsQueue";
import RoleMatrix from "./RoleMatrix";
import RoleBadge from "./components/RoleBadge";
import { ROLE_THEME } from "./roleTheme";

type Tab = "staff" | "approvals" | "matrix";

/** Counts up to its target once, so the header stats land instead of blinking in. */
function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 700;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(value * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value]);

  return <>{shown}</>;
}

/**
 * User Management: the bank's separation-of-duties cockpit. Create staff from the bank
 * directory, watch the maker-checker queue, and see exactly which powers each governance
 * role holds - gated so every role only sees the tabs it owns.
 */
export default function UserManagementPage() {
  const { me, can, status: sessionStatus } = useAdminSession();

  const canSeeStaff = can("view.users");
  const canCreate = can("initiate.admin_user_create");
  const canAssignRoles = can("initiate.admin_role_assign");
  const canManageAccess = can("initiate.user_access");
  const canSeeApprovals = can("view.approvals");
  const canSeeMatrix = can("view.role_matrix");

  const [tab, setTab] = useState<Tab>(canSeeStaff ? "staff" : "approvals");
  const [staff, setStaff] = useState<AdminUserSummary[]>([]);
  const [staffStatus, setStaffStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<AdminUserSummary | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{
    top?: number;
    bottom?: number;
    right: number;
  } | null>(null);
  const [accessAction, setAccessAction] = useState<
    { member: AdminUserSummary; action: UserAccessAction } | null
  >(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    try {
      const queue: ApprovalRequest[] = await governanceApi.getApprovals("PENDING");
      setPendingCount(queue.length);
    } catch {
      // The hero stat degrades quietly; the tab itself surfaces errors.
    }
  }, []);

  const loadStaff = useCallback(async () => {
    if (!canSeeStaff) return;
    setStaffStatus("loading");
    setLoadError(null);
    try {
      setStaff(await governanceApi.listStaff());
      setStaffStatus("ready");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load staff");
      setStaffStatus("error");
    }
  }, [canSeeStaff]);

  useEffect(() => {
    if (sessionStatus === "ready") {
      void loadPending();
      void loadStaff();
    }
  }, [sessionStatus, loadPending, loadStaff, refreshKey]);

  // Keep the selected tab legal when permissions arrive after first paint.
  useEffect(() => {
    if (sessionStatus !== "ready") return;
    if (tab === "staff" && !canSeeStaff) setTab(canSeeApprovals ? "approvals" : "matrix");
    if (tab === "approvals" && !canSeeApprovals) setTab(canSeeStaff ? "staff" : "matrix");
    if (tab === "matrix" && !canSeeMatrix) setTab(canSeeStaff ? "staff" : "approvals");
  }, [sessionStatus, tab, canSeeStaff, canSeeApprovals, canSeeMatrix]);

  const bump = () => setRefreshKey((key) => key + 1);

  // Close the row action menu when clicking anywhere else, scrolling, or resizing.
  useEffect(() => {
    if (!menuFor) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-user-menu]")) setMenuFor(null);
    };
    const close = () => setMenuFor(null);
    document.addEventListener("mousedown", onPointerDown);
    // capture:true so scrolls inside any scrollable ancestor (e.g. the table's
    // overflow container) also close the card instead of leaving it detached.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menuFor]);

  const filteredStaff = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return staff;
    return staff.filter((member) =>
      [member.fullName, member.email, member.adminRole ?? ""]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [staff, search]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const member of staff) {
      const key = member.adminRole ?? "UNCLASSIFIED";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [staff]);

  const tabs: { id: Tab; label: string; show: boolean; badge?: number }[] = [
    { id: "staff", label: "Staff", show: canSeeStaff },
    { id: "approvals", label: "Approvals", show: canSeeApprovals, badge: pendingCount },
    { id: "matrix", label: "Role matrix", show: canSeeMatrix },
  ];

  const visibleTabs = tabs.filter((entry) => entry.show);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="ml-20 p-6">
        <TopNav portal="admin" />

        {/* ============ Hero ============ */}
        <header className="mt-20 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 shadow-xl shadow-black/10 animate-fade-up">
          {/* Ambient glow */}
          <div className="absolute -top-24 right-[12%] w-80 h-80 rounded-full bg-orange-500/25 blur-3xl" />
          <div className="absolute -bottom-28 left-[8%] w-72 h-72 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />

          {/* Faint grid texture */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(ellipse at 70% 20%, black, transparent 75%)",
            }}
          />

          <div className="relative px-8 pt-8 pb-7">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-orange-300 text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    Maker-checker governance
                  </span>
                  {me && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white border ${
                        me.adminRole ? "border-white/15 bg-white/10" : "border-white/10 bg-white/5"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          me.adminRole ? ROLE_THEME[me.adminRole].dot : "bg-gray-400"
                        }`}
                      />
                      You are {me.adminRole ? ROLE_THEME[me.adminRole].label : "unclassified"}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-white mt-4 tracking-tight">
                  User Management
                </h1>
                <p className="text-sm text-gray-400 mt-1.5 max-w-xl leading-relaxed">
                  Create staff accounts from the bank directory, route every sensitive action
                  through a second pair of eyes, and keep the separation of duties visible to
                  the whole bank.
                </p>
              </div>

              {canCreate && (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  <span className="w-7 h-7 rounded-lg bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-colors">
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  Create user
                </button>
              )}
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-7">
              <StatCard
                label="Awaiting decision"
                value={<AnimatedNumber value={pendingCount} />}
                accent="text-orange-300"
                hint={pendingCount > 0 ? "in your queue" : "queue is clear"}
                pulse={pendingCount > 0}
              />
              {canSeeStaff ? (
                <>
                  <StatCard
                    label="Staff accounts"
                    value={<AnimatedNumber value={staff.length} />}
                    accent="text-sky-300"
                    hint="bank administrators"
                  />
                  <StatCard
                    label="Initiators"
                    value={<AnimatedNumber value={roleCounts.INITIATOR ?? 0} />}
                    accent="text-amber-300"
                    hint="may propose actions"
                  />
                  <StatCard
                    label="Authorizers"
                    value={<AnimatedNumber value={roleCounts.AUTHORIZER ?? 0} />}
                    accent="text-emerald-300"
                    hint="may decide actions"
                  />
                </>
              ) : (
                <>
                  <StatCard
                    label="Your role"
                    value={<span className="text-2xl">{me?.adminRole ? ROLE_THEME[me.adminRole].label : "—"}</span>}
                    accent="text-white"
                    hint="governance classification"
                  />
                  <StatCard
                    label="Can authorize"
                    value={<span className="text-2xl">{can("authorize") ? "Yes" : "No"}</span>}
                    accent={can("authorize") ? "text-emerald-300" : "text-gray-400"}
                    hint={can("authorize") ? "four-eyes decisions" : "initiators never decide"}
                  />
                  <StatCard
                    label="Can initiate"
                    value={
                      <span className="text-2xl">
                        {can("initiate.vendor_registration") || can("initiate.admin_user_create") ? "Yes" : "No"}
                      </span>
                    }
                    accent={can("initiate.vendor_registration") || can("initiate.admin_user_create") ? "text-amber-300" : "text-gray-400"}
                    hint="propose new actions"
                  />
                </>
              )}
            </div>
          </div>
        </header>

        {/* ============ Tabs ============ */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white border border-gray-200 shadow-sm">
            {visibleTabs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  tab === entry.id
                    ? "bg-gray-900 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {entry.label}
                {!!entry.badge && entry.badge > 0 && (
                  <span
                    className={`ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                      tab === entry.id
                        ? "bg-orange-500 text-white"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {entry.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "staff" && canSeeStaff && (
            <div className="relative w-full sm:w-72">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter staff…"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
              />
            </div>
          )}
        </div>

        {/* ============ Tab content ============ */}
        <div className="mt-4 pb-10">
          {tab === "staff" && (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-fade-up">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Bank staff</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Governance roles are applied through the approvals queue
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                  {staffStatus === "ready" ? filteredStaff.length : "—"}
                </span>
              </div>

              {staffStatus === "loading" && (
                <div className="p-6 space-y-3">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="h-14 rounded-xl bg-gray-50 animate-pulse" />
                  ))}
                </div>
              )}

              {staffStatus === "error" && (
                <div className="p-10 text-center">
                  <p className="text-sm text-red-500 mb-3">{loadError}</p>
                  <button
                    type="button"
                    onClick={() => void loadStaff()}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              )}

              {staffStatus === "ready" && filteredStaff.length === 0 && (
                <div className="py-14 text-center text-sm text-gray-400">
                  {search ? `No staff match “${search}”.` : "No staff accounts yet."}
                </div>
              )}

              {staffStatus === "ready" && filteredStaff.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[760px]">
                    <thead>
                      <tr className="text-[11px] text-gray-400 border-b border-gray-100 bg-gray-50/60">
                        <th className="py-3 px-6 font-semibold uppercase tracking-wider">Administrator</th>
                        <th className="py-3 px-4 font-semibold uppercase tracking-wider">Governance role</th>
                        <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 font-semibold uppercase tracking-wider">Last sign-in</th>
                        <th className="py-3 px-6 font-semibold uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((member, index) => {
                        const theme = member.adminRole ? ROLE_THEME[member.adminRole] : null;
                        const isSelf = me?.keycloakUserId === member.keycloakUserId;
                        const lockedUntil =
                          member.lockedUntil && new Date(member.lockedUntil).getTime() > Date.now()
                            ? member.lockedUntil
                            : null;
                        const menuOpen = menuFor === member.keycloakUserId;
                        const showMenu = !isSelf && (canAssignRoles || canManageAccess);
                        return (
                          <tr
                            key={member.keycloakUserId}
                            className="border-b border-gray-50 last:border-0 hover:bg-orange-50/30 transition-colors animate-fade-up"
                            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                          >
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    theme ? theme.monogram : "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  {(member.fullName || member.email)
                                    .split(/\s+/)
                                    .map((part) => part[0])
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {member.fullName || member.email}
                                    {isSelf && (
                                      <span className="ml-1.5 text-[10px] font-bold text-orange-500 uppercase">you</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <RoleBadge role={member.adminRole} />
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                  member.suspended
                                    ? "bg-rose-50 text-rose-600"
                                    : lockedUntil
                                      ? "bg-amber-50 text-amber-600"
                                      : member.enabled
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    member.suspended
                                      ? "bg-rose-500"
                                      : lockedUntil
                                        ? "bg-amber-500"
                                        : member.enabled
                                          ? "bg-emerald-500"
                                          : "bg-gray-400"
                                  }`}
                                />
                                {member.suspended
                                  ? "Suspended"
                                  : lockedUntil
                                    ? "Locked"
                                    : member.enabled
                                      ? "Active"
                                      : "Disabled"}
                              </span>
                              {lockedUntil && (
                                <p className="mt-1 text-[10px] text-amber-500">
                                  until{" "}
                                  {new Date(lockedUntil).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-gray-500">
                              {member.lastLogin
                                ? new Date(member.lastLogin).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Never"}
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              {showMenu ? (
                                <div className="relative inline-block" data-user-menu>
                                  <button
                                    type="button"
                                    aria-label={`Actions for ${member.fullName || member.email}`}
                                    aria-haspopup="menu"
                                    aria-expanded={menuOpen}
                                    onClick={(e) => {
                                      if (menuOpen) {
                                        setMenuFor(null);
                                        return;
                                      }
                                      // Anchor the card to the viewport, not the table cell:
                                      // the table's overflow container would clip an
                                      // absolutely-positioned card on the bottom rows.
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const MENU_HEIGHT = 208;
                                      const flipUp =
                                        rect.bottom + MENU_HEIGHT > window.innerHeight - 12;
                                      setMenuPos(
                                        flipUp
                                          ? {
                                              bottom: window.innerHeight - rect.top + 6,
                                              right: window.innerWidth - rect.right,
                                            }
                                          : {
                                              top: rect.bottom + 6,
                                              right: window.innerWidth - rect.right,
                                            },
                                      );
                                      setMenuFor(member.keycloakUserId);
                                    }}
                                    className="w-8 h-8 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-colors"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                      <circle cx="12" cy="5" r="1.7" />
                                      <circle cx="12" cy="12" r="1.7" />
                                      <circle cx="12" cy="19" r="1.7" />
                                    </svg>
                                  </button>

                                  {menuOpen &&
                                    createPortal(
                                      <div
                                        role="menu"
                                        data-user-menu
                                        style={{
                                          position: "fixed",
                                          ...(menuPos ?? {}),
                                        }}
                                        className="w-56 rounded-2xl border border-gray-100 bg-white shadow-xl shadow-black/10 p-1.5 z-50 text-left animate-scale-in"
                                      >
                                      {canAssignRoles && (
                                        <button
                                          type="button"
                                          role="menuitem"
                                          onClick={() => {
                                            setMenuFor(null);
                                            setAssignTarget(member);
                                          }}
                                          className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                        >
                                          <svg
                                            className="w-4 h-4 text-violet-500 flex-shrink-0"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                            />
                                          </svg>
                                          Assign governance role
                                        </button>
                                      )}

                                      {canManageAccess && (
                                        <>
                                          <div className="h-px bg-gray-100 my-1.5" />
                                          <p className="px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                            Access control
                                          </p>

                                          {member.suspended ? (
                                            <button
                                              type="button"
                                              role="menuitem"
                                              onClick={() => {
                                                setMenuFor(null);
                                                setAccessAction({ member, action: "UNSUSPEND" });
                                              }}
                                              className="w-full text-left px-3 py-2 rounded-xl text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors"
                                            >
                                              <svg
                                                className="w-4 h-4 flex-shrink-0"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                              </svg>
                                              Reinstate user
                                            </button>
                                          ) : (
                                            <>
                                              <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() => {
                                                  setMenuFor(null);
                                                  setAccessAction({ member, action: "SUSPEND" });
                                                }}
                                                className="w-full text-left px-3 py-2 rounded-xl text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                                              >
                                                <svg
                                                  className="w-4 h-4 flex-shrink-0"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  stroke="currentColor"
                                                  strokeWidth={2}
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 0L5.636 5.636"
                                                  />
                                                </svg>
                                                Suspend user
                                              </button>

                                              <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() => {
                                                  setMenuFor(null);
                                                  setAccessAction({ member, action: "LOCK" });
                                                }}
                                                className="w-full text-left px-3 py-2 rounded-xl text-sm text-sky-600 hover:bg-sky-50 flex items-center gap-2.5 transition-colors"
                                              >
                                                <svg
                                                  className="w-4 h-4 flex-shrink-0"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  stroke="currentColor"
                                                  strokeWidth={2}
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                  />
                                                </svg>
                                                Lock user for a set time…
                                              </button>
                                            </>
                                          )}
                                        </>
                                      )}
                                      </div>,
                                      document.body,
                                    )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-gray-300">
                                  {isSelf ? "own account" : "read-only"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "approvals" && <ApprovalsQueue refreshKey={refreshKey} />}
          {tab === "matrix" && <RoleMatrix />}
        </div>
      </div>

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onSubmitted={() => {
            bump();
            void loadStaff();
          }}
        />
      )}

      {assignTarget && (
        <AssignRoleModal
          member={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSubmitted={bump}
        />
      )}

      {accessAction && (
        <UserActionModal
          member={accessAction.member}
          action={accessAction.action}
          onClose={() => setAccessAction(null)}
          onSubmitted={bump}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  hint,
  pulse,
}: {
  label: string;
  value: React.ReactNode;
  accent: string;
  hint: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm px-5 py-4 hover:bg-white/[0.09] transition-colors">
      <div className="flex items-center gap-2">
        {pulse && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />}
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      </div>
      <p className={`text-3xl font-bold mt-1.5 ${accent}`}>{value}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>
    </div>
  );
}
