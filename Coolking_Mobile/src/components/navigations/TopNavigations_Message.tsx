import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";

interface Props {
  navigation: any;
  chatPartner: {chatID: string; name: string; avatar: string; isOnline: boolean; };
  // THÊM Props
  onShowPinned: () => void; // Hàm gọi khi nhấn nút pin
  hasPinnedMessages: boolean; // Để ẩn/hiện nút pin
};

export default function TopNavigations_Message({ navigation, chatPartner, onShowPinned, hasPinnedMessages }: Props) {
  const ICON_COLOR = "#FFFFFF";

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate("ChatScreen")} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={ICON_COLOR} />
      </TouchableOpacity>
      <Image source={{ uri: chatPartner.avatar }} style={styles.headerAvatar} />
      <View style={styles.headerInfo}>
        <Text style={styles.headerName} numberOfLines={1} ellipsizeMode='tail'>{chatPartner.name}</Text>
        {chatPartner.isOnline && <Text style={styles.headerStatus}>Đang hoạt động</Text>}
      </View>

      <View style={styles.headerActions}>
        {/* THÊM: Nút hiển thị tin nhắn ghim */}
        {hasPinnedMessages && ( // Chỉ hiện khi có tin ghim
             <TouchableOpacity style={styles.actionButton} onPress={onShowPinned}>
                <Ionicons name="pin-outline" size={22} color={ICON_COLOR} />
            </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={() => {navigation.navigate("MessageDetailScreen", { chatID: chatPartner.chatID });}}>
          <Ionicons name="ellipsis-vertical-outline" size={26} color={ICON_COLOR} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "#6A3DE8",
  },
  backButton: {
    paddingRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,       // Let it grow
    flexShrink: 1, // !! Tell it to shrink if necessary !!
    justifyContent: 'center',
    marginRight: 10,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    // Ellipsis is handled by numberOfLines/ellipsizeMode on the Text itself
  },
  headerStatus: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    // Should stay fixed on the right now
  },
  actionButton: {
      marginLeft: 12,
  }
});