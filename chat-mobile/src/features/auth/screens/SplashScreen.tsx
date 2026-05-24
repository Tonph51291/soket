import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Text } from "@/shared/components/ui/Text";
import { AppColors } from "@/shared/constants/colors";

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator color={AppColors.primary} size="large" />
        <Text variant="subtitle" style={styles.title}>
          Đang khởi động ứng dụng
        </Text>
        <Text variant="caption" style={styles.subtitle}>
          Kiểm tra trạng thái đăng nhập an toàn.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.background,
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: AppColors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 28,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  title: {
    textAlign: "center",
    marginTop: 4,
  },
  subtitle: {
    textAlign: "center",
    color: AppColors.mutedText,
  },
});
