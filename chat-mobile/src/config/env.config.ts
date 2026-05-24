export const ENV = {
  APP_ENV: globalThis.process?.env.EXPO_PUBLIC_APP_ENV ?? "development",
  API_URL: (
    globalThis.process?.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:4000"
  ).replace(/\/+$/, ""),
};
