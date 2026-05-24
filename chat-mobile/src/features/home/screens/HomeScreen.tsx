import { StyleSheet, View } from "react-native";

import { Screen } from "@/shared/components/layout/Screen";
import { Text } from "@/shared/components/ui/Text";
import { AppColors } from "@/shared/constants/colors";

export function HomeScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.card}>
        <Text variant="title">Trang chủ</Text>
        <Text variant="body" style={styles.description}>
          Tính năng này đang được hoàn thiện. Hiện tại bạn đang ở màn hình
          placeholder cho phần Home.
        </Text>
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
