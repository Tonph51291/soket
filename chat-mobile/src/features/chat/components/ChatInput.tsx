import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Text } from "@/shared/components/ui/Text";
import { AppColors } from "@/shared/constants/colors";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({
  value,
  onChangeText,
  onSend,
  disabled = false,
  placeholder = "Nhập tin nhắn...",
}: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={AppColors.mutedText}
        style={styles.input}
        editable={!disabled}
        returnKeyType="send"
        onSubmitEditing={onSend}
      />

      <Pressable
        onPress={onSend}
        disabled={disabled}
        style={({ pressed }) => [
          styles.sendButton,
          disabled && styles.sendButtonDisabled,
          pressed && !disabled && styles.sendButtonPressed,
        ]}
      >
        <Text variant="link" style={styles.sendLabel}>
          Gửi
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 22,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    color: AppColors.text,
    borderRadius: 16,
    backgroundColor: AppColors.background,
  },
  sendButton: {
    minWidth: 70,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary,
    paddingHorizontal: 14,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendButtonPressed: {
    backgroundColor: AppColors.primaryDark,
  },
  sendLabel: {
    color: AppColors.background,
  },
});
