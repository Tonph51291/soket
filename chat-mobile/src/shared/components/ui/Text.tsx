import { Text as RNText, StyleSheet, type TextProps } from "react-native";

import { AppColors } from "@/shared/constants/colors";

type Variant = "body" | "title" | "subtitle" | "caption" | "link";

type Props = TextProps & {
  variant?: Variant;
};

export function Text({ variant = "body", style, ...props }: Props) {
  return <RNText {...props} style={[styles.base, styles[variant], style]} />;
}

const styles = StyleSheet.create({
  base: {
    color: AppColors.text,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.mutedText,
  },
  link: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.primary,
    fontWeight: "700",
  },
});
