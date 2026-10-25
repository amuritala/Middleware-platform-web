import UserRequestDecisionModal from "./UserRequestDecisionModal";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import type { UserCreationRequestResponse } from "../../../lib/types";

const WORKFLOW_ROLES = [
  "ROLE_CREATE_USER",
  "ROLE_REGISTER_VENDOR",
  "ROLE_AUTHORISE_USER_CREATION",
  "ROLE_AUTHORISE_REGISTRATION",
];

/** Pending bank-user and client creation requests, shown to staff in the approval workflow. */
export default function PendingUserRequestsCard() {
  const navigate = useNavigate();
  const { claims } = useAuth();
  const roles = claims?.realm_access?.roles ?? [];
  const inWorkflow = WORKFLOW_ROLES.some((r) => roles.includes(r));
  const [pending, setPending] = useState<UserCreationRequestResponse[]>([]);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<UserCreationRequestResponse | null>(null);

  useEffect(() => {
    if (!inWorkflow) return;
    adminApi
      .getUserCreationRequests("PENDING")
      .then((all) => setPending(all.filter((r) => r.kind !== "CLIENT")))
      .catch(() => setFailed(true));
  }, [inWorkflow]);

  if (!inWorkflow) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Pending user requests
          </h3>
          <p className="text-xs text-gray-400">
            Bank users awaiting approval
          </p>
        </div>
        {pending.length > 0 && (
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600">
            {pending.length} waiting
          </span>
        )}
      </div>
      {failed && <p className="text-sm text-red-500">Could not load requests</p>}
      {!failed && pending.length === 0 && (
        <p className="text-sm text-gray-400">Nothing awaiting approval.</p>
      )}
      <div className="space-y-2">
        {pending.slice(0, 5).map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r)}
            className="flex w-full items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 text-left hover:bg-gray-100"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-gray-800">
                {r.firstName} {r.lastName} · {r.email}
              </p>
              <p className="text-[10px] text-gray-400">
                Requested by{" "}
                {r.requestedBy}
              </p>
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={() => navigate("/admin/user-approvals")}
        className="mt-4 w-full rounded-xl bg-orange-50 py-2.5 text-xs font-semibold text-orange-600 hover:bg-orange-100"
      >
        View all
      </button>
      {selected && (
        <UserRequestDecisionModal
          request={selected}
          onClose={() => setSelected(null)}
          onDecided={(id) => setPending((p) => p.filter((x) => x.id !== id))}
        />
      )}
    </div>
  );
}
