export interface ClientResponse {
  id: string;
  companyName: string;
  contactEmail: string;
  contactFirstName: string;
  contactLastName: string;
  companyAddress: string;
  contactPhone: string;
  registrationNumber: string;
  country: string;
  address: string;
  taxId: string;
  industry: string;
  phoneNumber: string;
  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "ACTIVE"
    | "SUSPENDED"
    | "INACTIVE";
  createdAt: string;
  approvedAt: string | null;
  userCount: number;
}

export interface ApproveClientRequest {
  approvedRoles: string[];
}

export interface AvailabilityResponse {
  usernameAvailable: boolean;
  emailAvailable: boolean;
}

export type RoleApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

/** The complete set of roles you want to end up with - not a diff. */
export interface RoleChangeApplicationRequest {
  requestedRoles: string[];
}

export interface RoleChangeApplicationResponse {
  id: string;
  userId: string;
  username: string;
  email: string;
  /** The complete target role set - what the vendor ends up with on approval. */
  requestedRoles: string[];
  /** Only the roles the vendor did not hold at submit time (may be empty on older rows). */
  newlyRequestedRoles?: string[];
  status: RoleApplicationStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

/** One requestable platform service, read live from Keycloak. */
export interface ServiceRole {
  name: string;
  description: string;
}

/** A Keycloak user as the admin API reports it. */
export interface AdminUserResponse {
  keycloakUserId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  roles: string[];
  /** BANK_USER = staff holding ROLE_ADMIN; CLIENT = vendor user. */
  userType: UserType;
}

export type UserType = "BANK_USER" | "CLIENT";

/** Payload for `POST /api/admin/users` - creates a bank user with ROLE_ADMIN. */
export interface CreateBankUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  /** Temporary credential - replaced at first sign-in. */
  password: string;
}

/** Mutable user attributes. Omitted fields are left unchanged. */
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  emailVerified?: boolean;
}

export interface UserRolesRequest {
  roles: string[];
  /** Mandatory justification - role changes travel through the maker-checker. */
  comment: string;
}

/** One recorded call this service made to a downstream system. */
export interface DownstreamAuditResponse {
  id: string;
  userId: string;
  /** Service operation performed by the orchestrator. */
  operation: string;
  request: string;
  response: string;
  httpStatus: number;
  startTime: string;
  endTime: string;
}

/** Payload for changing the signed-in user's own password. */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Credential state of the signed-in user. */
export interface CredentialsResponse {
  /**
   * True while the user still holds the temporary password an administrator issued:
   * the portal stays locked until a password change clears it.
   */
  mustChangePassword: boolean;
}

/** Payload for `POST /api/admin/clients` - the admin-embedded registration form. */
export interface CreateClientRequest {
  companyName: string;
  registrationNumber: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  phoneNumber: string;
  companyAddress: string;
  taxId: string;
  industry: string;
  country: string;
  /** Temporary credential - the vendor must replace it at first sign-in. */
  password: string;
}

/** Spring's page envelope as returned by `GET /api/admin/downstream-audit`. */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/* ============================================================
 * Governance (maker-checker) types
 * ============================================================ */

export type AdminGovernanceRole =
  | "SUPER_ADMIN"
  | "CONTROL"
  | "INITIATOR"
  | "AUTHORIZER";

/** The signed-in administrator as `GET /api/admin/me` reports it. */
export interface AdminMe {
  keycloakUserId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  adminRole: AdminGovernanceRole | null;
  mustChangePassword: boolean;
  permissions: string[];
}

/** One bank staff administrator as the user-management screen lists them. */
export interface AdminUserSummary {
  keycloakUserId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  adminRole: AdminGovernanceRole | null;
  enabled: boolean;
  mustChangePassword: boolean;
  /** True when an approved suspension blocks this account. */
  suspended: boolean;
  /** ISO timestamp until which an approved time-lock holds; null when unlocked. */
  lockedUntil: string | null;
  lastLogin: string | null;
  createdAt: string | null;
}

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ApprovalActionType =
  | "VENDOR_REGISTRATION"
  | "ADMIN_USER_CREATE"
  | "SERVICE_ASSIGNMENT"
  | "CLIENT_SUSPEND"
  | "CLIENT_ACTIVATE"
  | "ADMIN_ROLE_ASSIGN"
  | "USER_SUSPEND"
  | "USER_UNSUSPEND"
  | "USER_LOCK";

/** One maker-checker request in the approvals queue. */
export interface ApprovalRequest {
  id: string;
  actionType: ApprovalActionType;
  actionLabel: string;
  commentRequired: boolean;
  targetLabel: string;
  targetId: string | null;
  status: ApprovalStatus;
  payload: Record<string, unknown>;
  initiatedByKeycloakUserId: string;
  initiatedByName: string;
  initiatedByEmail: string;
  initiatedByRole: string;
  initiatedComment: string | null;
  authorizedByKeycloakUserId: string | null;
  authorizedByName: string | null;
  authorizedByRole: string | null;
  authorizationComment: string | null;
  authorizedAt: string | null;
  createdAt: string;
}

/** One entry of the governance audit trail. */
export interface GovernanceAuditEntry {
  id: string;
  actionType: string;
  outcome: "INITIATED" | "APPROVED" | "REJECTED";
  summary: string;
  detail: string | null;
  targetLabel: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  comment: string | null;
  createdAt: string;
}

/** Static description of a governance role and what it may do. */
export interface GovernanceRoleDescription {
  role: AdminGovernanceRole;
  label: string;
  description: string;
  permissions: string[];
}

/** One entry of the bank staff directory behind the searchable dropdown. */
export interface StaffMember {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  title: string;
}
