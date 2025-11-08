import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_URL } from '@env';

const API_BASE = API_URL || 'https://e-contact-book-coolking-kvt4.onrender.com';

/** =========================
 *  Notification handler (Expo chỉ hỗ trợ 3 flag)
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

  // Kênh mặc định cho local notifications
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Chat Messages',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFFFFF',
  });

  // Kênh dùng bởi FCM (server gửi android.notification.channelId = "chat-messages")
  await Notifications.setNotificationChannelAsync('chat-messages', {
    name: 'Chat Messages',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFFFFF',
  });
}

/** Tránh upsert token lặp */
let lastUploadedToken: string | null = null;

/** Upload FCM token lên server */
async function uploadTokenToServer(userId: string, nativeToken: string) {
  const url = `${API_BASE}/api/public/upsert-token`; // giữ path bạn đang dùng
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

/** =========================
 *  Đăng ký push: trả về FCM token (Android) hoặc APNs token (iOS)
 *  ========================= */
export async function registerPushToken(userId: string) {
  if (!Device.isDevice) return null;

  await ensureAndroidChannels();

  // Quyền
  const { status: s0 } = await Notifications.getPermissionsAsync();
  const status =
    s0 === 'granted' ? s0 : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;

  // Token thiết bị (Android -> FCM)
  const devToken = await Notifications.getDevicePushTokenAsync();
  const nativeToken = (devToken as any)?.data ?? null;

  if (nativeToken && nativeToken !== lastUploadedToken) {
    const ok = await uploadTokenToServer(userId, nativeToken);
    if (ok) lastUploadedToken = nativeToken;
  }

  return nativeToken;
}

/** =========================
 *  DEDUP: nếu push FCM đã đến cho message_id này, đừng show local nữa
 *  ========================= */
const seenMessageIds = new Set<string>();

// Khi push (FCM) đến (kể cả foreground), đánh dấu message_id đã nhận
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
 *  Local notification dự phòng (khi app foreground & chưa nhận FCM)
 *  ========================= */
export async function maybeLocalNotifyMessage(params: {
  chatId: string;
  messageId: string;         // BẮT BUỘC: id duy nhất của tin nhắn
  title?: string;
  body?: string;
  data?: Record<string, any>;
}) {
  const { chatId, messageId, title, body, data } = params;

  // Nếu FCM đã đánh dấu message này -> không show local nữa
  if (seenMessageIds.has(messageId)) return;

    const chatName = (data as any)?.chat_name;
    const sender   = (data as any)?.sender;
    const finalTitle = title || (chatName ? `${chatName} • ${sender ?? ''}`.trim() : (sender ?? 'Tin nhắn mới'));

  await ensureAndroidChannels();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: finalTitle,
      body: body ?? 'Bạn có tin nhắn mới',
      data: { chat_id: chatId, message_id: messageId, chat_name: chatName || '', ...(data ?? {}) },
    },
    trigger: null, // hiển thị ngay
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

  // Cold start: nếu app mở từ noti
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
