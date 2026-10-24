import { getValidAccessToken } from "./auth";
import { API_BASE_URL } from "./apiBaseUrl";
import type {
  ClientResponse,
  AvailabilityResponse,
  RoleChangeApplicationResponse,
  ServiceRole,
  AdminUserResponse,
  UpdateUserRequest,
  UserRolesRequest,
  DownstreamAuditResponse,
  PageResponse,
  ChangePasswordRequest,
  CredentialsResponse,
  CreateClientRequest,
  CreateBankUserRequest,
  AdminMe,
  AdminUserSummary,
  ApprovalRequest,
  GovernanceAuditEntry,
  GovernanceRoleDescription,
} from "./types";

export type {
  ClientResponse,
  AvailabilityResponse,
  RoleChangeApplicationResponse,
  ServiceRole,
  AdminUserResponse,
  UpdateUserRequest,
  DownstreamAuditResponse,
  PageResponse,
  AdminMe,
  AdminUserSummary,
  ApprovalRequest,
  GovernanceAuditEntry,
  GovernanceRoleDescription,
};

/** An error the API returned, carrying the status code so callers can react to it. */
export class ApiError extends Error {
  readonly status: number;
  /** On 400s, each failing field name mapped to its validation message. */
  readonly details?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getValidAccessToken();
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
    ...(options.headers as HeadersInit | undefined),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg =
      body?.message || body?.error || `Request failed (${res.status})`;
    throw new ApiError(
      msg,
      res.status,
      typeof body?.details === "object" && body.details !== null
        ? body.details
        : undefined,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/* ---- Admin endpoints ---- */

export const adminApi = {
  getAllClients: () => request<ClientResponse[]>("/admin/clients"),

  getPendingClients: () => request<ClientResponse[]>("/admin/clients/pending"),

  getClient: (clientId: string) =>
    request<ClientResponse>(`/admin/clients/${clientId}`),

  approveClient: (clientId: string, roles: string[]) =>
    request<ClientResponse>(`/admin/clients/${clientId}/approve`, {
      method: "PUT",
      body: JSON.stringify({ approvedRoles: roles }),
    }),

  rejectClient: (clientId: string) =>
    request<ClientResponse>(`/admin/clients/${clientId}/reject`, {
      method: "PUT",
    }),

  getRoles: () => request<string[]>("/admin/roles"),

  /**
   * Create a vendor that goes live immediately - admin-created accounts never enter the
   * pending queue. The supplied password is temporary: the vendor is forced to replace it
   * at first sign-in.
   */
  createClient: (body: CreateClientRequest) =>
    request<ClientResponse>("/admin/clients", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Create a bank user (ROLE_ADMIN) with a temporary password emailed to them. */
  createBankUser: (body: CreateBankUserRequest) =>
    request<AdminUserResponse>("/admin/users", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /* ---- Users ---- */

  /** All Keycloak users, optionally filtered by username / email / name. */
  getUsers: (search?: string) =>
    request<AdminUserResponse[]>(
      search
        ? `/admin/users?search=${encodeURIComponent(search)}`
        : "/admin/users",
    ),

  getUser: (userId: string) =>
    request<AdminUserResponse>(`/admin/users/${userId}`),

  updateUser: (userId: string, body: UpdateUserRequest) =>
    request<AdminUserResponse>(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /**
   * Propose granting service roles. The server stages this as a maker-checker request
   * (comment mandatory) - nothing applies until an authorizer approves it.
   */
  assignRoles: (userId: string, roles: string[], comment: string) =>
    request<ApprovalRequest>(`/admin/users/${userId}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roles, comment } satisfies UserRolesRequest),
    }),

  /** Propose revoking service roles - also maker-checked, comment mandatory. */
  unassignRoles: (userId: string, roles: string[], comment: string) =>
    request<ApprovalRequest>(`/admin/users/${userId}/roles`, {
      method: "DELETE",
      body: JSON.stringify({ roles, comment } satisfies UserRolesRequest),
    }),

  /* ---- Downstream audit ---- */

  getDownstreamAudit: (
    params: { page?: number; size?: number; sort?: string } = {},
  ) => {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 20));
    if (params.sort) qs.set("sort", params.sort);
    return request<PageResponse<DownstreamAuditResponse>>(
      `/admin/downstream-audit?${qs.toString()}`,
    );
  },

  /* ---- Role change applications (admin review queue) ---- */

  getPendingRoleApplications: () =>
    request<RoleChangeApplicationResponse[]>(
      "/customer-management/role-applications/pending",
    ),

  getRoleApplication: (applicationId: string) =>
    request<RoleChangeApplicationResponse>(
      `/customer-management/role-applications/${applicationId}`,
    ),

  /**
   * Approve a role-change application. Pass `approvedRoles` to grant only part of the
   * request; the reviewer's exact target set (requested roles minus the pills they
   * removed) is what gets written to Keycloak. Omit it to grant everything requested.
   */
  approveRoleApplication: (applicationId: string, approvedRoles?: string[]) =>
    request<RoleChangeApplicationResponse>(
      `/customer-management/role-applications/${applicationId}/approve`,
      {
        method: "PUT",
        ...(approvedRoles ? { body: JSON.stringify({ approvedRoles }) } : {}),
      },
    ),

  rejectRoleApplication: (applicationId: string) =>
    request<RoleChangeApplicationResponse>(
      `/customer-management/role-applications/${applicationId}/reject`,
      { method: "PUT" },
    ),
};

/* ---- Service catalogue (public) ---- */

export const servicesApi = {
  /** Every service a user can hold, read live from Keycloak. Public. */
  list: () => request<ServiceRole[]>("/services"),
};

/* ---- Customer (vendor) endpoints ---- */

export const customerApi = {
  /**
   * Ask for a different set of service roles. Send the complete target set, not a diff -
   * the server replaces the roles you hold with exactly what you send. Only one request
   * may be pending at a time (409 otherwise), and ROLE_CLIENT is refused (400).
   */
  submitRoleChange: (requestedRoles: string[]) =>
    request<RoleChangeApplicationResponse>(
      "/customer-management/role-applications",
      {
        method: "POST",
        body: JSON.stringify({ requestedRoles }),
      },
    ),

  getMyApplications: () =>
    request<RoleChangeApplicationResponse[]>(
      "/customer-management/role-applications/mine",
    ),
};

/* ---- Account (self-service, any signed-in user) ---- */

export const accountApi = {
  /** Whether the temporary password still has to be replaced before the portal unlocks. */
  getCredentials: () =>
    request<{ mustChangePassword: boolean }>("/account/credentials"),

  /**
   * Change your own password. The server re-verifies the current password first, so a
   * wrong current password comes back as 401 and nothing is modified.
   */
  changePassword: (body: ChangePasswordRequest) =>
    request<{ message: string }>("/account/password", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /**
   * Whether the signed-in user still holds an administrator's temporary password.
   * The portal stays locked behind the change-password screen while this is true.
   */
  // getCredentials: () => request<CredentialsResponse>("/account/credentials"),
};

/* ---- Governance: maker-checker, staff roles, audit ---- */

export const governanceApi = {
  /** The signed-in administrator's governance role + permission keys. */
  me: () => request<AdminMe>("/admin/me"),

  /* Staff directory with governance roles (Control / Super Admin). */

  listStaff: () => request<AdminUserSummary[]>("/admin/user-management/users"),

  roleCatalog: () =>
    request<GovernanceRoleDescription[]>("/admin/user-management/roles"),

  /* Initiations - each returns a PENDING ApprovalRequest. */

  initiateVendorRegistration: (body: Record<string, unknown>) =>
    request<ApprovalRequest>("/admin/clients", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  initiateAdminUser: (body: Record<string, unknown>) =>
    request<ApprovalRequest>("/admin/users", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  initiateRoleAssignment: (body: {
    targetKeycloakUserId: string;
    adminRole: string;
    comment: string;
  }) =>
    request<ApprovalRequest>("/admin/user-management/role-assignments", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Suspend / reinstate / time-lock a staff account — staged for authorizer sign-off. */
  initiateUserAccess: (body: {
    action: "SUSPEND" | "UNSUSPEND" | "LOCK";
    targetKeycloakUserId: string;
    targetLabel?: string;
    lockMinutes?: number;
    comment: string;
  }) =>
    request<ApprovalRequest>("/admin/user-management/user-actions", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  initiateClientSuspend: (clientId: string, comment: string) =>
    request<ApprovalRequest>(`/admin/clients/${clientId}/suspend`, {
      method: "PUT",
      body: JSON.stringify({ clientId, comment }),
    }),

  initiateClientActivate: (
    clientId: string,
    roles: string[],
    comment: string,
  ) =>
    request<ApprovalRequest>(`/admin/clients/${clientId}/activate`, {
      method: "PUT",
      body: JSON.stringify({ clientId, roles, comment }),
    }),

  /* Approvals queue */

  getApprovals: (status: "PENDING" | "ALL" = "PENDING") =>
    request<ApprovalRequest[]>(`/admin/approvals?status=${status}`),

  approveRequest: (requestId: string, comment: string) =>
    request<ApprovalRequest>(`/admin/approvals/${requestId}/approve`, {
      method: "PUT",
      body: JSON.stringify({ comment }),
    }),

  rejectRequest: (requestId: string, comment: string) =>
    request<ApprovalRequest>(`/admin/approvals/${requestId}/reject`, {
      method: "PUT",
      body: JSON.stringify({ comment }),
    }),

  /* Governance audit trail (Super Admin) */

  getAudit: (params: { page?: number; size?: number } = {}) => {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 20));
    return request<PageResponse<GovernanceAuditEntry>>(
      `/admin/audit?${qs.toString()}`,
    );
  },
};

/* ---- Public endpoints ---- */

export const publicApi = {
  checkAvailability: (params: { username?: string; email?: string }) => {
    const qs = new URLSearchParams();
    if (params.username) qs.set("username", params.username);
    if (params.email) qs.set("email", params.email);
    return request<AvailabilityResponse>(
      `/check-availability?${qs.toString()}`,
    );
  },
};
