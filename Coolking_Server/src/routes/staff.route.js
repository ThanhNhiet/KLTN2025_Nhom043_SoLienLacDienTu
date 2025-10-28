const express = require('express');
const staffController = require('../controllers/staff.controller');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');

//GET /api/staffs/admin/info
router.get('/admin/info', staffController.getStaffAdminInfo);

//PUT /api/staffs/admin
router.put('/admin', staffController.updateStaffAdminInfo);

// GET /api/staffs/:id (Admin mới được quyền truy cập)
router.get('/:id', staffController.getStaffById);

// POST /api/staffs/admin/avatar
router.post('/admin/avatar', upload.upload, staffController.uploadAvatarStaffAdmin);

// GET /api/staffs/admin/all?department=...
router.get('/admin/all', staffController.getAllStaffsAdmin);

module.exports = router;