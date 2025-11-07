const admin = require('../config/firebase.js'); // dùng admin đã init/đã config
const UserMobileDevice = require('../repositories/UserMobileDevice.repo.js');

async function sendChatPush(toUserId, { chatId, senderName, text }) {
  const tokens = await UserMobileDevice.getTokensByUserId(String(toUserId));
  if (!tokens.length) return;

  const message = {
    tokens,
    notification: {
      title: senderName,
      body: text || '[Tin nhắn mới]',
    },
    android: {
      notification: {
        channelId: 'chat-messages',
      },
      priority: 'high',
    },
    data: {
      chat_id: String(chatId),
      sender: senderName,
      preview: text || '',
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    }
  };

   const resp = await admin.messaging().sendEachForMulticast(message);

  // Dọn token invalid
  await Promise.all(
    resp.responses.map(async (r, i) => {
      if (!r.success) {
        const code = r.error?.code;
        if (code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-argument') {
          await UserMobileDevice.invalidateToken(tokens[i]);
        }
      }
    })
  );
}

module.exports = { sendChatPush };