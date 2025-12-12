// utils/notifications.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_URL } from '@env';

const API_BASE = API_URL || 'https://e-contact-book-coolking-kvt4.onrender.com';

/** =========================
 *  Notification handler
 *  ========================= */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** =========================
 *  Android notification channels
 *  ========================= */
async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFFFFF',
  });

  await Notifications.setNotificationChannelAsync('chat-messages', {
    name: 'Chat Messages',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFFFFF',
  });

  await Notifications.setNotificationChannelAsync('general-alerts', {
    name: 'General Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFFFFF',
  });
}

/** =========================
 *  Tránh upsert token lặp
 *  ========================= */
let lastUploadedToken: string | null = null;

/** Upload FCM token lên server (LOGIN / mở app) */
async function uploadTokenToServer(userId: string, nativeToken: string) {
  const url = `${API_BASE}/api/public/upsert-token`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token: nativeToken, platform: Platform.OS }),
    });
    if (!res.ok) {
      console.warn(`[notifications] upload token -> ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[notifications] upload token failed:', e);
    return false;
  }
}

/** Gỡ token trên server (LOGOUT) */
async function logoutTokenFromServer(userId: string, nativeToken: string) {
  const url = `${API_BASE}/api/public/logout-device`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token: nativeToken }),
    });
    if (!res.ok) {
      console.warn(`[notifications] logout token -> ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[notifications] logout token failed:', e);
    return false;
  }
}

/** =========================
 *  Đăng ký push: trả về native token
 *  ========================= */
export async function registerPushToken(userId: string) {
  if (!Device.isDevice) return null;

  await ensureAndroidChannels();

  const { status: s0 } = await Notifications.getPermissionsAsync();
  const status =
    s0 === 'granted' ? s0 : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;

  const devToken = await Notifications.getDevicePushTokenAsync();
  const nativeToken = (devToken as any)?.data ?? null;

  if (nativeToken && nativeToken !== lastUploadedToken) {
    const ok = await uploadTokenToServer(userId, nativeToken);
    if (ok) lastUploadedToken = nativeToken;
  }

  return nativeToken;
}

/** =========================
 *  Unregister khi LOGOUT
 *  ========================= */
export async function unregisterPushToken(userId: string) {
  if (!Device.isDevice) return;

  try {
    const devToken = await Notifications.getDevicePushTokenAsync();
    const nativeToken = (devToken as any)?.data ?? null;
    if (!nativeToken) return;

    const ok = await logoutTokenFromServer(userId, nativeToken);
    if (ok && lastUploadedToken === nativeToken) {
      lastUploadedToken = null;
    }
  } catch (e) {
    console.warn('[notifications] unregister token failed:', e);
  }
}

/** =========================
 *  DEDUP + handle ALERT (KHÔNG spam)
 *  ========================= */
const seenMessageIds = new Set<string>();

Notifications.addNotificationReceivedListener((n) => {
  const data = n.request.content.data as any;

  // Dùng cho chat: lưu message_id để tránh bắn local trùng
  const id = String(data?.message_id ?? '');
  if (id) seenMessageIds.add(id);

  // ALERT: chỉ log (không schedule local, tránh vòng lặp)
  if (data?.type === 'alert') {
    console.log('[notifications] received general-alerts:', {
      title: n.request.content.title,
      body: n.request.content.body,
      data,
    });
  }
});

/** =========================
 *  Click noti -> điều hướng vào chat / ALERT SCREEN
 *  ========================= */
export function attachNotificationNavigation(
  navigateToChat?: (chatId: string) => void,
  navigateToAlert?: () => void
) {
  const tapSub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const data = resp.notification.request.content.data as any;

    if (data?.chat_id && typeof navigateToChat === 'function') {
      // Case: noti chat → điều hướng vào màn chat
      navigateToChat(String(data.chat_id));
    } else if (data?.type === 'alert') {
      // Case: general-alerts → chuyển sang màn Alert nếu có callback
      if (typeof navigateToAlert === 'function') {
        navigateToAlert();
      } else {
        console.log('[notifications] user tapped general-alerts (no navigateToAlert provided):', {
          title: resp.notification.request.content.title,
          body: resp.notification.request.content.body,
          data,
        });
      }
    }
  });

  return () => {
    tapSub.remove();
  };
}

/** =========================
 *  Local notification dự phòng (foreground) cho CHAT
 *  ========================= */
export async function maybeLocalNotifyMessage(params: {
  chatId: string;
  messageId: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
}) {
  const { chatId, messageId, title, body, data } = params;

  if (seenMessageIds.has(messageId)) return;

  const chatName = (data as any)?.chat_name;
  const sender = (data as any)?.sender;

  const finalTitle =
    title || chatName || (sender ?? 'Tin nhắn mới');

  const previewBody =
    body ??
    (sender ? `${sender}: Bạn có tin nhắn mới` : 'Bạn có tin nhắn mới');

  await ensureAndroidChannels();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: finalTitle,
      body: previewBody,
      data: {
        chat_id: chatId,
        message_id: messageId,
        chat_name: chatName || '',
        sender: sender || '',
        ...(data ?? {}),
      },
    },
    trigger: null,
  });
}

/** =========================
 *  Khởi tạo notifications (gọi ở root)
 *  ========================= */
export async function initNotifications(
  navigateToChat?: (chatId: string) => void,
  navigateToAlert?: () => void,
  options?: { userId?: string }
) {
  await ensureAndroidChannels();

  let token: string | null = null;
  if (options?.userId) token = await registerPushToken(options.userId);

  try {
    const last = await Notifications.getLastNotificationResponseAsync();
    if (last) {
      const data = last.notification.request.content.data as any;

      if (data?.chat_id && typeof navigateToChat === 'function') {
        navigateToChat(String(data.chat_id));
      } else if (data?.type === 'alert') {
        if (typeof navigateToAlert === 'function') {
          navigateToAlert();
        } else {
          console.log('[notifications] last general-alerts tapped from killed state:', {
            title: last.notification.request.content.title,
            body: last.notification.request.content.body,
            data,
          });
        }
      }
    }
  } catch (e) {
    console.warn('[notifications] getLastNotificationResponseAsync failed:', e);
  }

  const cleanup = attachNotificationNavigation(navigateToChat, navigateToAlert);
  return { token, cleanup, lastUploadedToken };
}
