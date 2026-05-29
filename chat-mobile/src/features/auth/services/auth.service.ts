import { apiClient } from "../../../config/api.config";

import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from "../types/auth.types";

export async function loginSession(
  payload: LoginRequest,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return (
    (response.data as AuthResponse & { data?: AuthResponse }).data ??
    response.data
  );
}

export async function registerSession(
  payload: RegisterRequest,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    "/auth/register",
    payload,
  );
  return (
    (response.data as AuthResponse & { data?: AuthResponse }).data ??
    response.data
  );
}

export async function refreshSession(
  refreshToken: string,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/refresh", {
    refreshToken,
  });
  return (
    (response.data as AuthResponse & { data?: AuthResponse }).data ??
    response.data
  );
}

export async function logoutSession(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refreshToken });
}

export function resolveDisplayName(user: AuthUser | null): string {
  if (!user) {
    return "Người dùng";
  }

  return user.username || user.email || "Người dùng";
}
