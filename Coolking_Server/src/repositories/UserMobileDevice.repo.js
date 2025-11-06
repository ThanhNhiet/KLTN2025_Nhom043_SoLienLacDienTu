const { v4: uuidv4 } = require('uuid');
const { UserMobileDevice } = require('../databases/mongodb/schemas');
const { Op } = require('sequelize');
const mongoose = require('mongoose');
const datetimeFormatter = require("../utils/format/datetime-formatter");


async function upsertToken(userID, deviceToken, platform) {
  return UserMobileDevice.findOneAndUpdate(
    { userID, deviceToken },
    { $set: { platform, enabled: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function getTokensByUserId(userID) {
  const docs = await UserMobileDevice.find({ userID, enabled: true }, { deviceToken: 1, _id: 0 });
  return docs.map(d => d.deviceToken);
}

async function invalidateToken(deviceToken) {
  await UserMobileDevice.deleteOne({ deviceToken });
}

async function removeUserToken(userID, deviceToken) {
  await UserMobileDevice.deleteOne({ userID, deviceToken });
}

module.exports = { upsertToken, getTokensByUserId, invalidateToken, removeUserToken };
