import React, { useMemo, useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  FlatList,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import BottomNavigation from "@/src/components/navigations/BottomNavigations";
import TopNavigations_Profile from "@/src/components/navigations/TopNavigations_Profile";
import { useLogin_out } from "@/src/services/useapi/Login/UseLogin_Forgot";
import { useProfile } from "@/src/services/useapi/profile/UseProfile";
import { unregisterPushToken, registerPushToken } from '@/src/utils/notifications';
import { deleteNotifile, getNotifile, saveNotifile } from '@/src/utils/TokenManager';




export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { getlogout } = useLogin_out();
  const { profileNavigation, role, loading, avatarUrl, fetchProfile } = useProfile();

  const [busy, setBusy] = useState(false);
  const [notiEnabled, setNotiEnabled] = useState(true);

  // ✅ Load toggle state
  useEffect(() => {
    (async () => {
      try {
        const saved = await getNotifile();
        if (saved !== null) setNotiEnabled(saved === "true");
      } catch (e) {
        console.error("Load noti setting error:", e);
      }
    })();
  }, []);

  // ✅ Toggle handler
  const toggleNotifications = async (next: boolean) => {
    try {
      setNotiEnabled(next);
      const userId = await AsyncStorage.getItem("userId");
     
      if (!userId) throw new Error("No user ID found for notification toggle.");

      if (next) {
       
        await registerPushToken(userId);
        await saveNotifile(next);

      } else {
       
        await unregisterPushToken(userId);
        await saveNotifile(next);
      }
    } catch (e) {
      console.error("Toggle noti error:", e);
      Alert.alert("Lỗi", "Không thể cập nhật cài đặt thông báo.");
      setNotiEnabled((prev) => !prev); // rollback
    }
  };

  // ✅ Memoize profile data - include avatarUrl
  const memoizedProfileNav = useMemo(
    () => ({
      ...profileNavigation,
      avatar: avatarUrl,
    }),
    [profileNavigation?.name, avatarUrl]
  );

  const memoizedRole = useMemo(() => role, [role]);

  // ✅ Refresh profile when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  type MenuItem = {
    title: string;
    icon: string;
    route?: string;
    onPress?: () => Promise<void> | void;
    type?: "switch";
  };

  const data: MenuItem[] = [
    { title: "Thông tin cá nhân", icon: "person-outline", route: "ProfileDetailScreen" },
    { title: "Đổi mật khẩu", icon: "lock-closed-outline", route: "ProfileChangePasswordScreen" },

    // ✅ Switch thay vì chuyển màn
    { title: "Thông báo", icon: "notifications-outline", type: "switch" },

    { title: "Đăng xuất", icon: "log-out-outline", onPress: async () =>{ await getlogout() }},
  ];

  const renderItem = ({ item }: { item: MenuItem }) => {
    const isSwitch = item.type === "switch";

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
      if (isSwitch) return; // ✅ switch không navigate
      if (item.onPress) return handleLogout(item);
      if (item.route) return navigation.navigate(item.route);
    };

    return (
      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.7}
        onPress={onPressItem}
        disabled={(busy && !!item.onPress) || isSwitch}
      >
        <View style={styles.itemLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name={item.icon as any} size={22} color="#007AFF" />
          </View>
          <Text style={styles.itemText}>{item.title}</Text>
        </View>

        {isSwitch ? (
          <Switch value={notiEnabled} onValueChange={toggleNotifications} />
        ) : (
          !item.onPress && <Ionicons name="chevron-forward" size={20} color="#999" />
        )}
      </TouchableOpacity>
    );
  };

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

        <TopNavigations_Profile
          navigation={navigation}
          profileNavigation={memoizedProfileNav}
          role={memoizedRole ?? undefined}
        />

        <View style={styles.content}>
          <FlatList
            data={data}
            keyExtractor={(item) => item.title}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{ backgroundColor: "#fff" }}
          />
        </View>

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

  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 22,
    backgroundColor: "#fff",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E8F1FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
  },
  separator: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginLeft: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
