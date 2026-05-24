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
import { useRegister } from "../hooks/useRegister";

const registerSchema = z
  .object({
    username: z.string().trim().min(1, "Vui lòng nhập tên người dùng"),
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập email")
      .email("Email không hợp lệ"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp",
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterScreen() {
  const mutation = useRegister();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(({ confirmPassword, ...values }) => {
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
              eyebrow="Tạo tài khoản"
              title="Đăng ký tài khoản mới"
              subtitle="Chỉ vài thông tin là bạn có thể bắt đầu sử dụng ứng dụng."
            />

            <View style={styles.form}>
              <Controller
                control={control}
                name="username"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Input
                    autoCapitalize="words"
                    label="Tên người dùng"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Nguyễn Văn A"
                    value={value}
                    error={errors.username?.message}
                  />
                )}
              />

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
                    autoComplete="password-new"
                    autoCapitalize="none"
                    label="Mật khẩu"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Tối thiểu 8 ký tự"
                    secureTextEntry
                    value={value}
                    error={errors.password?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Input
                    autoComplete="password-new"
                    autoCapitalize="none"
                    label="Xác nhận mật khẩu"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Nhập lại mật khẩu"
                    secureTextEntry
                    value={value}
                    error={errors.confirmPassword?.message}
                  />
                )}
              />

              <Button
                loading={mutation.isPending}
                onPress={onSubmit}
                title="Đăng ký"
              />

              <Link href="/auth/login" asChild>
                <Text variant="link" style={styles.link}>
                  Đã có tài khoản? Đăng nhập
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
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: AppColors.primarySoft,
    opacity: 0.7,
  },
  bgBottom: {
    position: "absolute",
    bottom: 40,
    right: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: AppColors.surfaceAlt,
    opacity: 0.9,
  },
});
