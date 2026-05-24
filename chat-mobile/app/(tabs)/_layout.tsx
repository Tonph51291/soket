import { Redirect, Tabs } from "expo-router";
import React from "react";

import { SplashScreen } from "@/features/auth/screens/SplashScreen";
import { useAuthStore } from "@/features/auth/store/authStore";
import { HapticTab } from "@/shared/components/haptic-tab";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { Colors } from "@/shared/constants/theme";
import { useColorScheme } from "@/shared/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  if (!isInitialized) {
    return <SplashScreen />;
  }

  if (!isLoggedIn) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="person.crop.circle.fill"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
