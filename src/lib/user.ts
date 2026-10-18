import { getAccessToken, parseAccessToken } from "./auth";

export interface KeycloakUser {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

export function getAuthenticatedUser(): KeycloakUser | null {
  const accessToken = getAccessToken();
  if (!accessToken) return null;
  const token = parseAccessToken(accessToken);
  if (!token) return null;

  return {
    firstName: token.given_name || "",
    lastName: token.family_name || "",
    email: token.email || "",
    username: token.preferred_username || token.email || "",
  };
}

export function getDisplayName(): string {
  const user = getAuthenticatedUser();
  if (!user) return "User";
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.username;
}

export function getInitials(): string {
  const user = getAuthenticatedUser();
  if (!user) return "U";
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.username) {
    return user.username.slice(0, 2).toUpperCase();
  }
  return "U";
}
