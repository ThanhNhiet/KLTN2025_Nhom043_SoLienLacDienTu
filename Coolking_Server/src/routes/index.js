const express = require('express');
const accountRoute = require('./account.route');
const authRoute = require('./auth.route');
const lecturerRoute = require('./lecturer.route');
const scheduleRoute = require('./schedule.route');
const alertRoute = require('./alert.route');
const attendanceRoute = require('./attendance.route');
const courseSectionRoute = require('./coursesection.route');
const studentRoute = require('./student.route');
const statisticsRoute = require('./statistics.route');
const chatRoute = require('./chat.route');
const messageRoute = require('./message.route');
const parentRoute = require('./parent.route');
const scoreRoute = require('./score.route');
const staffRoute = require('./staff.route');
const dataimportRoute = require('./dataimport.route');

const router = express.Router();

router.use('/accounts', accountRoute);
router.use('/public', authRoute);
router.use('/students', studentRoute);
router.use('/attendances', attendanceRoute);
router.use('/lecturers', lecturerRoute);
router.use('/schedules', scheduleRoute);
router.use('/alerts', alertRoute);
router.use('/coursesections', courseSectionRoute);
router.use('/statistics', statisticsRoute);
router.use('/chats', chatRoute);
router.use('/messages', messageRoute);
router.use('/parents', parentRoute);
router.use('/scores', scoreRoute);
router.use('/staffs', staffRoute);
router.use('/dataimport', dataimportRoute);

module.exports = router;
