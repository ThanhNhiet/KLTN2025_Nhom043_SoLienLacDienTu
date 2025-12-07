import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";

interface Props {
  navigation: any;
  profileNavigation: any;
  role?: string;
}
export default function TopNavigations_Profile({
  navigation,
  profileNavigation,
  role
}: Props) {


  return (
    <View style={styles.container}>
      {/* Avatar + Info */}
      <View style={styles.leftSection}>
        <Image source={{ uri: profileNavigation?.avatar || "https://i.pravatar.cc/150?img=3" }} style={styles.avatar} />
        <View style={styles.texts}>
          <Text style={styles.userName} numberOfLines={1}>
            {profileNavigation?.name || "Người dùng"}
          </Text>
          {role === 'STUDENT' ? (
            <Text style={styles.mssv} numberOfLines={1}>
              MSSV: {profileNavigation?.student_id || "SV000000"}
            </Text>
          ) : (
            <Text style={styles.mssv} numberOfLines={1}>
              Mã phụ huynh: {profileNavigation?.parent_id || "Chưa có mã"}
            </Text>
          )}
        </View>
      </View>

      {/* (tuỳ chọn) icon edit / settings ở bên phải */}
      {/* <Ionicons name="settings-outline" size={22} color="#4A4A4A" /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 76,
    backgroundColor: "#6e2febff",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    // viền dưới rất mảnh + bóng nhẹ
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EDEDED",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0, // cho phép text ellipsis
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F1F1F1",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  texts: {
    marginLeft: 12,
    flex: 1,
    minWidth: 0,
  },

  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e5f0f0ff",
    letterSpacing: 0.2,
  },

  mssv: {
    fontWeight: "bold",
    marginTop: 2,
    fontSize: 13,
    color: "#e5f0f0ff",
  },
});
