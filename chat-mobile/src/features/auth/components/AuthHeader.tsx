import { StyleSheet, View } from "react-native";

import { Text } from "@/shared/components/ui/Text";
import { AppColors } from "@/shared/constants/colors";

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function AuthHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text variant="caption" style={styles.badgeText}>
          {eyebrow}
        </Text>
      </View>
      <Text variant="title" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" style={styles.subtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: AppColors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: AppColors.primaryDark,
    fontWeight: "700",
  },
  title: {
    maxWidth: 320,
  },
  subtitle: {
    color: AppColors.mutedText,
    maxWidth: 320,
  },
});
