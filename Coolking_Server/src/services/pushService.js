// const admin = require('../config/firebase');
// const UserMobileDevice = require('../repositories/UserMobileDevice.repo');

// const sent = new Set(); // hoặc Redis

// async function sendChatPush(toUserId, { messageId, chatId, senderName, text, chatName }) {
//   const key = `${toUserId}:${messageId}`;
//   if (sent.has(key)) return;
//   sent.add(key); setTimeout(() => sent.delete(key), 60_000); // TTL 60s

//   // lấy token distinct
//   let tokens = await UserMobileDevice.getTokensByUserId(String(toUserId));
//   tokens = [...new Set(tokens)];
//   if (!tokens.length) return;
//   // Title hiển thị: [Tên đoạn chat] • [Tên người gửi]
//   const title = chatName || 'Tin nhắn mới';
//   const body  = senderName
//   ? `${senderName}: ${text || '[Tin nhắn mới]'}`
//   : (text || '[Tin nhắn mới]');

//   const msg = {
//     tokens,
//     notification: { title, body },
//     android: {
//       priority: 'high',
//       collapseKey: `chat_${chatId}`,
//       notification: {
//         channelId: 'default',         // khớp kênh client
//         tag: `chat:${chatId}`,        // cùng tag -> ghi đè/gộp
//       },
//     },
//     data: {
//       message_id: String(messageId),
//       chat_id: String(chatId),
//       chat_name: chatName || '',
//       sender: senderName,
//       preview: text || '',
//     },
//   };

//   const resp = await admin.messaging().sendEachForMulticast(msg);

//   // dọn token chết
//   await Promise.all(resp.responses.map((r, i) => {
//     if (!r.success) {
//       const code = r.error?.errorInfo?.code || r.error?.code;
//       if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-argument') {
//         return UserMobileDevice.invalidateToken(tokens[i]);
//       }
//     }
//   }));
// }

// module.exports = { sendChatPush };
const admin = require('../config/firebase');
const UserMobileDevice = require('../repositories/UserMobileDevice.repo');

const sent = new Set(); // hoặc Redis

/**
 * Gửi push chat cho 1 user
 * - toUserId: user nhận
 * - messageId: id duy nhất của tin nhắn
 * - chatId: id đoạn chat
 * - senderName: tên người gửi
 * - text: nội dung preview (đã mapping text / image / file ở ngoài)
 * - chatName: tên đoạn chat
 */
async function sendChatPush(
  toUserId,
  { messageId, chatId, senderName, text, chatName }
) {
  const key = `${toUserId}:${messageId}`;
  if (sent.has(key)) return;
  sent.add(key);
  setTimeout(() => sent.delete(key), 60_000); // TTL 60s

  // Lấy danh sách token đang enabled của user
  let tokens = await UserMobileDevice.getTokensByUserId(String(toUserId));
  tokens = [...new Set(tokens)];
  if (!tokens.length) return; // user này hiện không có device nào đang nhận push

  // ========== UI hiển thị ==========
  // Dòng 1 (title): tên đoạn chat, fallback = tên sender, fallback cuối = 'Tin nhắn mới'
  const title =
    chatName?.trim() ||
    senderName?.trim() ||
    'Tin nhắn mới';

  // Dòng 2 (body): "Sender: text" hoặc chỉ text
  const preview = text || '[Tin nhắn mới]';
  const body = senderName
    ? `${senderName}: ${preview}`
    : preview;

  const msg = {
    tokens,
    notification: { title, body },
    android: {
      priority: 'high',
      collapseKey: `chat_${chatId}`,
      notification: {
        // KHỚP với channelId 'chat-messages' trên client Expo
        channelId: 'chat-messages',
        tag: `chat:${chatId}`, // cùng tag -> gộp/ghi đè noti cùng phòng
      },
    },
    data: {
      message_id: String(messageId),
      chat_id: String(chatId),
      chat_name: chatName || '',
      sender: senderName || '',
      preview: preview,
    },
  };

  const resp = await admin.messaging().sendEachForMulticast(msg);

  // Dọn token chết / invalid
  await Promise.all(
    resp.responses.map((r, i) => {
      if (!r.success) {
        const code = r.error?.errorInfo?.code || r.error?.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-argument'
        ) {
          return UserMobileDevice.invalidateToken(tokens[i]);
        }
      }
      return null;
    })
  );
}

async function sendAlertPush(toUserId, { header, body }) {
  let tokens = await UserMobileDevice.getTokensByUserId(String(toUserId));
  tokens = [...new Set(tokens)];

  if (!tokens.length) {
    console.log('[sendAlertPush] no tokens for user', toUserId);
    return;
  }

  const title = header?.trim() || 'Thông báo mới';
  const content = body?.trim() || '';

  const msg = {
    tokens,
    notification: { title, body: content },
    android: {
      priority: 'high',
      notification: {
        channelId: 'general-alerts',
      },
    },
    data: {
      type: 'alert',
      title,
      body: content,
    },
  };

  const resp = await admin.messaging().sendEachForMulticast(msg);
  // Dọn token chết / invalid

  await Promise.all(
    resp.responses.map((r, i) => {
      if (!r.success) {
        const code = r.error?.errorInfo?.code || r.error?.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-argument'
        ) {
          return UserMobileDevice.invalidateToken(tokens[i]);
        }
      }
      return null;
    })
  );
}

module.exports = { sendChatPush, sendAlertPush };
