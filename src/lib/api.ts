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
  UserCreationRequestResponse,
  UserCreationRequestStatus,
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

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
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

  getPendingClients: () =>
    request<ClientResponse[]>("/admin/clients/pending"),

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

  suspendClient: (clientId: string) =>
    request<ClientResponse>(`/admin/clients/${clientId}/suspend`, {
      method: "PUT",
    }),

  activateClient: (clientId: string, roles: string[]) =>
    request<ClientResponse>(`/admin/clients/${clientId}/activate`, {
      method: "PUT",
      body: JSON.stringify({ approvedRoles: roles }),
    }),

  getRoles: () => request<string[]>("/admin/roles"),

  /**
   * Queue a vendor registration for approval (needs ROLE_REGISTER_VENDOR). The password is a
   * generated temporary one; the vendor must replace it at first sign-in.
   */
  requestClient: (body: CreateClientRequest) =>
    request<UserCreationRequestResponse>("/admin/user-requests/clients", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Queue a bank user (ROLE_ADMIN) for approval. Needs ROLE_CREATE_USER. */
  requestBankUser: (body: CreateBankUserRequest) =>
    request<UserCreationRequestResponse>("/admin/user-requests", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Roles that can be given to a new bank user. */
  getBankUserRoles: () => request<string[]>("/admin/bank-user-roles"),

  /** Creation requests, optionally only one status. */
  getUserCreationRequests: (status?: UserCreationRequestStatus) =>
    request<UserCreationRequestResponse[]>(
      status ? `/admin/user-requests?status=${status}` : "/admin/user-requests",
    ),

  /** Approve a request, which creates the user. Needs ROLE_AUTHORISE_USER_CREATION (bank users) or ROLE_AUTHORISE_REGISTRATION (clients). */
  approveUserCreation: (id: string) =>
    request<UserCreationRequestResponse>(`/admin/user-requests/${id}/approve`, {
      method: "PUT",
    }),

  rejectUserCreation: (id: string) =>
    request<UserCreationRequestResponse>(`/admin/user-requests/${id}/reject`, {
      method: "PUT",
    }),

  /* ---- Users ---- */

  /** All Keycloak users, optionally filtered by username / email / name. */
  getUsers: (search?: string) =>
    request<AdminUserResponse[]>(
      search
        ? `/admin/users?search=${encodeURIComponent(search)}`
        : "/admin/users"
    ),

  getUser: (userId: string) =>
    request<AdminUserResponse>(`/admin/users/${userId}`),

  updateUser: (userId: string, body: UpdateUserRequest) =>
    request<AdminUserResponse>(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /** Grant realm roles. ROLE_ADMIN / ROLE_CLIENT are refused by the server. */
  assignRoles: (userId: string, roles: string[]) =>
    request<AdminUserResponse>(`/admin/users/${userId}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roles } satisfies UserRolesRequest),
    }),

  /** Revoke realm roles. ROLE_ADMIN / ROLE_CLIENT are refused by the server. */
  unassignRoles: (userId: string, roles: string[]) =>
    request<AdminUserResponse>(`/admin/users/${userId}/roles`, {
      method: "DELETE",
      body: JSON.stringify({ roles } satisfies UserRolesRequest),
    }),

  /* ---- Downstream audit ---- */

  getDownstreamAudit: (
    params: { page?: number; size?: number; sort?: string } = {}
  ) => {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 0));
    qs.set("size", String(params.size ?? 20));
    if (params.sort) qs.set("sort", params.sort);
    return request<PageResponse<DownstreamAuditResponse>>(
      `/admin/downstream-audit?${qs.toString()}`
    );
  },

  /* ---- Role change applications (admin review queue) ---- */

  getPendingRoleApplications: () =>
    request<RoleChangeApplicationResponse[]>(
      "/customer-management/role-applications/pending"
    ),

  getRoleApplication: (applicationId: string) =>
    request<RoleChangeApplicationResponse>(
      `/customer-management/role-applications/${applicationId}`
    ),

  approveRoleApplication: (applicationId: string, rejectedRoles: string[] = []) =>
    request<RoleChangeApplicationResponse>(
      `/customer-management/role-applications/${applicationId}/approve`,
      { method: "PUT", body: JSON.stringify({ rejectedRoles }) }
    ),

  rejectRoleApplication: (applicationId: string) =>
    request<RoleChangeApplicationResponse>(
      `/customer-management/role-applications/${applicationId}/reject`,
      { method: "PUT" }
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
      }
    ),

  getMyApplications: () =>
    request<RoleChangeApplicationResponse[]>(
      "/customer-management/role-applications/mine"
    ),
};

/* ---- Account (self-service, any signed-in user) ---- */

export const accountApi = {
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
  getCredentials: () => request<CredentialsResponse>("/account/credentials"),
};

/* ---- Public endpoints ---- */

export const publicApi = {
  checkAvailability: (params: { username?: string; email?: string }) => {
    const qs = new URLSearchParams();
    if (params.username) qs.set("username", params.username);
    if (params.email) qs.set("email", params.email);
    return request<AvailabilityResponse>(
      `/check-availability?${qs.toString()}`
    );
  },
};
