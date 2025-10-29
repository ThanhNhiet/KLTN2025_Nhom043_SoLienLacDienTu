const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userMobileDeviceSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    userID: {
        type: String,
        required: true
    },
    deviceToken: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        required: true
    }
}, { timestamps: true });

userMobileDeviceSchema.index({ userID: 1 });

const UserMobileDevice = mongoose.model('UserMobileDevice', userMobileDeviceSchema);
module.exports = UserMobileDevice;
