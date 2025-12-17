import React, { useEffect, useRef, useState, useCallback } from "react";
import { ActivityIndicator, View, Text, TextInput } from "react-native";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppRouter from "@/src/router/AppRouter";
import { checkAndRefreshSession } from "@/src/services/auth/checkSession";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initNotifications } from "./src/utils/notifications";
import { useFonts } from "expo-font";

export default function App() {
  const [fontsLoaded] = useFonts({
    "BeVietnam-Regular": require("./src/assets/frond/BeVietnamPro-Regular.ttf"),
    "BeVietnam-Bold": require("./src/assets/frond/BeVietnamPro-Bold.ttf"),
  });

  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  const pendingChatRef = useRef<string | null>(null);
  const pendingAlertRef = useRef<boolean>(false);
  const navLockRef = useRef(false);

  const [isNavigationReady, setIsNavigationReady] = useState(false);

  const [checking, setChecking] = useState(true);      // ✅ bootstrap loading
  const [userID, setUserID] = useState<string>("");    // ✅ lấy từ storage
  const [isAuthed, setIsAuthed] = useState<boolean>(false); // ✅ kết quả check session

  const hasSetDefaultFont = useRef(false);

  // =========================
  // Helpers
  // =========================
  const lockNavigation = (ms = 2000) => {
    navLockRef.current = true;
    setTimeout(() => {
      navLockRef.current = false;
    }, ms);
  };

  const safeNavigateToChat = useCallback((chatId: string) => {
    lockNavigation(2500);
    if (!navigationRef.current || !navigationRef.current.isReady()) {
      pendingChatRef.current = chatId;
      return;
    }
    navigationRef.current.navigate("MessageScreen" as any, { chatId });
  }, []);

  const safeNavigateToAlert = useCallback(() => {
    lockNavigation(2500);
    if (!navigationRef.current || !navigationRef.current.isReady()) {
      pendingAlertRef.current = true;
      return;
    }
    navigationRef.current.navigate("HomeScreen" as any);
    // nếu chưa có AlertScreen thì đổi thành HomeScreen
    // navigationRef.current.navigate("HomeScreen" as any);
  }, []);

  const resetTo = useCallback((screenName: string) => {
    if (!navigationRef.current || !navigationRef.current.isReady()) return;
    navigationRef.current.reset({
      index: 0,
      routes: [{ name: screenName as any }],
    });
  }, []);

  // =========================
  // 1) BOOTSTRAP: check session trước khi show Login/Home
  // =========================
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // 1. đọc userId trước
        const storedUserID = await AsyncStorage.getItem("userId");
        const uid = storedUserID || "";
        setUserID(uid);

        // 2. nếu không có userId => chắc chắn chưa login
        if (!uid) {
          setIsAuthed(false);
          return;
        }

        // 3. có userId => check/refresh session
        const ok = await checkAndRefreshSession();
        setIsAuthed(!!ok);
      } catch (e) {
        console.error("❌ bootstrap error:", e);
        setIsAuthed(false);
      } finally {
        setChecking(false);
      }
    };

    bootstrap();
  }, []);

  // =========================
  // 2) Khi nav ready + bootstrap done => reset route đúng màn
  // =========================
  useEffect(() => {
    if (!isNavigationReady) return;
    if (checking) return;

    // nếu đang xử lý noti thì đừng reset đè lên
    if (navLockRef.current || pendingChatRef.current || pendingAlertRef.current) return;

    resetTo(isAuthed ? "HomeScreen" : "LoginScreen");
  }, [isNavigationReady, checking, isAuthed, resetTo]);

  // =========================
  // 3) Init notifications sau khi có userID
  // =========================
  useEffect(() => {
    if (!userID) return;

    let cleanupFn: (() => void) | null = null;

    initNotifications(
      (chatId) => safeNavigateToChat(chatId),
      () => safeNavigateToAlert(),
      { userId: userID }
    )
      .then((res) => {
        cleanupFn = res?.cleanup ?? null;
      })
      .catch((err) => console.warn("initNotifications error", err));

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [userID, safeNavigateToChat, safeNavigateToAlert]);

  // =========================
  // 4) Set default font
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
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

        // ưu tiên xử lý noti pending ngay khi navigator ready
        if (pendingChatRef.current && navigationRef.current?.isReady?.()) {
          const chatId = pendingChatRef.current;
          pendingChatRef.current = null;
          safeNavigateToChat(chatId!);
          return;
        }

        if (pendingAlertRef.current && navigationRef.current?.isReady?.()) {
          pendingAlertRef.current = false;
          safeNavigateToAlert();
          return;
        }
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppRouter />
      </GestureHandlerRootView>
    </NavigationContainer>
  );
}
