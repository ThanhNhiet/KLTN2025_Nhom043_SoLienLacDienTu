// utils/notifications.ts (hoặc nơi bạn đang để)
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

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Chat Messages',
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
}

/** Tránh upsert token lặp */
let lastUploadedToken: string | null = null;

/** Upload FCM token lên server (LOGIN / mở app) */
async function uploadTokenToServer(userId: string, nativeToken: string) {
  console.log('[notifications] uploading token to server...');
  console.log('[notifications] userId:', userId);
  console.log('[notifications] nativeToken:', nativeToken);
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
  console.log('[notifications] logging out token from server...');
  console.log('[notifications] userId:', userId);
  console.log('[notifications] nativeToken:', nativeToken);
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
 *  DEDUP: nếu FCM đã đến cho message_id này, đừng show local nữa
 *  ========================= */
const seenMessageIds = new Set<string>();

Notifications.addNotificationReceivedListener((n) => {
  const id = String((n.request.content.data as any)?.message_id ?? '');
  if (id) seenMessageIds.add(id);
});

/** Click noti -> điều hướng vào chat */
export function attachNotificationNavigation(navigateToChat: (chatId: string) => void) {
  const tapSub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const data = resp.notification.request.content.data as any;
    if (data?.chat_id) navigateToChat(String(data.chat_id));
  });
  return () => {
    tapSub.remove();
  };
}

/** =========================
 *  Local notification dự phòng (foreground)
 *  Title = chatName (dòng 1), Body = sender: text (dòng 2)
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

  // Dòng 1: tên đoạn chat (hoặc fallback)
  const finalTitle =
    title || chatName || (sender ?? 'Tin nhắn mới');

  // Dòng 2: "Sender: nội dung" hoặc fallback
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
  navigateToChat: (chatId: string) => void,
  options?: { userId?: string }
) {
  await ensureAndroidChannels();

  let token: string | null = null;
  if (options?.userId) token = await registerPushToken(options.userId);

  try {
    const last = await Notifications.getLastNotificationResponseAsync();
    if (last) {
      const data = last.notification.request.content.data as any;
      if (data?.chat_id) navigateToChat(String(data.chat_id));
    }
  } catch (e) {
    console.warn('[notifications] getLastNotificationResponseAsync failed:', e);
  }

  const cleanup = attachNotificationNavigation(navigateToChat);
  return { token, cleanup, lastUploadedToken };
}
