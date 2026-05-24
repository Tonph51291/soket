import { StyleSheet, View } from "react-native";

import { useAuthStore } from "@/features/auth/store/authStore";
import { Screen } from "@/shared/components/layout/Screen";
import { Button } from "@/shared/components/ui/Button";
import { Text } from "@/shared/components/ui/Text";
import { AppColors } from "@/shared/constants/colors";

export function ProfileScreen() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  return (
    <Screen style={styles.screen}>
      <View style={styles.card}>
        <Text variant="title">Hồ sơ</Text>
        <Text variant="body" style={styles.description}>
          Tính năng này đang được hoàn thiện.
          {user ? ` Tài khoản hiện tại: ${user.username}.` : ""}
        </Text>
        <Button
          variant="secondary"
          onPress={() => void logout()}
          title="Đăng xuất"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    justifyContent: "center",
  },
  card: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    gap: 12,
  },
  description: {
    color: AppColors.mutedText,
  },
});
