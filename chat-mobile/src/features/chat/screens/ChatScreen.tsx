import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { ChatInput } from "@/features/chat/components/ChatInput";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { useChatSocket } from "@/features/chat/hooks/useChatSocket";
import { useRoomMessagesQuery } from "@/features/chat/hooks/useRoomMessagesQuery";
import { Screen } from "@/shared/components/layout/Screen";
import { Text } from "@/shared/components/ui/Text";
import { AppColors } from "@/shared/constants/colors";

type ChatParams = {
  roomId?: string | string[];
  userId?: string | string[];
  userName?: string | string[];
  userEmail?: string | string[];
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<ChatParams>();
  const roomId = firstValue(params.roomId) ?? "";
  const userId = firstValue(params.userId) ?? "";
  const userName = firstValue(params.userName) ?? "Người dùng";
  const userEmail = firstValue(params.userEmail) ?? "";

  const [messageText, setMessageText] = useState("");

  const { messages, isLoading, isError, error, refetch } =
    useRoomMessagesQuery(roomId);

  const {
    isConnected,
    isConnecting,
    connectionError,
    sendMessage,
    retryConnection,
  } = useChatSocket({
    userId,
    roomId,
    enabled: Boolean(roomId && userId),
  });

  const displayMessages = useMemo(() => [...messages].reverse(), [messages]);

  const avatarLabel = useMemo(() => {
    return userName.trim().charAt(0).toUpperCase() || "U";
  }, [userName]);

  const statusLabel = useMemo(() => {
    if (isConnecting) {
      return "Đang kết nối...";
    }

    return isConnected ? "Đã kết nối" : "Mất kết nối";
  }, [isConnected, isConnecting]);

  const handleSendMessage = useCallback(() => {
    const trimmedText = messageText.trim();

    if (!trimmedText) {
      return;
    }

    sendMessage(trimmedText);
    setMessageText("");
  }, [messageText, sendMessage]);

  const renderMessageItem = useCallback(
    ({ item }: { item: (typeof displayMessages)[number] }) => (
      <MessageBubble message={item} isMine={item.senderId === userId} />
    ),
    [userId],
  );

  const keyExtractor = useCallback(
    (item: (typeof displayMessages)[number]) => item.id,
    [],
  );

  const handleRetryPress = useCallback(() => {
    retryConnection();
  }, [retryConnection]);

  const handleRefetchPress = useCallback(() => {
    void refetch();
  }, [refetch]);

  const apiErrorMessage = useMemo(() => {
    if (!isError) {
      return null;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Không thể tải lịch sử tin nhắn.";
  }, [error, isError]);

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text variant="link">Quay lại</Text>
          </Pressable>

          <View style={styles.headerCard}>
            <View style={styles.avatar}>
              <Text variant="subtitle" style={styles.avatarText}>
                {avatarLabel}
              </Text>
            </View>

            <View style={styles.headerInfo}>
              <Text variant="subtitle" numberOfLines={1}>
                {userName}
              </Text>
              <Text variant="caption" numberOfLines={1}>
                {userEmail}
              </Text>
              <Text
                variant="caption"
                style={styles.roomIdText}
                numberOfLines={1}
              >
                Phòng: {roomId || "Chưa có roomId"}
              </Text>
              <Text
                variant="caption"
                style={styles.statusText}
                numberOfLines={1}
              >
                {statusLabel}
              </Text>
            </View>
          </View>

          {connectionError ? (
            <View style={styles.errorBox}>
              <Text variant="body" style={styles.errorText}>
                {connectionError}
              </Text>

              <Pressable onPress={handleRetryPress} style={styles.retryButton}>
                <Text variant="link" style={styles.retryText}>
                  Thử lại
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.messagePanel}>
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={AppColors.primary} />
              <Text variant="caption" style={styles.loadingText}>
                Đang tải lịch sử tin nhắn...
              </Text>
            </View>
          ) : null}

          {apiErrorMessage ? (
            <View style={styles.errorBox}>
              <Text variant="body" style={styles.errorText}>
                {apiErrorMessage}
              </Text>

              <Pressable
                onPress={handleRefetchPress}
                style={styles.retryButton}
              >
                <Text variant="link" style={styles.retryText}>
                  Tải lại
                </Text>
              </Pressable>
            </View>
          ) : null}

          {isConnecting ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={AppColors.primary} />
              <Text variant="caption" style={styles.loadingText}>
                Đang khởi tạo Socket.IO...
              </Text>
            </View>
          ) : null}

          <FlatList
            data={displayMessages}
            keyExtractor={keyExtractor}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text variant="subtitle">Chưa có tin nhắn</Text>
                <Text variant="caption" style={styles.emptyStateText}>
                  Hãy gửi lời nhắn đầu tiên để bắt đầu cuộc trò chuyện.
                </Text>
              </View>
            }
          />
        </View>

        <ChatInput
          value={messageText}
          onChangeText={setMessageText}
          onSend={handleSendMessage}
          disabled={!isConnected}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 20,
  },
  keyboard: {
    flex: 1,
    gap: 16,
  },
  header: {
    gap: 12,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
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
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  roomIdText: {
    color: AppColors.primaryDark,
  },
  statusText: {
    color: AppColors.success,
  },
  errorBox: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: AppColors.dangerSoft,
    borderWidth: 1,
    borderColor: AppColors.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: AppColors.danger,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
  },
  retryText: {
    color: AppColors.danger,
  },
  messagePanel: {
    flex: 1,
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    color: AppColors.mutedText,
  },
  messageListContent: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    marginTop: 8,
    textAlign: "center",
  },
});
