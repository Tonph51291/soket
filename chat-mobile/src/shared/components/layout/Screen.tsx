import { type PropsWithChildren } from "react";
import { SafeAreaView, StyleSheet, View, type ViewStyle } from "react-native";

import { AppColors } from "@/shared/constants/colors";

type Props = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function Screen({ children, style }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  container: {
    flex: 1,
  },
});
