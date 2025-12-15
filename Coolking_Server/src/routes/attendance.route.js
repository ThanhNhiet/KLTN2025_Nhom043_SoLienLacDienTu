const express = require('express');
const attendanceController = require('../controllers/attendance.controller');
const router = express.Router();

// GET /attendances/students/:course_section_id
router.get('/students/:course_section_id', attendanceController.getAttendanceDetailsByCourseSectionAndAttendanceID);

// GET /attendances/student/:course_section_id
router.get('/student', attendanceController.getAttendanceByStudentByCourseID);

// GET /attendances/student-by-le?course_section_id=&subject_id=&student_id=
router.get('/student-by-le', attendanceController.getAttendanceStudentByLecturer);

// GET /attendances/parent/:studentId
router.get('/parent/:studentId', attendanceController.getAttendanceByStudentByCourseIDByParent);

// POST /attendances/students/:course_section_id
router.post('/students/:course_section_id', attendanceController.createAttendanceStudents);

// PUT /attendances/students/:attendance_id
router.put('/students/:attendance_id', attendanceController.updateAttendanceStudents);

// DELETE /attendances/students/:attendance_id
router.delete('/students/:attendance_id', attendanceController.deleteAttendanceStudents);

module.exports = router;
