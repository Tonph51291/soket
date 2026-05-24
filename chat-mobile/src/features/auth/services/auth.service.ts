import { create, isAxiosError } from "axios";

import { APP_CONFIG } from "../../../config/app.config";
import { ENV } from "../../../config/env.config";
import {
  type ApiError,
  type ApiResponse,
} from "../../../shared/types/api.types";

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserProfile,
} from "../types/auth.types";

type AuthMessageResponse = ApiResponse<AuthResponse>;

const AUTH_BASE_URL = ENV.API_URL;

function unwrapAuthResponse(
  payload: AuthMessageResponse | AuthResponse,
): AuthResponse {
  if ("data" in payload) {
    return payload.data;
  }

  return payload;
}

function createPublicClient() {
  return create({
    baseURL: AUTH_BASE_URL,
    timeout: APP_CONFIG.apiTimeoutMs,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

const publicClient = createPublicClient();

function getFirstErrorMessage(
  errors?: Record<string, string | string[]>,
): string | null {
  if (!errors) {
    return null;
  }

  const firstValue = Object.values(errors)[0];

  if (Array.isArray(firstValue)) {
    return firstValue[0] ?? null;
  }

  return firstValue ?? null;
}

export function getAuthErrorMessage(error: unknown): string {
  if (isAxiosError<ApiError>(error)) {
    console.log(error);
    const serverMessage = error.response?.data.message;
    const fieldMessage = getFirstErrorMessage(error.response?.data.errors);

    if (serverMessage) {
      return serverMessage;
    }

    if (fieldMessage) {
      return fieldMessage;
    }

    if (!error.response) {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.";
    }

    return error.message || "Đã xảy ra lỗi không xác định.";
  }

  return "Đã xảy ra lỗi không xác định.";
}

export async function loginSession(
  payload: LoginRequest,
): Promise<AuthResponse> {
  const response = await publicClient.post<AuthResponse>(
    "/api/auth/login",
    payload,
  );

  return unwrapAuthResponse(response.data);
}

export async function registerSession(
  payload: RegisterRequest,
): Promise<AuthResponse> {
  const response = await publicClient.post<AuthResponse>(
    "/api/auth/register",
    payload,
  );

  return unwrapAuthResponse(response.data);
}

export async function refreshSession(
  refreshToken: string,
): Promise<AuthResponse> {
  const response = await publicClient.post<AuthMessageResponse | AuthResponse>(
    "/api/auth/refresh",
    { refreshToken },
  );

  return unwrapAuthResponse(response.data);
}

export async function logoutSession(refreshToken: string): Promise<void> {
  await publicClient.post("/api/auth/logout", { refreshToken });
}

export function resolveDisplayName(user: UserProfile | null): string {
  if (!user) {
    return "Người dùng";
  }

  return user.username || user.email;
}
