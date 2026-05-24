# Chat Mobile

Ứng dụng Expo Router + TypeScript strict mode với luồng đăng ký/đăng nhập dùng Zustand, TanStack Query, axios, React Hook Form, Zod và SecureStore.

## Cài đặt

```bash
npm install
```

## Chạy ứng dụng

```bash
npx expo start
```

## Biến môi trường

Tạo file `.env` từ `.env.example` và cấu hình:

```bash
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_APP_ENV=development
```

## Ghi chú

- Token được lưu bằng `expo-secure-store` trên iOS/Android.
- Home và Profile hiện là placeholder.
- Route auth dùng Expo Router: `/auth/login`, `/auth/register`, `/(tabs)`.
