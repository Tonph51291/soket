import { router } from "expo-router";
import { create } from "zustand";

import {
  logoutSession,
  refreshSession,
} from "@/features/auth/services/auth.service";
import type { AuthUser } from "@/features/auth/types/auth.types";
import { secureStorage } from "@/shared/hooks/useSecureStorage";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_PROFILE_KEY = "user_profile";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  isInitialized: boolean;
  setAuth: (
    user: AuthUser,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
};

function parseStoredUser(value: string | null): AuthUser | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as AuthUser;

    if (
      typeof parsed.id === "string" &&
      typeof parsed.username === "string" &&
      (parsed.email === undefined ||
        parsed.email === null ||
        typeof parsed.email === "string") &&
      (parsed.avatar === undefined ||
        parsed.avatar === null ||
        typeof parsed.avatar === "string") &&
      (parsed.roles === undefined ||
        (Array.isArray(parsed.roles) &&
          parsed.roles.every((role) => typeof role === "string"))) &&
      (parsed.iat === undefined || typeof parsed.iat === "number") &&
      (parsed.exp === undefined || typeof parsed.exp === "number")
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function hasRequiredTokens(payload: {
  accessToken?: string;
  refreshToken?: string;
}): payload is { accessToken: string; refreshToken: string } {
  return (
    typeof payload.accessToken === "string" &&
    typeof payload.refreshToken === "string"
  );
}

async function persistAuth(
  user: AuthUser,
  accessToken: string,
  refreshToken: string,
) {
  await Promise.all([
    secureStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
    secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
    secureStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user)),
  ]);
}

async function clearStoredAuth() {
  await Promise.all([
    secureStorage.deleteItem(ACCESS_TOKEN_KEY),
    secureStorage.deleteItem(REFRESH_TOKEN_KEY),
    secureStorage.deleteItem(USER_PROFILE_KEY),
  ]);
}

function setLoggedOutState(set: (partial: Partial<AuthState>) => void) {
  set({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoggedIn: false,
    isInitialized: true,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoggedIn: false,
  isInitialized: false,
  setAuth: async (user, accessToken, refreshToken) => {
    await persistAuth(user, accessToken, refreshToken);

    set({
      user,
      accessToken,
      refreshToken,
      isLoggedIn: true,
      isInitialized: true,
    });
  },
  logout: async () => {
    const refreshToken = get().refreshToken;

    setLoggedOutState(set);

    await clearStoredAuth();

    if (refreshToken) {
      try {
        await logoutSession(refreshToken);
      } catch {
        // Best effort only.
      }
    }

    router.replace("/auth/login");
  },
  initialize: async () => {
    try {
      const [storedAccessToken, storedRefreshToken, storedUser] =
        await Promise.all([
          secureStorage.getItem(ACCESS_TOKEN_KEY),
          secureStorage.getItem(REFRESH_TOKEN_KEY),
          secureStorage.getItem(USER_PROFILE_KEY),
        ]);

      const user = parseStoredUser(storedUser);

      if (storedAccessToken && storedRefreshToken) {
        set({
          user,
          accessToken: storedAccessToken,
          refreshToken: storedRefreshToken,
          isLoggedIn: true,
          isInitialized: true,
        });

        return;
      }

      if (storedRefreshToken) {
        try {
          const refreshed = await refreshSession(storedRefreshToken);

          if (!hasRequiredTokens(refreshed)) {
            throw new Error(
              "Refresh response thiếu accessToken hoặc refreshToken",
            );
          }

          await persistAuth(
            refreshed.user,
            refreshed.accessToken,
            refreshed.refreshToken,
          );

          set({
            user: refreshed.user,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            isLoggedIn: true,
            isInitialized: true,
          });

          return;
        } catch {
          await clearStoredAuth();
        }
      }

      setLoggedOutState(set);
    } catch {
      setLoggedOutState(set);
    }
  },
}));
