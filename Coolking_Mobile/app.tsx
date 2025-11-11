import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppRouter from "@/src/router/AppRouter";
import { checkAndRefreshSession } from "@/src/services/auth/checkSession";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initNotifications } from "./src/utils/notifications";

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // ChatId được nhận từ tap notification trước khi navigator sẵn sàng
  const pendingChatRef = useRef<string | null>(null);

  // Khóa điều hướng: khi true thì KHÔNG được auto reset bởi checkSession
  const navLockRef = useRef(false);
  const lockNavigation = (ms = 2000) => {
    navLockRef.current = true;
    // tự mở khóa sau một thời gian ngắn để tránh khóa vĩnh viễn
    setTimeout(() => (navLockRef.current = false), ms);
  };

  const [checking, setChecking] = useState(true);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [userID, setUserID] = useState<string>("");

  const safeNavigateToChat = (chatId: string) => {
    // kích hoạt khóa để các auto-redirect khác không đè
    lockNavigation(2500);
    if (!navigationRef.current || !navigationRef.current.isReady()) {
      pendingChatRef.current = chatId; // sẽ điều hướng sau khi ready
      return;
    }
    navigationRef.current.navigate("MessageScreen" as any, { chatId });
  };

  const handleNavigation = (ok: boolean) => {
    // Nếu đang khóa điều hướng (vì có tap noti) → bỏ qua reset
    if (navLockRef.current || pendingChatRef.current) return false;
    if (!navigationRef.current || !isNavigationReady) return false;

    try {
      const targetScreen = ok ? "HomeScreen" : "LoginScreen";
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: targetScreen }],
      });
      return true;
    } catch (error) {
      console.error("❌ Navigation failed:", error);
      return false;
    }
  };

  // ❶ Khởi tạo notifications SỚM để bắt cold-start từ noti
  useEffect(() => {
    let cleanupFn: (() => void) | null = null;

    initNotifications(safeNavigateToChat, { userId: userID })
      .then(({ cleanup }) => {
        cleanupFn = cleanup;
      })
      .catch((err) => console.warn("initNotifications error", err));

    return () => {
      if (cleanupFn) cleanupFn();
    };
    // chỉ phụ thuộc userID để đăng ký token đúng user
  }, [userID]);

  // ❷ Kiểm tra session và điều hướng mặc định (chỉ khi không có/không vừa xử lý noti)
  useEffect(() => {
    const init = async () => {
      try {
        const ok = await checkAndRefreshSession();

        // Lấy userId để đăng ký push token đúng user
        const storedUserID = await AsyncStorage.getItem("userId");
        setUserID(storedUserID || "");

        if (!isNavigationReady) {
          // Đợi navigator sẵn sàng để tránh reset ngược
          return;
        }

        // Nếu có pendingChat (do user tap noti trước khi ready) → điều hướng vào chat và KHÔNG reset
        if (pendingChatRef.current && navigationRef.current?.isReady?.()) {
          const chatId = pendingChatRef.current;
          pendingChatRef.current = null;
          safeNavigateToChat(chatId!);
          return;
        }

        // Nếu không có pending & không bị khóa → cho phép reset theo session
        handleNavigation(ok);
      } catch (error) {
        console.error("❌ Init error:", error);
      } finally {
        setChecking(false);
      }
    };

    init();
  }, [isNavigationReady]); // re-run khi navigator ready

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        setIsNavigationReady(true);
        // Nếu có pending do đã tap noti trước khi ready → điều hướng ngay và khóa reset
        if (pendingChatRef.current && navigationRef.current?.isReady?.()) {
          const chatId = pendingChatRef.current;
          pendingChatRef.current = null;
          safeNavigateToChat(chatId!);
        }
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppRouter />
      </GestureHandlerRootView>
    </NavigationContainer>
  );
}
