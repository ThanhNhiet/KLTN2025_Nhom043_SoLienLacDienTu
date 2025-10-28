const { Server } = require('socket.io');

let io;
// Map<userId, Set<socket.id>>
const userSockets = new Map();

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

        // User phải tham gia vào các phòng chat mà họ thuộc về
        socket.on('join_chat', (chat_id) => {
            socket.join(chat_id);
            console.log(`Socket ${socket.id} joined chat room: ${chat_id}`);
        });

        // Chỉ gửi tin nhắn tới những người trong phòng chat cụ thể
        socket.on('send_message', ({ chat_id, newMessage }) => {
            io.to(chat_id).emit('receive_message', { chat_id, newMessage });
        });

        socket.on('pin_message', ({ chat_id, pinnedMessage }) => {
            io.to(chat_id).emit('receive_pin_message', { chat_id, pinnedMessage });
        });

        socket.on('unpin_message', ({ chat_id, unpinnedMessage_id }) => {
            io.to(chat_id).emit('receive_unpin_message', { chat_id, unpinnedMessage_id });
        });

        socket.on('del_message', ({ chat_id, message_id }) => {
            io.to(chat_id).emit('render_message', { chat_id, message_id });
        });

        // Logic register để xử lý nhiều tab/thiết bị
        socket.on('register', (user_id) => {
            // Gắn user_id vào socket để dễ truy xuất khi disconnect
            socket.user_id = user_id;

            if (!userSockets.has(user_id)) {
                userSockets.set(user_id, new Set());
            }
            userSockets.get(user_id).add(socket.id);

            console.log(`📝 User ${user_id} registered with socket ${socket.id}`);
            console.log('Online users map:', userSockets);
        });

        // logic unregister khi ngắt kết nối
        socket.on('disconnect', () => {
            if (socket.user_id && userSockets.has(socket.user_id)) {
                const userSocketSet = userSockets.get(socket.user_id);
                userSocketSet.delete(socket.id);

                // Nếu user không còn kết nối nào, xóa họ khỏi map
                if (userSocketSet.size === 0) {
                    userSockets.delete(socket.user_id);
                }
                console.log(`User ${socket.user_id}'s socket ${socket.id} disconnected.`);
            } else {
                console.log(`Client disconnected: ${socket.id}`);
            }
        });
    });

    console.log(`Socket.IO is running...`);
};

// Tạo một hàm để gửi sự kiện từ bên ngoài (ví dụ từ một API route)
const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized!");
    }
    return io;
};

module.exports = {
    initSocket,
    getIO,
    userSockets // Tùy chọn: export map user để kiểm tra online
};

