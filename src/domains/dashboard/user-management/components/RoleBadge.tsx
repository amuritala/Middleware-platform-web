import type { AdminGovernanceRole } from "../../../../lib/types";
import { ROLE_THEME } from "../roleTheme";

interface RoleBadgeProps {
  role: AdminGovernanceRole | null | undefined;
  size?: "sm" | "md";
}

/** Colour-coded chip for a governance role; renders a neutral state when unclassified. */
export default function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  if (!role) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 font-semibold ${
          size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Unclassified
      </span>
    );
  }

  const theme = ROLE_THEME[role];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${theme.badge} ${
        size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
      {theme.label}
    </span>
  );
}
