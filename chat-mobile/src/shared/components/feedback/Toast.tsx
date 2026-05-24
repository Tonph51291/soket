import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/shared/components/ui/Text";
import { AppColors } from "@/shared/constants/colors";

type ToastVariant = "success" | "error" | "info";

type ToastState = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastListener = (toast: ToastState | null) => void;

let currentToast: ToastState | null = null;
let currentTimer: ReturnType<typeof setTimeout> | null = null;
let nextToastId = 1;
const listeners = new Set<ToastListener>();

function broadcast(toast: ToastState | null) {
  currentToast = toast;
  listeners.forEach((listener) => listener(toast));
}

export function showToast(message: string, variant: ToastVariant = "info") {
  if (currentTimer) {
    clearTimeout(currentTimer);
  }

  const toast = {
    id: nextToastId,
    message,
    variant,
  } satisfies ToastState;

  nextToastId += 1;
  broadcast(toast);

  currentTimer = setTimeout(() => {
    broadcast(null);
    currentTimer = null;
  }, 3000);
}

export function hideToast() {
  if (currentTimer) {
    clearTimeout(currentTimer);
    currentTimer = null;
  }

  broadcast(null);
}

export function Toast() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(currentToast);

  useEffect(() => {
    listeners.add(setToast);

    return () => {
      listeners.delete(setToast);
    };
  }, []);

  if (!toast) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { top: insets.top + 12 }]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={hideToast}
        style={[
          styles.toast,
          toast.variant === "success" && styles.success,
          toast.variant === "error" && styles.error,
          toast.variant === "info" && styles.info,
        ]}
      >
        <Text variant="body" style={styles.message}>
          {toast.message}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
  },
  toast: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  success: {
    backgroundColor: AppColors.successSoft,
    borderColor: "#86EFAC",
  },
  error: {
    backgroundColor: AppColors.dangerSoft,
    borderColor: "#FCA5A5",
  },
  info: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
  },
  message: {
    fontWeight: "600",
  },
});
