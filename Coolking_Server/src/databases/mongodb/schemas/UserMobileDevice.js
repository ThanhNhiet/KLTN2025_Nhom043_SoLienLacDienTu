const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userMobileDeviceSchema = new Schema({
  // Lưu ý: để Mongo tự tạo _id(ObjectId) cho dễ quản lý
  userID: { type: String, required: true, index: true },
  deviceToken: { type: String, required: true },      // FCM/APNs token
  platform: { type: String, enum: ['android', 'ios'], required: true },
  enabled: { type: Boolean, default: true },          // tiện disable tạm thời
}, { timestamps: true });

// 1 user có thể nhiều thiết bị, nhưng 1 token không nên trùng cho cùng user
userMobileDeviceSchema.index({ userID: 1, deviceToken: 1 }, { unique: true });
// token cũng nên unique toàn cục để không bị lưu lặp (nếu bạn muốn)
userMobileDeviceSchema.index({ deviceToken: 1 }, { unique: true });


const UserMobileDevice = mongoose.model('UserMobileDevice', userMobileDeviceSchema);
module.exports = UserMobileDevice;
