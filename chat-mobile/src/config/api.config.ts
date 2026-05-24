import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { APP_CONFIG } from "@/config/app.config";
import { ENV } from "@/config/env.config";
import { refreshSession } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/store/authStore";
import { showToast } from "@/shared/components/feedback/Toast";
import { type ApiError } from "@/shared/types/api.types";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const baseURL = ENV.API_URL;

export const authHttpClient = axios.create({
  baseURL,
  timeout: APP_CONFIG.apiTimeoutMs,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiClient = axios.create({
  baseURL,
  timeout: APP_CONFIG.apiTimeoutMs,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<void> | null = null;

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry || originalRequest.url?.includes("/api/auth/")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const authState = useAuthStore.getState();
    const refreshToken = authState.refreshToken;

    if (!refreshToken) {
      await authState.logout();
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = refreshSession(refreshToken)
          .then(async (response) => {
            const currentUser = response.user ?? useAuthStore.getState().user;
            await useAuthStore
              .getState()
              .setAuth(
                currentUser,
                response.accessToken,
                response.refreshToken ?? refreshToken,
              );
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      await refreshPromise;

      const nextAccessToken = useAuthStore.getState().accessToken;

      if (nextAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      }

      return apiClient(originalRequest);
    } catch {
      showToast("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "error");
      await useAuthStore.getState().logout();
      return Promise.reject(error);
    }
  },
);
