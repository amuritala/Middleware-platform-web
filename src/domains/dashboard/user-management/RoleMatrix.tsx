import { Fragment, useEffect, useState } from "react";
import { governanceApi, type GovernanceRoleDescription } from "../../../lib/api";
import { MATRIX_GROUPS, PERMISSION_LABELS, ROLE_ORDER_KEYS } from "./roleTheme";

/**
 * The permission matrix: every governance role against every capability, so the bank can
 * see the separation of duties at a glance instead of trusting a document.
 */
export default function RoleMatrix() {
  const [roles, setRoles] = useState<GovernanceRoleDescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    governanceApi
      .roleCatalog()
      .then((data) => {
        if (!cancelled) setRoles(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="h-72 rounded-2xl bg-white border border-gray-100 animate-pulse" />;
  }

  const ordered = ROLE_ORDER_KEYS.map((key) => roles.find((r) => r.role === key)).filter(
    (r): r is GovernanceRoleDescription => Boolean(r),
  );

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm animate-fade-up">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <th className="py-4 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sticky left-0 bg-white z-10 min-w-[240px]">
                Capability
              </th>
              {ordered.map((role) => (
                <th key={role.role} className="py-4 px-3 text-center">
                  <span className="inline-flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-800">{role.label}</span>
                    <span className="w-8 h-0.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-400" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_GROUPS.map((group) => (
              <Fragment key={group.title}>
                <tr className="bg-gray-50/70">
                  <td
                    colSpan={ordered.length + 1}
                    className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 sticky left-0"
                  >
                    {group.title}
                  </td>
                </tr>
                {group.permissions.map((permission) => (
                  <tr
                    key={permission}
                    className="border-b border-gray-50 last:border-0 hover:bg-orange-50/30 transition-colors"
                  >
                    <td className="py-2.5 px-5 text-sm text-gray-600 sticky left-0 bg-white">
                      {PERMISSION_LABELS[permission] ?? permission}
                    </td>
                    {ordered.map((role) => {
                      const allowed = role.permissions.includes(permission);
                      return (
                        <td key={role.role} className="py-2.5 px-3 text-center">
                          {allowed ? (
                            <span className="inline-flex w-6 h-6 rounded-full bg-emerald-50 items-center justify-center">
                              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex w-6 h-6 rounded-full bg-gray-50 items-center justify-center">
                              <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 bg-gradient-to-r from-indigo-50/60 to-transparent border-t border-gray-100 flex items-start gap-2.5">
        <svg className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-indigo-700 leading-relaxed">
          Four-eyes principle: whoever initiates an action can never authorize it - a Super Admin
          included. Only a Control or Super Admin account can hand these roles out, and every
          change lands in the audit trail.
        </p>
      </div>
    </div>
  );
}
