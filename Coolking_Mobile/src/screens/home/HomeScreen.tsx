import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useNavigation,useFocusEffect } from "@react-navigation/native";
import BottomNavigation from "@/src/components/navigations/BottomNavigations";
import TopNavigations_Home from "@/src/components/navigations/TopNavigations_Home";
import { useProfile } from "@/src/services/useapi/profile/UseProfile";
import { useCalendar } from "@/src/services/useapi/calendar/UseCalender";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import {Ionicons } from "@expo/vector-icons";

type TodayItem = {
  id: string;
  title: string;
  type: "study" | "exam";
  timeText: string;
  startLesson?: number;
  endLesson?: number;
  location?: string;
  lecturer?: string;
  status?: string;
};

// Danh sách các chức năng để dễ dàng quản lý và render
const features = [
  { id: "1", title: "Lịch học", icon: "calendar-outline", screen: "CalendarScreen" },
  { id: "2", title: "Xem điểm", icon: "school-outline", screen: "ScoreScreen" },
  { id: "3", title: "Nhắn tin", icon: "chatbubble-outline", screen: "ChatScreen" },
  { id: "4", title: "Điểm danh", icon: "checkmark-circle-outline", screen: "AttendanceScreen" },
  { id: "5", title: "Mật khẩu", icon: "lock-closed-outline", screen: "ProfileChangePasswordScreen" },
  // Thêm các chức năng khác ở đây
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { profileNavigation, role, avatarUrl, fetchProfile,isLoading } = useProfile();
  const { loading, getSchedulesByDate } = useCalendar();
  const isParent = role === "PARENT";

   // ✅ Refresh profile when screen is focused (returning from ProfileDetailScreen)
    useFocusEffect(
      React.useCallback(() => {
        fetchProfile();
      }, [fetchProfile])
    );

  // ✅ Memoize profile data - include avatarUrl
    const memoizedProfileNav = useMemo(() => ({
      ...profileNavigation,
      avatar: avatarUrl
    }), [profileNavigation?.name, avatarUrl]);
    
    const memoizedRole = useMemo(() => role, [role]);

  const todayStr = dayjs().format("YYYY-MM-DD");

   const handleNavigate = async (screen: string) => {
    try {
      const rawRole = await AsyncStorage.getItem("role");
      const role = rawRole ? rawRole.toUpperCase() : undefined;

      // Define routes that depend on role
      const roleBasedRoutes: Record<string, Partial<Record<'STUDENT' | 'PARENT', string>>> = {
        AttendanceScreen: { STUDENT: "AttendanceScreen", PARENT: "AttendanceScreen_Parent" },
        CalendarScreen: { STUDENT: "CalendarScreen", PARENT: "CalendarScreen_Parent" },
        ScoreScreen: { STUDENT: "ScoreScreen", PARENT: "ScoreScreen_Parent" },
      };

      // If screen has role-specific variants, pick appropriately
      if (roleBasedRoutes[screen]) {
        const routes = roleBasedRoutes[screen];
        if (!role) {
          // No role: fallback to STUDENT route if available, otherwise first available route
          const fallback = routes.STUDENT ?? Object.values(routes)[0];
          if (fallback) {
            navigation.navigate(fallback as any);
          } else {
            console.warn(`No route available for screen "${screen}"`);
          }
          return;
        }

        const target = (routes as any)[role] ?? routes.STUDENT;
        if (target) {
          navigation.navigate(target as any);
        } else {
          console.warn(`No route mapping for role "${role}" and screen "${screen}"`);
        }
        return;
      }

      // Default: navigate to the provided screen
      navigation.navigate(screen as any);
    } catch (error) {
      console.warn("handleNavigate failed:", error);
    }
  };

  // Lấy lịch hôm nay
  const todayEvents = useMemo<TodayItem[]>(() => {
    const list = getSchedulesByDate(todayStr);
    return list.map((s) => ({
      id: s.id,
      title: s.subjectName,
      type: s.type === "EXAM" ? "exam" : "study",
      startLesson: s.start_lesson,
      endLesson: s.end_lesson,
      timeText: `Tiết ${s.start_lesson}-${s.end_lesson}`,
      location: s.room,
      lecturer: s.lecturerName,
      status: s.status,
    }));
  }, [getSchedulesByDate, todayStr]);

  // 🔹 Render từng item
  const renderTodayItem = ({ item }: { item: TodayItem }) => {
    const isStudy = item.type === "study";
    const isPractical = !!item.location && /^TH[\s\-_]?/i.test(item.location);
    const color = isStudy ? (isPractical ? "#22C55E" : "#2E86DE") : "#E74C3C";
    const dotStyle = [styles.dot, { backgroundColor: color }];



    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.row}
        onPress={() => navigation.navigate("CalendarScreen")}
      >
        <View style={styles.rowLeft}>
          <View style={dotStyle} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.rowMeta} numberOfLines={1}>
              {item.timeText}
              {!!item.location && ` • ${item.location}`}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.badge,
            isStudy
              ? isPractical
                ? { backgroundColor: "#EAFBF1", color: "#22C55E", borderColor: "#BEF3D0" }
                : { backgroundColor: "#E8F1FE", color: "#2E86DE", borderColor: "#C7DBF9" }
              : { backgroundColor: "#FDECEC", color: "#E74C3C", borderColor: "#FAC8C6" },
          ]}
        >
          {item.type === "exam" ? "Thi" : isPractical ? "Học TH" : "Học LT"}
        </Text>
      </TouchableOpacity>
    );
  };

  // ✅ Update header with new avatar
    if (isLoading) {
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
          backgroundColor={Platform.OS === "android" ? "#F7F8FA" : "transparent"}
          translucent={false}
          animated
        />

        {/* Top Navigation */}
        <TopNavigations_Home navigation={navigation} profileNavigation={memoizedProfileNav} />

        {/* Nội dung chính - Sử dụng FlatList làm main container */}
        <FlatList
          style={styles.content}
          data={[{ id: "sections" }]}
          keyExtractor={(item) => item.id}
          renderItem={() => (
            <>
              {/* Card Lịch học hôm nay */}
              {isParent ? null : (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>Lịch học hôm nay</Text>
                  <TouchableOpacity onPress={() => navigation.navigate("CalendarScreen")}>
                    <Text style={styles.link}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>

                {loading ? (
                  <Text style={{ color: "#64748b", fontStyle: "italic" }}>Đang tải...</Text>
                ) : todayEvents.length === 0 ? (
                  <Text style={{ color: "#64748b", fontStyle: "italic" }}>Hôm nay bạn không có lịch học.</Text>
                ) : (
                  <FlatList
                    data={todayEvents}
                    renderItem={renderTodayItem}
                    keyExtractor={(i) => i.id}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    nestedScrollEnabled={false}
                  />
                )}
              </View>)}

              {/* Card Chức năng */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Chức năng</Text>
                <View style={styles.featuresGrid}>
                  {features.map((feature) => (
                    <TouchableOpacity
                      key={feature.id}
                      style={styles.featureButton}
                      onPress={() => handleNavigate(feature.screen)}
                    >
                      <View style={styles.iconContainer}>
                        <Ionicons name={feature.icon as any} size={30} color="#007bff" />
                      </View>
                      <Text style={styles.featureText}>{feature.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        />

        {/* Bottom Navigation */}
        <View style={styles.bottomWrapper}>
          <BottomNavigation navigation={navigation} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// --------- Nút chức năng gọn ----------
function FeatureButton({
  label,
  sub,
  onPress,
}: {
  label: string;
  sub?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.featureItem} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.featureBtn}>
        <Text style={styles.featureText}>{label}</Text>
        {!!sub && <Text style={styles.featureSub}>{sub}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },

  content: {
    flex: 1,
  },

  // ==== Card chung ====
  // Style cho Card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    // Thêm bóng đổ cho đẹp hơn
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 12,
  },
   featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureButton: {
    width: '48%', // Chia làm 2 cột
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  link: { color: "#2563EB", fontSize: 13, fontWeight: "700" },

  emptyWrap: {
    paddingVertical: 12,
  },
  emptyText: { color: "#64748B", fontSize: 14, fontWeight: "500" },

  // ==== Row sự kiện hôm nay ====
  row: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  rowMeta: { fontSize: 12, fontWeight: "600", color: "#64748B", marginTop: 2 },

  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    includeFontPadding: false,
    textAlignVertical: "center",
  },

  // ==== Chức năng ====
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginTop: 8,
  },
  featureItem: { width: "50%", paddingHorizontal: 6, paddingVertical: 6 },
  featureBtn: {
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  featureText: { color: "#0F172A", fontSize: 14, fontWeight: "800" },
  featureSub: { color: "#64748B", fontSize: 12, marginTop: 2, fontWeight: "500" },

  // ==== Bottom nav holder ====
  bottomWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
