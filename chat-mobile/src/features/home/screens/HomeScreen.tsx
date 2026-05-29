import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useCreatePrivateRoomMutation } from "@/features/chat/hooks/useCreatePrivateRoomMutation";
import { useListQuery } from "@/features/chat/hooks/useUseListQuery";
import { showToast } from "@/shared/components/feedback/Toast";
import { Screen } from "@/shared/components/layout/Screen";
import { IconSymbol } from "@/shared/components/ui/icon-symbol";
import { Text } from "@/shared/components/ui/Text";
import { AppColors } from "@/shared/constants/colors";

type UserItem = {
  id: string;
  username?: string | null;
  email: string;
  avatar?: string | null;
};

export function HomeScreen() {
  const { data: users = [], isLoading } = useListQuery();
  const createRoomMutation = useCreatePrivateRoomMutation();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const openChat = async (item: UserItem) => {
    const displayName = item.username?.trim() || item.email;

    if (!currentUserId) {
      showToast("Không tìm thấy người dùng hiện tại.", "error");
      return;
    }

    try {
      setLoadingUserId(item.id);

      const room = await createRoomMutation.mutateAsync({
        userId: item.id,
      });
      console.log("Created room:", room);

      router.push({
        pathname: "/chat" as never,
        params: {
          roomId: room.id ?? room._id ?? "",
          userId: item.id,
          userName: displayName,
          userEmail: item.email,
        },
      });
    } catch {
      showToast("Không tạo được phòng chat. Vui lòng thử lại.", "error");
    } finally {
      setLoadingUserId(null);
    }
  };

  const renderItem = ({ item }: { item: UserItem }) => {
    const displayName = item.username?.trim() || item.email;
    const avatarLabel = displayName.charAt(0).toUpperCase();
    const isLoadingRoom = loadingUserId === item.id;

    return (
      <Pressable onPress={() => void openChat(item)} style={styles.userCard}>
        <View style={styles.avatar}>
          <Text variant="subtitle" style={styles.avatarText}>
            {avatarLabel}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text variant="subtitle" numberOfLines={1}>
            {displayName}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        <View style={styles.iconButton}>
          {isLoadingRoom ? (
            <ActivityIndicator size="small" color={AppColors.primary} />
          ) : (
            <IconSymbol
              name="paperplane.fill"
              size={20}
              color={AppColors.primary}
            />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text variant="title">Người dùng</Text>
        <Text variant="body" style={styles.description}>
          Chọn một người để bắt đầu nhắn tin.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={AppColors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="subtitle">Chưa có người dùng</Text>
              <Text variant="caption" style={styles.description}>
                Danh sách sẽ hiển thị ở đây khi có dữ liệu.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 16,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    gap: 12,
  },
  description: {
    color: AppColors.mutedText,
  },
  loading: {
    paddingVertical: 24,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 6,
  },
  separator: {
    height: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary,
  },
  avatarText: {
    color: AppColors.background,
    fontWeight: "800",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.background,
  },
});
