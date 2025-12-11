const { UserMobileDevice } = require('../databases/mongodb/schemas');
// const { v4: uuidv4 } = require('uuid');
// const { Op } = require('sequelize');
// const mongoose = require('mongoose');
// const datetimeFormatter = require("../utils/format/datetime-formatter");

// Nếu mấy import trên không dùng thì nên xóa cho sạch, để mình comment lại.

// LOGIN / REFRESH TOKEN: bật enabled = true
async function upsertToken(userID, deviceToken, platform) {
  return UserMobileDevice.findOneAndUpdate(
    { userID: String(userID), deviceToken },
    {
      $set: {
        userID: String(userID),
        deviceToken,
        platform,
        enabled: true,
        updatedAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
}
async function logoutDevice({ userId, deviceToken }) {
  await UserMobileDevice.updateMany(
    {
      userID: String(userId),
      deviceToken,
    },
    { $set: { enabled: false, updatedAt: new Date() } }
  );
}

// Lấy tất cả FCM token của user đang bật (đang đăng nhập / cho phép nhận push)
async function getTokensByUserId(userID) {
  const docs = await UserMobileDevice.find(
    { userID: String(userID), enabled: true },
    { deviceToken: 1, _id: 0 }
  ).lean();

  return docs.map(d => d.deviceToken);
}

// Token FCM bị FCM báo chết / invalid -> chỉ cần tắt enabled
async function invalidateToken(deviceToken) {
  await UserMobileDevice.updateMany(
    { deviceToken },
    { $set: { enabled: false, updatedAt: new Date() } }
  );
}

// LOGOUT 1 thiết bị: tắt enabled, không xóa record
async function removeUserToken(userID, deviceToken) {
  await UserMobileDevice.updateMany(
    { userID: String(userID), deviceToken },
    { $set: { enabled: false, updatedAt: new Date() } }
  );
}

// (optional) Hàm tiện kiểm tra user có device nào đang login không
async function hasAnyLoggedInDevice(userID) {
  const count = await UserMobileDevice.countDocuments({
    userID: String(userID),
    enabled: true,
  });
  return count > 0;
}

async function getUserIdOnline() {
  const docs = await UserMobileDevice.find(
    { enabled: true },
    { userID: 1, _id: 0 }
  ).lean();
  return docs.map(d => d.userID);
}



module.exports = {
  upsertToken,
  getTokensByUserId,
  invalidateToken,
  removeUserToken,
  hasAnyLoggedInDevice,
  logoutDevice,
  getUserIdOnline,
};
