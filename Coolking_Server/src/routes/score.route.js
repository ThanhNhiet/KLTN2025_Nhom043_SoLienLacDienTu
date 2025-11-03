const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/score.controller');


// GET /scores/student/:id - Lấy điểm sinh viên theo học kỳ
router.get('/student/:id', scoreController.getStudentScoresBySemester);

// GET /scores/parent/:id - Lấy điểm con của phụ huynh theo học kỳ
router.get('/parent/:id&studentId=:studentId', scoreController.getParentStudentScoresBySemester);


module.exports = router; 