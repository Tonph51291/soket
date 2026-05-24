import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppColors } from "@/shared/constants/colors";
import { Text } from "./Text";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={variant === "primary" ? "#FFFFFF" : AppColors.primary}
          />
        ) : null}
        <Text
          variant="subtitle"
          style={[
            styles.label,
            variant === "primary" && styles.labelPrimary,
            variant === "ghost" && styles.labelGhost,
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  secondary: {
    backgroundColor: AppColors.surfaceAlt,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
  labelPrimary: {
    color: "#FFFFFF",
  },
  labelGhost: {
    color: AppColors.primary,
  },
});
