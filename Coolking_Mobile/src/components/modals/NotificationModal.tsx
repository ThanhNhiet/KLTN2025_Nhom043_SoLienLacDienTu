import React, { useMemo, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type NotificationItem = {
  _id: string;
  senderID: string;
  receiverID: string | null; // null = broadcast
  header: string;
  body?: string;
  targetScope: "all" | "person" | string; // thêm union để IDE rõ hơn
  isRead?: boolean;
  createdAt: string;
  updatedAt?: string;
};

interface Props {
  visible: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onPressItem: () => void;
  onMarkAllRead: () => void;               // vẫn giữ signature cũ
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (alertId: string) => Promise<void>;
  markSystemNotificationAsRead: (alertId: string) => Promise<void>;
  getDeleteSystemNotification: (alertId: string) => Promise<void>;
}

const formatTime = (input: string | number | Date) => {
  const d = new Date(input);

  // Kiểm tra xem đối tượng Date có hợp lệ không. Nếu không, trả về chuỗi lỗi.
  if (isNaN(d.getTime())) {
    // Giá trị không hợp lệ
    return "Thời gian không hợp lệ"; 
  }

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0
  const yyyy = d.getFullYear();

  // Định dạng theo yêu cầu (HH:MM • DD/MM/YYYY)
  return `${hh}:${mm} • ${dd}/${mo}/${yyyy}`;
};

type TabKey = "system" | "personal";

export default function NotificationModal({
  visible,
  notifications,
  onClose,
  onPressItem,
  onMarkAllRead,
  fetchNotifications,
  markNotificationAsRead,
  markSystemNotificationAsRead,
  getDeleteSystemNotification

}: Props) {
  const [tab, setTab] = useState<TabKey>("system");

  // Phân loại
  const { systemList, personalList, systemUnread, personalUnread } = useMemo(() => {
    const system = notifications.filter(n => n.targetScope === "all" && n.receiverID == null);
    const personal = notifications.filter(n => n.targetScope === "person" || n.receiverID != null);
    const sysUnread = system.filter(n => !n.isRead).length;
    const perUnread = personal.filter(n => !n.isRead).length;
    return {
      systemList: system,
      personalList: personal,
      systemUnread: sysUnread,
      personalUnread: perUnread,
    };
  }, [notifications]);

  const data = tab === "system" ? systemList : personalList;

const handlePressItem = useCallback(
  async (item: NotificationItem) => {
    try {
      // Hiển thị nội dung thông báo
      Alert.alert(
        item.header,
        item.body || "Không có nội dung",
        [
          {
            text: "Đóng",
            onPress: async () => {
              // Đánh dấu đã đọc
              if (item.targetScope === "all" && item.receiverID === null && item.isRead === false) {
                await markSystemNotificationAsRead(item._id);
              } else {
                await markNotificationAsRead(item._id);
              }
              await fetchNotifications();
              onPressItem();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Lỗi khi xử lý thông báo:", error);
    }
  },
  [markSystemNotificationAsRead, markNotificationAsRead, fetchNotifications, onPressItem]
);

  

  const handleMarkAllRead = useCallback(async() => {
    // Bạn có thể thay bằng onMarkAllReadSystem/onMarkAllReadPersonal nếu muốn tách.
    // Ở đây giữ nguyên prop cũ để không thay đổi API:
      await onMarkAllRead();
      await fetchNotifications();
      onPressItem();
  }, [onMarkAllRead]);

  const renderItem = ({ item }: { item: NotificationItem }) => {
     
  const unread = !item.isRead;
  const isSystem = item.targetScope === "all" && item.receiverID == null;

  // Giả sử bạn có hàm này để xử lý việc xóa
  const handleDeleteItem = async (itemId: string) => {
    if (isSystem) {
   Alert.alert("Xác nhận", "Bạn có muốn xoá thông báo này?", [
               { text: "Hủy", style: "cancel" },
               {
                 text: "Đồng ý",
                 style: "destructive",
                 onPress: async () => {
                   await getDeleteSystemNotification(itemId);
                   await fetchNotifications();
                   onPressItem();
                 },
               },
             ]);
    } else {
      Alert.alert("Thông báo", "Chỉ có thể xoá thông báo hệ thống.");
    }
  };

  return (
    <TouchableOpacity
      style={[styles.item, unread && styles.itemUnread]}
      activeOpacity={0.75}
      onPress={() => handlePressItem(item)}
    >
      {/* Phần icon bên trái (không đổi) */}
      <View style={styles.iconWrap}>
        <Ionicons
          name={isSystem ? "megaphone-outline" : "person-circle-outline"}
          size={22}
          color={unread ? "#0A58FF" : "#667085"}
        />
      </View>

      {/* Phần nội dung text (không đổi) */}
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={[styles.itemTitle, unread && styles.itemTitleUnread]} numberOfLines={2}>
          {item.header}
        </Text>
        {!!item.body && (
          <Text style={styles.itemBody} numberOfLines={2}>
            {item.body}
          </Text>
        )}
        <Text style={styles.itemTime}>Ngày tạo: {item.createdAt}</Text>
      </View>

      {/* NÚT XÓA MỚI THÊM VÀO */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteItem(item._id)} // Gọi hàm xóa với ID của item
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} 
      >
        <Ionicons
          name="close-outline" // Icon 'x'
          size={24}
          color="#98A2B3" // Màu xám cho icon xóa
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thông báo</Text>
            {data.length > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.markAll}>Đã đọc hết</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "system" && styles.tabBtnActive]}
              onPress={() => setTab("system")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === "system" && styles.tabTextActive]}>
                Hệ thống
              </Text>
              {systemUnread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{systemUnread}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tab === "personal" && styles.tabBtnActive]}
              onPress={() => setTab("personal")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === "personal" && styles.tabTextActive]}>
                Cá nhân
              </Text>
              {personalUnread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{personalUnread}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Danh sách */}
          {data.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#aaa" />
              <Text style={styles.emptyText}>Không có thông báo</Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(it) => it._id}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "92%",
    maxHeight: "76%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 12,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  markAll: {
    color: "#0A58FF",
    fontWeight: "700",
    fontSize: 14,
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    padding: 4,
    marginBottom: 10,
    alignSelf: "stretch",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#111827",
  },

  badge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 9,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  item: {
    flexDirection: 'row', // Đảm bảo các thành phần nằm trên một hàng
    alignItems: 'center', // Căn giữa theo chiều dọc
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    backgroundColor: 'white',
  },
  itemUnread: {
    backgroundColor: '#F0F5FF',
  },
  iconWrap: {
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#344054',
  },
  itemTitleUnread: {
    fontWeight: '600',
    color: '#101828',
  },
  itemBody: {
    fontSize: 14,
    color: '#667085',
    marginTop: 2,
  },
  itemTime: {
    fontSize: 12,
    color: '#667085',
    marginTop: 4,
    fontWeight:'bold'
  },
  separator: { height: 8 },
  empty: { alignItems: "center", paddingVertical: 30 },
  emptyText: { color: "#9CA3AF", marginTop: 6, fontWeight: "600" },
  deleteButton: {
    padding: 4, // Tạo một chút không gian xung quanh icon
    justifyContent: 'center',
    alignItems: 'center',
  },
});
