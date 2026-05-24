import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";

import { showToast } from "../../../shared/components/feedback/Toast";
import { getAuthErrorMessage, registerSession } from "../services/auth.service";
import type { RegisterRequest } from "../types/auth.types";

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterRequest) => registerSession(payload),
    onSuccess: () => {
      showToast("Đăng ký thành công. Vui lòng đăng nhập.", "success");
      router.replace("/auth/login");
    },
    onError: (error) => {
      showToast(getAuthErrorMessage(error), "error");
    },
  });
}
