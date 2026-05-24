import { ActivityIndicator, Modal, StyleSheet, View } from "react-native";

import { AppColors } from "@/shared/constants/colors";

type Props = {
  visible: boolean;
};

export function LoadingOverlay({ visible }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator color={AppColors.primary} size="large" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(16, 32, 51, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: AppColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
