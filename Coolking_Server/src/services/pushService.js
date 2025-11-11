const admin = require('../config/firebase');
const UserMobileDevice = require('../repositories/UserMobileDevice.repo');

const sent = new Set(); // hoặc Redis

async function sendChatPush(toUserId, { messageId, chatId, senderName, text, chatName }) {
  const key = `${toUserId}:${messageId}`;
  if (sent.has(key)) return;
  sent.add(key); setTimeout(() => sent.delete(key), 60_000); // TTL 60s

  // lấy token distinct
  let tokens = await UserMobileDevice.getTokensByUserId(String(toUserId));
  tokens = [...new Set(tokens)];
  if (!tokens.length) return;
  // Title hiển thị: [Tên đoạn chat] • [Tên người gửi]
  const title = chatName || 'Tin nhắn mới';
  const body  = senderName
  ? `${senderName}: ${text || '[Tin nhắn mới]'}`
  : (text || '[Tin nhắn mới]');

  const msg = {
    tokens,
    notification: { title, body },
    android: {
      priority: 'high',
      collapseKey: `chat_${chatId}`,
      notification: {
        channelId: 'default',         // khớp kênh client
        tag: `chat:${chatId}`,        // cùng tag -> ghi đè/gộp
      },
    },
    data: {
      message_id: String(messageId),
      chat_id: String(chatId),
      chat_name: chatName || '',
      sender: senderName,
      preview: text || '',
    },
  };

  const resp = await admin.messaging().sendEachForMulticast(msg);

  // dọn token chết
  await Promise.all(resp.responses.map((r, i) => {
    if (!r.success) {
      const code = r.error?.errorInfo?.code || r.error?.code;
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-argument') {
        return UserMobileDevice.invalidateToken(tokens[i]);
      }
    }
  }));
}

module.exports = { sendChatPush };
