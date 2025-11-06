// const { Server } = require('socket.io');
// const { getAllChatIdsForUser } = require('../repositories/chat.repo');
// const { sendChatPush } = require('../services/pushService');

// let io;
// // Map<userId, Set<socket.id>>
// const userSockets = new Map();

// const initSocket = (httpServer) => {
//     io = new Server(httpServer, {
//         cors: {
//             origin: process.env.CLIENT_ORIGIN || '*',
//             methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//             credentials: true,
//         },
//     });

//     io.on('connection', (socket) => {
//         console.log(`Client connected: ${socket.id}`);

//         // User phải tham gia vào các phòng chat mà họ thuộc về
//         socket.on('join_chat', (chat_id) => {
//             socket.join(chat_id);
//             console.log(`Socket ${socket.id} joined chat room: ${chat_id}`);
//         });

//         // Chỉ gửi tin nhắn tới những người trong phòng chat cụ thể
//         socket.on('send_message', ({ chat_id, newMessage }) => {
//             io.to(chat_id).emit('receive_message', { chat_id, newMessage });
//         });

//         socket.on('pin_message', ({ chat_id, pinnedMessage }) => {
//             io.to(chat_id).emit('receive_pin_message', { chat_id, pinnedMessage });
//         });

//         socket.on('unpin_message', ({ chat_id, unpinnedMessage_id }) => {
//             io.to(chat_id).emit('receive_unpin_message', { chat_id, unpinnedMessage_id });
//         });

//         socket.on('del_message', ({ chat_id, message_id }) => {
//             io.to(chat_id).emit('render_message', { chat_id, message_id });
//         });

//         // Logic register để xử lý nhiều tab/thiết bị
//         socket.on('register', async (user_id) => {
//             // Gắn user_id vào socket để dễ truy xuất khi disconnect
//             socket.user_id = user_id;

//             if (!userSockets.has(user_id)) {
//                 userSockets.set(user_id, new Set());
//             }
//             userSockets.get(user_id).add(socket.id);

//             console.log(`📝 User ${user_id} registered with socket ${socket.id}`);
//             console.log('Online users map:', userSockets);

//             const userChatIds = await getAllChatIdsForUser(user_id);
//             userChatIds.forEach(chatId => {
//                 socket.join(chatId);
//                 console.log(`Socket ${socket.id} tự động tham gia phòng ${chatId}`);
//             });
//         });

//         // logic unregister khi ngắt kết nối
//         socket.on('disconnect', () => {
//             if (socket.user_id && userSockets.has(socket.user_id)) {
//                 const userSocketSet = userSockets.get(socket.user_id);
//                 userSocketSet.delete(socket.id);

//                 // Nếu user không còn kết nối nào, xóa họ khỏi map
//                 if (userSocketSet.size === 0) {
//                     userSockets.delete(socket.user_id);
//                 }
//                 console.log(`User ${socket.user_id}'s socket ${socket.id} disconnected.`);
//             } else {
//                 console.log(`Client disconnected: ${socket.id}`);
//             }
//         });
//     });

//     console.log(`Socket.IO is running...`);
// };

// // Tạo một hàm để gửi sự kiện từ bên ngoài (ví dụ từ một API route)
// const getIO = () => {
//     if (!io) {
//         throw new Error("Socket.IO not initialized!");
//     }
//     return io;
// };

// module.exports = {
//     initSocket,
//     getIO,
//     userSockets // Tùy chọn: export map user để kiểm tra online
// };

const { Server } = require('socket.io');
const { getAllChatIdsForUser, getMemberUserIdsByChat } = require('../repositories/chat.repo'); // ⬅️ thêm hàm này
const { sendChatPush } = require('../services/pushService');

let io;
// Map<userId, Set<socketId>>
const userSockets = new Map();

// chống spam: Map<userId, Map<chatId, lastMs>>
const lastPushAt = new Map();

/** user có online không */
function isUserOnline(userId) {
  const set = userSockets.get(String(userId));
  return !!(set && set.size > 0);
}

/** user có đang ở room không (dù mở nhiều tab/thiết bị) */
function isUserInRoom(userId, roomId) {
  const set = userSockets.get(String(userId));
  if (!set) return false;
  for (const sid of set) {
    const s = io.sockets.sockets.get(sid);
    if (s && s.rooms.has(String(roomId))) return true;
  }
  return false;
}

/** chống bắn dồn dập: chỉ cho phép 1 push / user / room / 5s */
function shouldThrottlePush(userId, chatId, windowMs = 5000) {
  const now = Date.now();
  if (!lastPushAt.has(userId)) lastPushAt.set(userId, new Map());
  const map = lastPushAt.get(userId);
  const last = map.get(chatId) || 0;
  if (now - last < windowMs) return true; // throttle
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

    // --- Tham gia 1 room cụ thể (nếu app của bạn chủ động join thủ công)
    socket.on('join_chat', (chat_id) => {
      socket.join(String(chat_id));
      console.log(`Socket ${socket.id} joined chat room: ${chat_id}`);
    });

    // --- Gửi tin nhắn: broadcast + push cho người không ở phòng
    socket.on('send_message', async ({ chat_id, newMessage }) => {
      const roomId = String(chat_id);
      io.to(roomId).emit('receive_message', { chat_id: roomId, newMessage });

      try {
        // Lấy toàn bộ member của room (trừ người gửi)
        const memberIds = await getMemberUserIdsByChat(roomId); // ⬅️ triển khai trong repo
        const senderId = String(newMessage?.senderId ?? newMessage?.sender_id);

        for (const uid of memberIds) {
          const userId = String(uid);
          if (userId === senderId) continue;

          // Nếu user không đang ở room (mọi thiết bị/tab), gửi push
          const inRoom = isUserInRoom(userId, roomId);
          if (!inRoom && !shouldThrottlePush(userId, roomId)) {
            await sendChatPush(userId, {
              chatId: roomId,
              senderName: newMessage?.senderName ?? newMessage?.sender_name ?? 'Tin nhắn mới',
              text: newMessage?.text ?? (newMessage?.attachments?.length ? '[Tệp đính kèm]' : '[Tin nhắn]')
            });
          }
        }
      } catch (err) {
        console.error('send_message push error:', err);
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

    // --- Register: map user<->socket và auto join các room của user
    socket.on('register', async (user_id) => {
      socket.user_id = String(user_id);

      if (!userSockets.has(socket.user_id)) userSockets.set(socket.user_id, new Set());
      userSockets.get(socket.user_id).add(socket.id);

      console.log(`📝 User ${socket.user_id} registered with socket ${socket.id}`);

      const userChatIds = await getAllChatIdsForUser(socket.user_id);
      userChatIds.forEach((chatId) => {
        socket.join(String(chatId));
        console.log(`Socket ${socket.id} auto-joined room ${chatId}`);
      });
    });

    // --- Unregister khi disconnect
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
  // Export thêm helpers nếu bạn muốn dùng ở nơi khác (dashboard admin, v.v.)
  isUserOnline,
  isUserInRoom,
};

