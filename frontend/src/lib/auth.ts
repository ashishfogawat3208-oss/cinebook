export interface AuthTokens {
  access: string;
  refresh: string;
}

export function saveTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("refresh_token");
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function logout() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  window.location.href = "/login";
}