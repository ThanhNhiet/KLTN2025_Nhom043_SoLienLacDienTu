const UserMobileDevice = require('../repositories/UserMobileDevice.repo.js');

async function registerDeviceToken(req, res) {
  try {
    const { userId, token, platform } = req.body || {};
    if (!userId || !token || !platform) {
      return res.status(400).json({ ok: false, error: 'Missing userId/token/platform' });
    }
    await UserMobileDevice.upsertToken(String(userId), String(token), String(platform));
    res.json({ ok: true });
  } catch (err) {
    if (err?.code === 11000) return res.status(200).json({ ok: true, dedup: true });
    console.error('save token error', err);
    res.status(500).json({ ok: false });
  }
}

async function deleteDeviceToken(req, res) {
  const { userId, token } = req.body || {};
  if (!userId || !token) return res.status(400).json({ ok: false });
  await UserMobileDevice.removeUserToken(String(userId), String(token));
  res.json({ ok: true });
}

module.exports = { registerDeviceToken, deleteDeviceToken };