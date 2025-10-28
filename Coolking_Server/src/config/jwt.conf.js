// Configuration file for JWT
require('dotenv').config();

module.exports = {
  accessToken: {
    secret: process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret',
    expiresIn: '180m' // 180 minutes
  },
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret',
    expiresIn: '100y' // 100 năm - Xem như không hết hạn
  }
};
