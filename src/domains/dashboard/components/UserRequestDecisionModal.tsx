import { useState } from "react";
import { adminApi, ApiError } from "../../../lib/api";
import { useAuth } from "../../../lib/useAuth";
import type { UserCreationRequestResponse } from "../../../lib/types";

interface Props {
  request: UserCreationRequestResponse;
  onClose: () => void;
  onDecided: (id: string) => void;
}

/** Review modal; Approve/Reject are enabled for holders of the matching ROLE_AUTHORISE_* role. */
export default function UserRequestDecisionModal({ request, onClose, onDecided }: Props) {
  const { claims } = useAuth();
  const roles = claims?.realm_access?.roles ?? [];
  const me = (claims?.email ?? claims?.preferred_username ?? "").toLowerCase();
  const isClient = request.kind === "CLIENT";
  const needed = isClient ? "ROLE_AUTHORISE_REGISTRATION" : "ROLE_AUTHORISE_USER_CREATION";
  const ownRequest = request.requestedBy.toLowerCase() === me;
  const canDecide = roles.includes(needed) && request.status === "PENDING" && !ownRequest;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const decide = async (action: "approve" | "reject") => {
    setBusy(true);
    setError("");
    try {
      if (action === "approve") await adminApi.approveUserCreation(request.id);
      else await adminApi.rejectUserCreation(request.id);
      onDecided(request.id);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Action failed");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">
          {isClient ? "Client registration request" : "Bank user request"}
        </h3>
        <dl className="mt-4 space-y-2 text-sm">
          {isClient && (
            <div className="flex justify-between"><dt className="text-gray-500">Company</dt><dd>{request.companyName}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd>{request.firstName} {request.lastName}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd>{request.email}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Requested by</dt><dd>{request.requestedBy}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Requested</dt><dd>{new Date(request.createdAt).toLocaleString()}</dd></div>
          {request.roles?.length > 0 && (
            <div><dt className="text-gray-500">Roles</dt><dd className="font-mono text-xs">{request.roles.join(", ")}</dd></div>
          )}
        </dl>
        {!canDecide && (
          <p className="mt-4 text-xs text-gray-500">
            {ownRequest
              ? "You cannot decide a request you submitted."
              : request.status !== "PENDING"
                ? `This request was ${request.status.toLowerCase()}.`
                : `You need ${needed} to decide this request.`}
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100">Close</button>
          {canDecide && (
            <>
              <button disabled={busy} onClick={() => void decide("reject")} className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">Reject</button>
              <button disabled={busy} onClick={() => void decide("approve")} className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60">Approve</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
