import { forwardRef } from "react";
import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import { AppColors } from "@/shared/constants/colors";
import { Text } from "./Text";

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, style, ...props },
  ref,
) {
  return (
    <View style={styles.container}>
      <Text variant="caption" style={styles.label}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        {...props}
        placeholderTextColor={AppColors.mutedText}
        style={[styles.input, error && styles.inputError, style]}
      />
      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: AppColors.mutedText,
    fontWeight: "600",
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: AppColors.surface,
    color: AppColors.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: AppColors.danger,
    backgroundColor: "#FFF7F7",
  },
  error: {
    color: AppColors.danger,
  },
});
