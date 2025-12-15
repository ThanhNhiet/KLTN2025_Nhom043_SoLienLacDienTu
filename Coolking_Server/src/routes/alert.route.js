const express = require('express');
const alertController = require('../controllers/alert.controller');
const router = express.Router();

// GET /api/alerts/my-alerts?page=1&limit=10
router.get('/my-alerts', alertController.getMyAlerts);

// Đánh dấu thông báo đã đọc
router.put('/:alertId/read', alertController.markAlertAsRead);

// Xóa thông báo (user có thể xóa thông báo của mình)
router.delete('/', alertController.deleteAlert);

// POST /api/alerts/system/:alertId/read
router.post('/system/:alertId/read', alertController.markSystemAlertAsRead);

// DELETE /api/alerts/system/:alertId
router.delete('/system/:alertId', alertController.deleteAlertSystem4Receiver);

/**
 * ADMIN ONLY ROUTES
 */
// POST /api/alerts/send-all
router.post('/send-all', alertController.sendAlertToAll);

// GET /api/alerts/search?keyword=&page=1&pageSize=10
router.get('/search', alertController.searchAlerts);

// GET /api/alerts?page=1&pageSize=10&keyword=...
router.get('/', alertController.getAllAlerts);

// PUT /api/alerts/:alertId
router.put('/:alertId', alertController.updateAlert4Admin);

/**
 * LECTURER ONLY ROUTES
 */
// POST /api/alerts/send-person
router.post('/send-person', alertController.sendAlertToPerson);

// GET /api/alerts/lecturer?page=1&pageSize=10
router.get('/lecturer', alertController.getAlertsBySender);

//GET /api/alerts/personal/:alertId
router.delete('/personal/:alertId', alertController.deleteAlertPersonal4ReceiverLe);

module.exports = router;