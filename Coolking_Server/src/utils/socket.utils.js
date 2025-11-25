const { Server } = require('socket.io');
const { getAllChatIdsForUser, getChatMembersWithMutedStatus } = require('../repositories/chat.repo');
const { sendChatPush } = require('../services/pushService');

let io;
// Map<userId, Set<socketId>>
const userSockets = new Map();

// Chống spam: Map<userId, Map<chatId, lastMs>>
const lastPushAt = new Map();

/** (Giữ lại nếu cần dùng chỗ khác) user có online không */
function isUserOnline(userId) {
  const set = userSockets.get(String(userId));
  return !!(set && set.size > 0);
}

/** (Giữ lại nếu cần) user có đang ở room không */
function isUserInRoom(userId, roomId) {
  const set = userSockets.get(String(userId));
  if (!set) return false;
  for (const sid of set) {
    const s = io.sockets.sockets.get(sid);
    if (s && s.rooms.has(String(roomId))) return true;
  }
  return false;
}

/** Chỉ cho 1 push / user / room trong windowMs (mặc định 5s) */
function shouldThrottlePush(userId, chatId, windowMs = 5000) {
  const now = Date.now();
  if (!lastPushAt.has(userId)) lastPushAt.set(userId, new Map());
  const map = lastPushAt.get(userId);
  const last = map.get(chatId) || 0;
  if (now - last < windowMs) return true;
  map.set(chatId, now);
  return false;
}

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Client join thủ công 1 room
    socket.on('join_chat', (chat_id) => {
      socket.join(String(chat_id));
      console.log(`Socket ${socket.id} joined chat room: ${chat_id}`);
    });

    // Gửi tin nhắn: broadcast + LUÔN push cho các member (trừ người gửi)
    socket.on('send_message', async ({ chat_id, newMessage }) => {
      const roomId = String(chat_id);

      // BƯỚC 1: Lấy danh sách thành viên và trạng thái Muted từ DB
      const chatData = await getChatMembersWithMutedStatus(roomId);

      if (!chatData) {
        console.error(`Chat ${roomId} not found`);
        return;
      }

      const { memberMutedMap, chatName } = chatData;

      // Xác định senderId để loại trừ khi push notification
      const senderId = String(
        newMessage?.senderInfo?.userID ||
        newMessage?.sender_info?.userID ||
        newMessage?.senderId ||
        newMessage?.sender_id ||
        ''
      );

      // BƯỚC 2: Duyệt qua từng thành viên trong nhóm chat
      for (const [uid, isMuted] of memberMutedMap.entries()) {
        const userId = String(uid);

        // A. GỬI SOCKET (Real-time)
        // Kiểm tra xem user này có đang online không
        if (userSockets.has(userId)) {
          const socketIds = userSockets.get(userId);

          // Tạo message riêng cho user này
          newMessage.isMuted = isMuted; // Gắn trạng thái mute vào message
          const customizedMessage = {
            chat_id: roomId,
            newMessage
          };

          // Gửi cho tất cả socket của user đó
          socketIds.forEach(sid => {
            io.to(sid).emit('receive_message', customizedMessage);
          });
        }

        // B. GỬI PUSH NOTIFICATION
        if (userId !== senderId) {
          if (!shouldThrottlePush(userId, roomId)) {
            let body =
              newMessage?.type === 'text' ? newMessage.content
                : newMessage?.type === 'image' ? '📷 Hình ảnh'
                  : newMessage?.type === 'file' ? '📄 Tệp đính kèm'
                    : String(newMessage.content ?? '');

            // Nếu user đang mute thì không gửi push
            if (!isMuted) {
              sendChatPush(userId, {
                chatId: roomId,
                senderName: newMessage?.senderInfo?.name || 'Tin nhắn mới',
                text: body,
                chatName: chatName
              }).catch((e) => console.error('sendChatPush error:', e));
            }
          }
        }
      }
    });

    socket.on('pin_message', ({ chat_id, pinnedMessage }) => {
      io.to(String(chat_id)).emit('receive_pin_message', { chat_id, pinnedMessage });
    });

    socket.on('unpin_message', ({ chat_id, unpinnedMessage_id }) => {
      io.to(String(chat_id)).emit('receive_unpin_message', { chat_id, unpinnedMessage_id });
    });

    socket.on('del_message', ({ chat_id, message_id }) => {
      io.to(String(chat_id)).emit('render_message', { chat_id, message_id });
    });

    // Đăng ký user ↔ socket và tự join các room user thuộc về
    socket.on('register', async (user_id) => {
      socket.user_id = String(user_id);

      if (!userSockets.has(socket.user_id)) userSockets.set(socket.user_id, new Set());
      userSockets.get(socket.user_id).add(socket.id);

      console.log(`📝 User ${socket.user_id} registered with socket ${socket.id}`);

      const userChats = await getAllChatIdsForUser(socket.user_id);
      userChats.forEach((chat) => {
        socket.join(String(chat._id));
        console.log(`Socket ${socket.id} auto-joined room ${chat._id}`);
      });
    });

    // Dọn state khi disconnect
    socket.on('disconnect', () => {
      if (socket.user_id && userSockets.has(socket.user_id)) {
        const set = userSockets.get(socket.user_id);
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(socket.user_id);
        console.log(`User ${socket.user_id}'s socket ${socket.id} disconnected.`);
      } else {
        console.log(`Client disconnected: ${socket.id}`);
      }
    });
  });

  console.log('Socket.IO is running...');
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized!');
  return io;
};

module.exports = {
  initSocket,
  getIO,
  userSockets,
  isUserOnline,
  isUserInRoom, // vẫn export nếu nơi khác dùng
};

