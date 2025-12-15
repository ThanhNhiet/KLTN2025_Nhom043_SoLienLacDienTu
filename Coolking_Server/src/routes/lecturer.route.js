const express = require('express');
const lecturerController = require('../controllers/lecturer.controller');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');

//GET /lecturer/info
router.get('/info', lecturerController.getLecturerInfo);

//PUT /lecturer/info
router.put('/info', lecturerController.updateLecturerInfo);

//POST /lecturer/avatar
router.post('/avatar', upload.upload, lecturerController.uploadAvatar);

//GET /lecturer/students-in-homeroom
router.get('/students-in-homeroom', lecturerController.getStudentsInfoInHomeroomClass);

//GET /lecturer/:id (Admin mới được quyền truy cập)
router.get('/:id', lecturerController.getLecturerById);

module.exports = router;