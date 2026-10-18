import { useCallback, useEffect, useState } from "react";
import { servicesApi } from "./api";
import type { ServiceRole } from "./types";

/**
 * How a Keycloak realm role is presented on the Services page and in the detail dialog.
 * The role list itself is read live from `GET /api/services`; this module only decides how
 * each role looks, so a role added to Keycloak tomorrow needs no code change.
 */
export interface ServiceInfo {
  role: string;
  displayName: string;
  description: string;
  category: string;
  color: ColorKey;
  gradient: string;
  icon: string;
  capabilities: string[];
  accessLevel: "Read-only" | "Standard" | "Elevated";
}

export type ColorKey =
  | "blue"
  | "orange"
  | "emerald"
  | "purple"
  | "indigo"
  | "teal"
  | "rose"
  | "amber"
  | "sky"
  | "slate";

/* ─── Presentation tables ──────────────────────────────────────── */

const CATEGORY_STYLES: Record<
  ColorKey,
  {
    gradient: string;
    card: string;
    badge: string;
    ring: string;
    iconBg: string;
    iconText: string;
    dot: string;
    modalText: string;
    modalBadge: string;
    modalBg: string;
    modalDot: string;
  }
> = {
  blue: {
    gradient: "from-blue-500 to-cyan-400",
    card: "hover:border-blue-200 hover:shadow-blue-100/50",
    badge: "bg-blue-50 text-blue-600 border-blue-100",
    ring: "ring-blue-500/10",
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    dot: "bg-blue-500",
    modalText: "text-blue-600",
    modalBadge: "bg-blue-50 text-blue-600",
    modalBg: "bg-blue-50",
    modalDot: "bg-blue-500",
  },
  orange: {
    gradient: "from-orange-500 to-amber-400",
    card: "hover:border-orange-200 hover:shadow-orange-100/50",
    badge: "bg-orange-50 text-orange-600 border-orange-100",
    ring: "ring-orange-500/10",
    iconBg: "bg-orange-50",
    iconText: "text-orange-600",
    dot: "bg-orange-500",
    modalText: "text-orange-600",
    modalBadge: "bg-orange-50 text-orange-600",
    modalBg: "bg-orange-50",
    modalDot: "bg-orange-500",
  },
  emerald: {
    gradient: "from-emerald-500 to-teal-400",
    card: "hover:border-emerald-200 hover:shadow-emerald-100/50",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-100",
    ring: "ring-emerald-500/10",
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    dot: "bg-emerald-500",
    modalText: "text-emerald-600",
    modalBadge: "bg-emerald-50 text-emerald-600",
    modalBg: "bg-emerald-50",
    modalDot: "bg-emerald-500",
  },
  purple: {
    gradient: "from-purple-500 to-violet-400",
    card: "hover:border-purple-200 hover:shadow-purple-100/50",
    badge: "bg-purple-50 text-purple-600 border-purple-100",
    ring: "ring-purple-500/10",
    iconBg: "bg-purple-50",
    iconText: "text-purple-600",
    dot: "bg-purple-500",
    modalText: "text-purple-600",
    modalBadge: "bg-purple-50 text-purple-600",
    modalBg: "bg-purple-50",
    modalDot: "bg-purple-500",
  },
  indigo: {
    gradient: "from-indigo-500 to-blue-400",
    card: "hover:border-indigo-200 hover:shadow-indigo-100/50",
    badge: "bg-indigo-50 text-indigo-600 border-indigo-100",
    ring: "ring-indigo-500/10",
    iconBg: "bg-indigo-50",
    iconText: "text-indigo-600",
    dot: "bg-indigo-500",
    modalText: "text-indigo-600",
    modalBadge: "bg-indigo-50 text-indigo-600",
    modalBg: "bg-indigo-50",
    modalDot: "bg-indigo-500",
  },
  teal: {
    gradient: "from-teal-500 to-emerald-400",
    card: "hover:border-teal-200 hover:shadow-teal-100/50",
    badge: "bg-teal-50 text-teal-600 border-teal-100",
    ring: "ring-teal-500/10",
    iconBg: "bg-teal-50",
    iconText: "text-teal-600",
    dot: "bg-teal-500",
    modalText: "text-teal-600",
    modalBadge: "bg-teal-50 text-teal-600",
    modalBg: "bg-teal-50",
    modalDot: "bg-teal-500",
  },
  rose: {
    gradient: "from-rose-500 to-pink-400",
    card: "hover:border-rose-200 hover:shadow-rose-100/50",
    badge: "bg-rose-50 text-rose-600 border-rose-100",
    ring: "ring-rose-500/10",
    iconBg: "bg-rose-50",
    iconText: "text-rose-600",
    dot: "bg-rose-500",
    modalText: "text-rose-600",
    modalBadge: "bg-rose-50 text-rose-600",
    modalBg: "bg-rose-50",
    modalDot: "bg-rose-500",
  },
  amber: {
    gradient: "from-amber-500 to-yellow-400",
    card: "hover:border-amber-200 hover:shadow-amber-100/50",
    badge: "bg-amber-50 text-amber-600 border-amber-100",
    ring: "ring-amber-500/10",
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    dot: "bg-amber-500",
    modalText: "text-amber-600",
    modalBadge: "bg-amber-50 text-amber-600",
    modalBg: "bg-amber-50",
    modalDot: "bg-amber-500",
  },
  sky: {
    gradient: "from-sky-500 to-blue-400",
    card: "hover:border-sky-200 hover:shadow-sky-100/50",
    badge: "bg-sky-50 text-sky-600 border-sky-100",
    ring: "ring-sky-500/10",
    iconBg: "bg-sky-50",
    iconText: "text-sky-600",
    dot: "bg-sky-500",
    modalText: "text-sky-600",
    modalBadge: "bg-sky-50 text-sky-600",
    modalBg: "bg-sky-50",
    modalDot: "bg-sky-500",
  },
  slate: {
    gradient: "from-slate-600 to-slate-400",
    card: "hover:border-slate-200 hover:shadow-slate-100/50",
    badge: "bg-slate-50 text-slate-600 border-slate-100",
    ring: "ring-slate-500/10",
    iconBg: "bg-slate-50",
    iconText: "text-slate-600",
    dot: "bg-slate-500",
    modalText: "text-slate-600",
    modalBadge: "bg-slate-50 text-slate-600",
    modalBg: "bg-slate-50",
    modalDot: "bg-slate-500",
  },
};

export const serviceStyles = CATEGORY_STYLES;

/** Icons grouped by what the service does, not by its role name. */
const CATEGORY_ICONS: Record<string, string> = {
  Accounts:
    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  Customers:
    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  Transactions:
    "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
  Balances:
    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  Statements:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  Approvals:
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  Controls:
    "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  Journals:
    "M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z",
  Operations:
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  "Reference Data":
    "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  Services:
    "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
};

/**
 * Ordered rules - the first match wins, so `VIEW_CUSTOMER_STATEMENT` files under
 * Statements while `VIEW_CUSTOMER_ACCOUNT_DETAILS` files under Customers.
 */
const CATEGORY_RULES: [RegExp, string][] = [
  [/AUTHORIZE|REVERSE/, "Approvals"],
  [/AMOUNT_BLOCK/, "Controls"],
  [/STATEMENT/, "Statements"],
  [/TRANSACTION|PASS_ENTRY/, "Transactions"],
  [/BALANCE/, "Balances"],
  [/CUSTOMER/, "Customers"],
  [/JOURNAL/, "Journals"],
  [/TELLER/, "Operations"],
  [/ACCOUNT/, "Accounts"],
  [/PRODUCT|CLASS_DATA|SIGNATURE|AUDIT/, "Reference Data"],
];

const CATEGORY_COLORS: Record<string, ColorKey> = {
  Accounts: "blue",
  Customers: "emerald",
  Transactions: "orange",
  Balances: "indigo",
  Statements: "teal",
  Approvals: "purple",
  Controls: "rose",
  Journals: "amber",
  Operations: "sky",
  "Reference Data": "slate",
  Services: "blue",
};

/** Labels that read better than the mechanical `ROLE_CREATE_JOINT_CUSTOMER`. */
const DISPLAY_NAMES: Record<string, string> = {
  ROLE_PASS_ENTRY: "Post Debit / Credit Entry",
  ROLE_CREATE_JOINT_CUSTOMER: "Create Joint Customer",
  ROLE_CREATE_CORPORATE_CUSTOMER: "Create Corporate Customer",
  ROLE_VIEW_CUSTOMER_ACCOUNT_DETAILS: "View Customer Account Details",
  ROLE_VIEW_FULL_ACCOUNT_BALANCE: "View Full Account Balance",
  ROLE_VIEW_SUMMARY_BALANCE: "View Summary Balance",
  ROLE_VIEW_ACCOUNT_CLASS_DATA: "View Account Class Data",
  ROLE_CREATE_DE_JOURNAL: "Create Direct Entry Journal",
  ROLE_CREATE_DE_TEMPLATE: "Create Direct Entry Template",
  ROLE_AUTHORIZE_DE_TRANSACTION: "Authorize Direct Entry Transaction",
  ROLE_CREATE_AMOUNT_BLOCK: "Place Amount Block",
  ROLE_QUERY_AMOUNT_BLOCK: "Query Amount Block",
  ROLE_CHANGE_ACCOUNT_STATUS: "Change Account Status",
  ROLE_VIEW_AUDIT_TRAIL: "View Audit Trail",
};

/** Richer copy for the services a vendor sees first. */
const CAPABILITY_OVERRIDES: Record<string, string[]> = {
  ROLE_CREATE_CUSTOMER: [
    "Create and provision new customer records",
    "Set up initial customer profiles and KYC attributes",
    "Hand the new customer to downstream account services",
  ],
  ROLE_CHECK_BALANCE: [
    "Read the balance of any account the token is scoped to",
    "Safe for read-only dashboards and reconciliation jobs",
    "Never mutates account data",
  ],
  ROLE_PASS_ENTRY: [
    "Post debit and credit entries against accounts",
    "Entries reach the downstream ledger synchronously",
    "Every call is written to the downstream audit trail",
  ],
  ROLE_CREATE_ACCOUNT: [
    "Open new accounts for an existing customer",
    "Sets product, currency and opening state",
    "Requires the customer to already exist",
  ],
};

/* ─── Derivation ───────────────────────────────────────────────── */

function categoryOf(role: string): string {
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(role)) return category;
  }
  return "Services";
}

function displayNameOf(role: string): string {
  const curated = DISPLAY_NAMES[role];
  if (curated) return curated;
  return role
    .replace(/^ROLE_/, "")
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function descriptionOf(role: string, description: string): string {
  const cleaned = description.trim().replace(/\s+role$/i, "");
  if (cleaned) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) + ".";
  }
  return `${displayNameOf(role)} is granted as the ${role} realm role.`;
}

function accessLevelOf(role: string): ServiceInfo["accessLevel"] {
  if (/VIEW|QUERY|CHECK|LIST/.test(role)) return "Read-only";
  if (/CREATE|REVERSE|AUTHORIZE|PASS|CHANGE|PLACE|CHECKOUT/.test(role)) {
    return "Elevated";
  }
  return "Standard";
}

function capabilitiesOf(role: string, level: ServiceInfo["accessLevel"]): string[] {
  const curated = CAPABILITY_OVERRIDES[role];
  if (curated) return curated;
  return [
    level === "Read-only"
      ? "Read-only: returns data without changing anything"
      : level === "Elevated"
        ? "Write access: creates or changes records downstream"
        : "Standard access to this part of the platform",
    `Carried in your access token as ${role}`,
    "Granted only after an administrator approves it, and revocable the same way",
  ];
}

/** Turn one Keycloak role into everything the UI needs to render it. */
export function describeService(service: ServiceRole): ServiceInfo {
  const category = categoryOf(service.name);
  const color = CATEGORY_COLORS[category] ?? "blue";
  const accessLevel = accessLevelOf(service.name);
  return {
    role: service.name,
    displayName: displayNameOf(service.name),
    description: descriptionOf(service.name, service.description ?? ""),
    category,
    color,
    gradient: CATEGORY_STYLES[color].gradient,
    icon: CATEGORY_ICONS[category] ?? CATEGORY_ICONS.Services,
    capabilities: capabilitiesOf(service.name, accessLevel),
    accessLevel,
  };
}

export function describeRoleName(name: string): ServiceInfo {
  return describeService({ name, description: "" });
}

/* ─── Data loading ─────────────────────────────────────────────── */

type Status = "loading" | "success" | "error";

/**
 * The full catalogue of platform services, fetched once per session. Roles added to
 * Keycloak show up here without a frontend release.
 */
export function useServiceCatalog() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const fetched = await servicesApi.list();
      setServices(fetched.map(describeService));
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load services");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { services, status, error, retry: load };
}
