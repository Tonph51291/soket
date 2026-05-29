import { StyleSheet, View } from "react-native";

import { type ChatMessage } from "@/features/chat/types/chat.types";
import { Text } from "@/shared/components/ui/Text";
import { AppColors } from "@/shared/constants/colors";

type Props = {
  message: ChatMessage;
  isMine: boolean;
};

function formatMessageTime(createdAt?: string) {
  if (!createdAt) {
    return "";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({ message, isMine }: Props) {
  const timeLabel = formatMessageTime(message.createdAt);

  return (
    <View
      style={[
        styles.container,
        isMine ? styles.myContainer : styles.otherContainer,
      ]}
    >
      <View
        style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}
      >
        <Text
          variant="body"
          style={[
            styles.messageText,
            isMine ? styles.myMessageText : styles.otherMessageText,
          ]}
        >
          {message.text}
        </Text>

        {timeLabel ? (
          <Text
            variant="caption"
            style={[
              styles.timeText,
              isMine ? styles.myTimeText : styles.otherTimeText,
            ]}
          >
            {timeLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 12,
  },
  myContainer: {
    justifyContent: "flex-end",
  },
  otherContainer: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: AppColors.primary,
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  myMessageText: {
    color: AppColors.background,
  },
  otherMessageText: {
    color: AppColors.text,
  },
  timeText: {
    marginTop: 6,
    fontSize: 12,
  },
  myTimeText: {
    color: AppColors.primarySoft,
  },
  otherTimeText: {
    color: AppColors.mutedText,
  },
});
