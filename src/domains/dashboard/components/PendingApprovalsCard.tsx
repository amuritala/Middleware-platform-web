import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../../lib/api";
import type { RoleChangeApplicationResponse } from "../../../lib/types";
import { describeRoleName } from "../../../lib/serviceCatalog";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PendingApprovalsCard() {
  const navigate = useNavigate();
  const [roleRequests, setRoleRequests] = useState<
    RoleChangeApplicationResponse[]
  >([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  // The three most recent service (role) requests awaiting review.
  useEffect(() => {
    let cancelled = false;
    adminApi
      .getPendingRoleApplications()
      .then((apps) => {
        if (!cancelled) {
          setRoleRequests(apps.slice(0, 3));
          setStatus("success");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Recent Service Requests
            </h3>
            <p className="text-xs text-gray-400">
              Role access awaiting your review
            </p>
          </div>
        </div>
        {status === "success" && roleRequests.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {roleRequests.length} Waiting
          </span>
        )}
      </div>

      {status === "loading" && (
        <div className="py-8 text-center text-sm text-gray-400">
          Loading service requests…
        </div>
      )}

      {status === "error" && (
        <div className="py-8 text-center text-sm text-red-500">
          Could not load service requests
        </div>
      )}

      {status === "success" && roleRequests.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">
            No service requests waiting for review.
          </p>
        </div>
      )}

      {status === "success" && roleRequests.length > 0 && (
        <div className="space-y-2 mb-4">
          {roleRequests.map((app) => (
            <button
              key={app.id}
              onClick={() => navigate("/admin/role-requests")}
              className="w-full flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">
                  {getInitials(app.username)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">
                    {app.username}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {(app.newlyRequestedRoles?.length
                      ? app.newlyRequestedRoles
                      : app.requestedRoles
                    )
                      .map((r) => describeRoleName(r).displayName)
                      .join(", ")}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0">
                {timeAgo(app.createdAt)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Pinned to the card's bottom edge, even when the grid stretches the card. */}
      <button
        onClick={() => navigate("/admin/role-requests")}
        className="mt-auto w-full py-2.5 text-xs font-semibold text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors flex items-center justify-center gap-1.5"
      >
        View all
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
