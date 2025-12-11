import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import BottomNavigation from "@/src/components/navigations/BottomNavigations";
import TopNavigations_Profile from"@/src/components/navigations/TopNavigations_Profile";
import { useLogin_out } from "@/src/services/useapi/Login/UseLogin_Forgot";
import { useProfile } from "@/src/services/useapi/profile/UseProfile";

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { getlogout } = useLogin_out();
  const { profileNavigation, role, loading, avatarUrl, fetchProfile } = useProfile();
  const [busy, setBusy] = React.useState(false);

  // ✅ Memoize profile data - include avatarUrl
  const memoizedProfileNav = useMemo(() => ({
    ...profileNavigation,
    avatar: avatarUrl
  }), [profileNavigation?.name, avatarUrl]);
  
  const memoizedRole = useMemo(() => role, [role]);

  // ✅ Refresh profile when screen is focused (returning from ProfileDetailScreen)
  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  type MenuItem = {
    title: string;
    icon: string;
    route?: string;
    onPress?: () => Promise<void> | void;
  };

  const data: MenuItem[] = [
    { title: "Thông tin cá nhân", icon: "person-outline", route: "ProfileDetailScreen" },
    { title: "Đổi mật khẩu", icon: "lock-closed-outline", route: "ProfileChangePasswordScreen" },
    { title: "Thông báo", icon: "notifications-outline", route: "Notifications" },
    { title: "Đăng xuất", icon: "log-out-outline", onPress: async () => { await getlogout(); } },
  ];

  const renderItem = ({ item }: { item: MenuItem }) => {
    const handleLogout = (item: MenuItem) => {
      Alert.alert("Xác nhận", "Bạn có chắc chắn muốn đăng xuất?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            if (busy) return;
            try {
              setBusy(true);
              await item.onPress?.();
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Lỗi", "Đăng xuất không thành công. Vui lòng thử lại.");
            } finally {
              setBusy(false);
            }
          },
        },
      ]);
    };

    const onPressItem = () => {
      if (item.onPress) return handleLogout(item);
      if (item.route) return navigation.navigate(item.route);
    };

    return (
      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.7}
        onPress={onPressItem}
        disabled={busy && !!item.onPress}
      >
        <View style={styles.itemLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name={item.icon as any} size={22} color="#007AFF" />
          </View>
          <Text style={styles.itemText}>{item.title}</Text>
        </View>

        {!item.onPress && <Ionicons name="chevron-forward" size={20} color="#999" />}
      </TouchableOpacity>
    );
  };

  // ✅ Update header with new avatar
  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar
            barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
            backgroundColor={Platform.OS === "android" ? "#f8f9fa" : "transparent"}
            translucent={false}
            animated
          />
          <View style={styles.loadingContainer}>
            <Text>Đang tải...</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
          backgroundColor={Platform.OS === "android" ? "#f8f9fa" : "transparent"}
          translucent={false}
          animated
        />

        {/* Top Navigation - gets updated avatar */}
        <TopNavigations_Profile
          navigation={navigation}
          profileNavigation={memoizedProfileNav}
          role={memoizedRole ?? undefined}
        />

        {/* Nội dung chính */}
        <View style={styles.content}>
          <FlatList
            data={data}
            keyExtractor={(item) => item.title}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{ backgroundColor: "#fff" }}
          />
        </View>

        {/* Thanh điều hướng dưới */}
        <View style={styles.bottomWrapper}>
          <BottomNavigation navigation={navigation} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  content: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingTop: 8,
  },

  bottomWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
  },

  // ============ Danh sách menu ============
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18, // cao hơn (trước 14)
    paddingHorizontal: 22, // rộng hơn
    backgroundColor: "#fff",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 44, // to hơn (trước 38)
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E8F1FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16, // tăng khoảng cách
  },
  itemText: {
    fontSize: 17, // chữ lớn hơn
    fontWeight: "600",
    color: "#222",
  },
  separator: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginLeft: 80, // canh đều với icon mới
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

