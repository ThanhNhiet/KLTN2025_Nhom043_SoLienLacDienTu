import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, Text, TextInput } from "react-native";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppRouter from "@/src/router/AppRouter";
import { checkAndRefreshSession } from "@/src/services/auth/checkSession";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initNotifications } from "./src/utils/notifications";
import { useFonts } from "expo-font";

export default function App() {
  // =========================
  // HOOKS
  // =========================
  const [fontsLoaded] = useFonts({
    "BeVietnam-Regular": require("./src/assets/frond/BeVietnamPro-Regular.ttf"),
    "BeVietnam-Bold": require("./src/assets/frond/BeVietnamPro-Bold.ttf"),
  });

  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const pendingChatRef = useRef<string | null>(null);
  const navLockRef = useRef(false);
  const [checking, setChecking] = useState(true);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [userID, setUserID] = useState<string>("");
  const hasSetDefaultFont = useRef(false);

  // =========================
  // HELPER FUNCTIONS
  // =========================
  const lockNavigation = (ms = 2000) => {
    navLockRef.current = true;
    setTimeout(() => {
      navLockRef.current = false;
    }, ms);
  };

  const safeNavigateToChat = (chatId: string) => {
    // khóa điều hướng để tránh bị reset về Login/Home ngay khi từ push mở vào
    lockNavigation(2500);

    if (!navigationRef.current || !navigationRef.current.isReady()) {
      // navigator chưa sẵn sàng → lưu lại, khi onReady sẽ xử lý
      pendingChatRef.current = chatId;
      return;
    }

    navigationRef.current.navigate("MessageScreen" as any, { chatId });
  };

  const handleNavigation = (ok: boolean) => {
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

  // =========================
  // INIT NOTIFICATIONS
  // =========================
  // ...
useEffect(() => {
  if (!userID) return;

  let cleanupFn: (() => void) | null = null;

  initNotifications(
    // navigateToChat
    (chatId) => {
      if (!navigationRef.current?.isReady()) return;
      navigationRef.current.navigate("MessageScreen" as any, { chatId });
    },
    // navigateToAlert
    () => {
      if (!navigationRef.current?.isReady()) return;
      navigationRef.current.navigate("HomeScreen" as any);
    },
    // options
    { userId: userID }
  )
    .then((res) => {
      cleanupFn = res?.cleanup ?? null;
    })
    .catch((err) => console.warn("initNotifications error", err));

  return () => {
    if (cleanupFn) cleanupFn();
  };
}, [userID]);

  // =========================
  // CHECK SESSION + NAVIGATION
  // =========================
  useEffect(() => {
    const init = async () => {
      try {
        const ok = await checkAndRefreshSession();

        const storedUserID = await AsyncStorage.getItem("userId");
        setUserID(storedUserID || "");

        if (!isNavigationReady) {
          return;
        }

        if (pendingChatRef.current && navigationRef.current?.isReady?.()) {
          const chatId = pendingChatRef.current;
          pendingChatRef.current = null;
          safeNavigateToChat(chatId!);
          return;
        }

        handleNavigation(ok);
      } catch (error) {
        console.error("❌ Init error:", error);
      } finally {
        setChecking(false);
      }
    };

    init();
  }, [isNavigationReady]);

  // =========================
  // SET DEFAULT FONT
  // =========================
  useEffect(() => {
    if (fontsLoaded && !hasSetDefaultFont.current) {
      hasSetDefaultFont.current = true;

      const TextAny = Text as any;
      const TextInputAny = TextInput as any;

      if (TextAny.defaultProps == null) TextAny.defaultProps = {};
      if (TextInputAny.defaultProps == null) TextInputAny.defaultProps = {};

      TextAny.defaultProps.style = [
        TextAny.defaultProps.style,
        { fontFamily: "BeVietnam-Regular" },
      ];

      TextInputAny.defaultProps.style = [
        TextInputAny.defaultProps.style,
        { fontFamily: "BeVietnam-Bold" },
      ];
    }
  }, [fontsLoaded]);

  // =========================
  // LOADING UI
  // =========================
  if (!fontsLoaded || checking) {
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

  // =========================
  // RENDER APP
  // =========================
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        setIsNavigationReady(true);
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
