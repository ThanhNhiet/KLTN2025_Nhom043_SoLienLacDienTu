const express = require("express");
const cors = require("cors");
const http = require('http');
const sequelize = require("./src/config/mariadb.conf");
const initMongoDB = require("./src/databases/mongodb");
const { authenticateJWT } = require('./src/middlewares/jwt.middleware');
const { initSocket } = require('./src/utils/socket.utils'); 

// Khởi tạo biến môi trường
require('dotenv').config();

// Khởi tạo kết nối Redis
require('./src/services/redis.service');

// Tạo express app
const app = express();
const server = http.createServer(app); // Tạo server HTTP từ express app

// Khởi tạo socket và truyền server HTTP vào
initSocket(server);

// Bật cors cho phép frontend gọi API
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // nếu cần gửi cookie/token
}));

app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Hello E-Contact Book 🚀');
});

// Import routes
const routes = require('./src/routes');
const authRoutes = require('./src/routes/auth.route');

// Public routes - không cần xác thực
app.use('/api/public', authRoutes);

// Protected routes - cần xác thực JWT
app.use('/api', authenticateJWT, routes);

const PORT = process.env.PORT || 3000;

// Kết nối DB trước khi start server
async function startServer() {
  try {
    // Kết nối MariaDB
    await sequelize.authenticate();
    console.log("✅ Connected to MariaDB successfully!");
    // await sequelize.sync();
    // console.log("MariaDB tables synced");
    // await sequelize.sync({ alter: true }); 
    // console.log("MariaDB tables updated");

    // Kết nối MongoDB
    await initMongoDB();
    console.log("✅ Connected to MongoDB successfully!");
    
    // 5. SỬ DỤNG SERVER.LISTEN() THAY VÌ APP.LISTEN()
    server.listen(PORT, () => {
      console.log(`Server (Express + Socket.IO) is running at port ${PORT}...`);
    });
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
}

startServer();

