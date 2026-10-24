const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

function defaultApiUrl(): string {
  if (typeof window === "undefined") return "/api";
  return `${window.location.protocol}//${window.location.hostname}:8088/api`;
}

export const API_BASE_URL = configuredApiUrl || defaultApiUrl();
