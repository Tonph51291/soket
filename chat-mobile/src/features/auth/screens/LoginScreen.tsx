import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { z } from "zod";

import { Screen } from "../../../shared/components/layout/Screen";
import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { Text } from "../../../shared/components/ui/Text";
import { AppColors } from "../../../shared/constants/colors";
import { AuthHeader } from "../components/AuthHeader";
import { useLogin } from "../hooks/useLogin";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const mutation = useLogin();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values);
  });

  return (
    <Screen style={styles.screen}>
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <AuthHeader
              eyebrow="Xin chào"
              title="Đăng nhập để tiếp tục"
              subtitle="Sử dụng email và mật khẩu để vào ứng dụng chat."
            />

            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Input
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    keyboardType="email-address"
                    label="Email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="email@domain.com"
                    value={value}
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Input
                    autoComplete="password"
                    autoCapitalize="none"
                    label="Mật khẩu"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Nhập mật khẩu"
                    secureTextEntry
                    value={value}
                    error={errors.password?.message}
                  />
                )}
              />

              <Button
                loading={mutation.isPending}
                onPress={onSubmit}
                title="Đăng nhập"
              />

              <Link href="/auth/register" asChild>
                <Text variant="link" style={styles.link}>
                  Chưa có tài khoản? Đăng ký
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 28,
  },
  card: {
    gap: 28,
    borderRadius: 32,
    backgroundColor: AppColors.surface,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  form: {
    gap: 16,
  },
  link: {
    textAlign: "center",
    marginTop: 4,
  },
  bgTop: {
    position: "absolute",
    top: 0,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: AppColors.primarySoft,
    opacity: 0.7,
  },
  bgBottom: {
    position: "absolute",
    bottom: 40,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: AppColors.surfaceAlt,
    opacity: 0.9,
  },
});
