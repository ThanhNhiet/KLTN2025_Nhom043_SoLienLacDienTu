const express = require('express');
const lecturerController = require('../controllers/lecturer.controller');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');

//GET /lecturers/info
router.get('/info', lecturerController.getLecturerInfo);

//PUT /lecturers/info
router.put('/info', lecturerController.updateLecturerInfo);

//POST /lecturers/avatar
router.post('/avatar', upload.upload, lecturerController.uploadAvatar);

//GET /lecturers/students-in-homeroom
router.get('/students-in-homeroom', lecturerController.getStudentsInfoInHomeroomClass);

//GET /lecturers/homeroom-info/:class_id
router.get('/homeroom-info/:class_id', lecturerController.getLecturerInfoByHomeroomClassId);

//GET /lecturers/:id (Admin mới được quyền truy cập)
router.get('/:id', lecturerController.getLecturerById);

module.exports = router;