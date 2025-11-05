import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";


interface Props {
  navigation: any;
}
enum TabName {
  HomeScreen = "HomeScreen",
  AttendanceScreen = "AttendanceScreen",
  CalendarScreen = "CalendarScreen",
  AttendanceScreen_Parent = "AttendanceScreen_Parent",
  CalendarScreen_Parent = "CalendarScreen_Parent",
  ProfileScreen = "ProfileScreen",
}

export default function BottomNavigations({ navigation }: Props) {
  const route = useRoute();
  const [activeTab, setActiveTab] = useState(route.name);

  const tabs = [
    { name: "HomeScreen", label: "Trang chủ", icon: "home-outline", iconActive: "home" },
    { name: "AttendanceScreen", label: "Điểm danh", icon: "checkmark-circle-outline", iconActive: "checkmark-circle" },
    { name: "CalendarScreen", label: "Lịch", icon: "calendar-outline", iconActive: "calendar" },
    { name: "ProfileScreen", label: "Hồ sơ", icon: "person-outline", iconActive: "person" },
  ];

  useEffect(() => {
    // Cập nhật khi route thay đổi
    setActiveTab(route.name);
  }, [route.name]);

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

  return (
     <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#e6f4fa" }}>
    <View style={styles.container}>
      {tabs.map((tab) => {
        let isActive = activeTab === tab.name;
        if (tab.name === TabName.AttendanceScreen) {
          isActive = activeTab === TabName.AttendanceScreen || activeTab === TabName.AttendanceScreen_Parent;
        }
        if (tab.name === TabName.CalendarScreen) {
          isActive = activeTab === TabName.CalendarScreen || activeTab === TabName.CalendarScreen_Parent;
        }
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.button}
            onPress={() => handleNavigate(tab.name)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isActive ? (tab.iconActive as any) : (tab.icon as any)}
              size={28}
              color={isActive ? "#007AFF" : "#666"}
            />
            <Text style={[styles.text, isActive && styles.textActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 65,
    backgroundColor: "#e6f4fa",
    borderTopWidth: 1,
    borderTopColor: "#cfd8dc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 6,
  },
  button: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    marginTop: 3,
    color: "#666",
    fontWeight: "500",
  },
  textActive: {
    color: "#007AFF",
    fontWeight: "700",
  },
});
