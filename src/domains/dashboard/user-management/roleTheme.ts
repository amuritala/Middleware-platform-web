import type { AdminGovernanceRole, ApprovalActionType } from "../../../lib/types";

/** Visual identity for each governance role - used by badges, cards and the matrix. */
export const ROLE_THEME: Record<
  AdminGovernanceRole,
  {
    label: string;
    short: string;
    badge: string;
    dot: string;
    card: string;
    cardActive: string;
    gradient: string;
    monogram: string;
  }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    short: "SA",
    badge: "bg-indigo-50 text-indigo-600 border-indigo-100",
    dot: "bg-indigo-500",
    card: "border-indigo-100 hover:border-indigo-300",
    cardActive: "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20",
    gradient: "from-indigo-500 to-violet-500",
    monogram: "bg-indigo-100 text-indigo-700",
  },
  CONTROL: {
    label: "Control",
    short: "CT",
    badge: "bg-sky-50 text-sky-600 border-sky-100",
    dot: "bg-sky-500",
    card: "border-sky-100 hover:border-sky-300",
    cardActive: "border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20",
    gradient: "from-sky-500 to-cyan-500",
    monogram: "bg-sky-100 text-sky-700",
  },
  INITIATOR: {
    label: "Initiator",
    short: "IN",
    badge: "bg-amber-50 text-amber-600 border-amber-100",
    dot: "bg-amber-500",
    card: "border-amber-100 hover:border-amber-300",
    cardActive: "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20",
    gradient: "from-amber-500 to-orange-500",
    monogram: "bg-amber-100 text-amber-700",
  },
  AUTHORIZER: {
    label: "Authorizer",
    short: "AZ",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-100",
    dot: "bg-emerald-500",
    card: "border-emerald-100 hover:border-emerald-300",
    cardActive: "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20",
    gradient: "from-emerald-500 to-teal-500",
    monogram: "bg-emerald-100 text-emerald-700",
  },
};

export function roleTheme(role: AdminGovernanceRole | null | undefined) {
  return role ? ROLE_THEME[role] : null;
}

/** Display order for role cards and the matrix columns. */
export const ROLE_ORDER_KEYS: AdminGovernanceRole[] = [
  "SUPER_ADMIN",
  "CONTROL",
  "INITIATOR",
  "AUTHORIZER",
];

/** Plain-language labels for the permission keys the backend hands down. */
export const PERMISSION_LABELS: Record<string, string> = {
  "view.dashboard": "See the admin dashboard",
  "view.clients": "View vendors & registrations",
  "view.services": "View the service catalogue",
  "view.role_requests": "Review vendor role requests",
  "view.users": "See bank staff accounts",
  "view.approvals": "See the approvals queue",
  "view.audit": "Read the audit trail",
  "view.role_matrix": "See the role matrix",
  "initiate.vendor_registration": "Register vendors",
  "initiate.service_assignment": "Assign services to vendors",
  "initiate.client_suspend": "Propose vendor suspension",
  "initiate.client_activate": "Propose vendor activation",
  "initiate.admin_user_create": "Create admin users",
  "initiate.admin_role_assign": "Propose role changes",
  "initiate.user_access": "Suspend, reinstate and time-lock accounts",
  "authorize": "Authorize actions",
};

/** Rows of the permission matrix, grouped for a readable grid. */
export const MATRIX_GROUPS: { title: string; permissions: string[] }[] = [
  {
    title: "Visibility",
    permissions: [
      "view.dashboard",
      "view.clients",
      "view.services",
      "view.users",
      "view.approvals",
      "view.role_requests",
      "view.audit",
      "view.role_matrix",
    ],
  },
  {
    title: "Initiating actions",
    permissions: [
      "initiate.vendor_registration",
      "initiate.service_assignment",
      "initiate.client_suspend",
      "initiate.client_activate",
      "initiate.admin_user_create",
      "initiate.admin_role_assign",
      "initiate.user_access",
    ],
  },
  {
    title: "Decision making",
    permissions: ["authorize"],
  },
];

export const ACTION_THEME: Record<
  ApprovalActionType,
  { label: string; chip: string; icon: string }
> = {
  VENDOR_REGISTRATION: {
    label: "Vendor registration",
    chip: "bg-orange-50 text-orange-600 border-orange-100",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  ADMIN_USER_CREATE: {
    label: "Admin user creation",
    chip: "bg-indigo-50 text-indigo-600 border-indigo-100",
    icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
  },
  SERVICE_ASSIGNMENT: {
    label: "Service assignment",
    chip: "bg-sky-50 text-sky-600 border-sky-100",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  },
  CLIENT_SUSPEND: {
    label: "Vendor suspension",
    chip: "bg-rose-50 text-rose-600 border-rose-100",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  },
  CLIENT_ACTIVATE: {
    label: "Vendor activation",
    chip: "bg-emerald-50 text-emerald-600 border-emerald-100",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  ADMIN_ROLE_ASSIGN: {
    label: "Admin role assignment",
    chip: "bg-violet-50 text-violet-600 border-violet-100",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  USER_SUSPEND: {
    label: "User suspension",
    chip: "bg-rose-50 text-rose-600 border-rose-100",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 0L5.636 5.636",
  },
  USER_UNSUSPEND: {
    label: "User reinstatement",
    chip: "bg-emerald-50 text-emerald-600 border-emerald-100",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  USER_LOCK: {
    label: "User time lock",
    chip: "bg-sky-50 text-sky-600 border-sky-100",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
};
