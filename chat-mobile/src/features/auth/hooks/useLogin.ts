import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";

import { showToast } from "../../../shared/components/feedback/Toast";
import { getAuthErrorMessage, loginSession } from "../services/auth.service";
import { useAuthStore } from "../store/authStore";
import type { LoginRequest } from "../types/auth.types";

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (payload: LoginRequest) => loginSession(payload),
    onSuccess: async (response) => {
      await setAuth(response.user, response.accessToken, response.refreshToken);
      router.replace("/(tabs)");
    },
    onError: (error) => {
      showToast(getAuthErrorMessage(error), "error");
    },
  });
}
