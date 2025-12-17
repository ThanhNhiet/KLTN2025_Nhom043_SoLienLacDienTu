const express = require('express');
const dataImportController = require('../controllers/dataimport.controller');
const { uploadCSVDB } = require('../middlewares/upload.middleware');
const router = express.Router();

// POST /api/dataimport/schedules - Import schedules từ CSV
router.post('/schedules', uploadCSVDB, dataImportController.importSchedules);

// POST /api/dataimport/schedule-exceptions - Import schedule exceptions từ CSV
router.post('/schedule-exceptions', uploadCSVDB, dataImportController.importScheduleExceptions);

// POST /api/dataimport/scores - Import scores từ CSV
router.post('/scores', uploadCSVDB, dataImportController.importScores);

// GET /api/dataimport/history - Lấy lịch sử import (tùy chọn)
router.get('/history', dataImportController.getImportHistory);

// GET /api/dataimport/template/:type - Download CSV template
router.get('/template/:type', dataImportController.downloadTemplate);

module.exports = router;
