const e = require('express');
const studentRepo = require('../repositories/student.repo');
const jwtUtils = require('../utils/jwt.utils');

// GET /students/score-view/:course_section_id
exports.getStudentsByCourseSection = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'LECTURER')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const courseSectionId = req.params.course_section_id;
        const students = await studentRepo.getStudentsScoreByCourseSectionId4Lecturer(courseSectionId);
        res.status(200).json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /students/info-view-le-ad/:student_id
exports.getStudentInfoViewByLecturer = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || (decoded.role === 'ADMIN' && decoded.role === 'LECTURER')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const studentId = req.params.student_id;
        const studentInfo = await studentRepo.getStudentInfoById4Lecturer(studentId);
        res.status(200).json(studentInfo);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// GET /students/info-student/:student_id
exports.getStudentInfo = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        const student = await studentRepo.getStudentByStudent_id(decoded.user_id);
        if (!student) return res.status(404).json({ message: 'Sinh viên không tồn tại' });
        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// PUT /student/update-info
exports.updateStudentInfo = async (req, res) => {
    try {   
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'STUDENT') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const updatedStudent = await studentRepo.updateStudentInfo(decoded.user_id, req.body);
        if (!updatedStudent) return res.status(404).json({ message: 'Sinh viên không tồn tại' });
        res.status(200).json({ message: 'Cập nhật thông tin sinh viên thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /students/schedule/:student_id - Lịch học với exceptions (cho admin/lecturer)
exports.getStudentScheduleWithExceptions = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        
        if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'LECTURER')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const studentId = req.params.student_id;
        const paginationOptions = {
            page: req.query.page,
            limit: req.query.limit,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        
        const schedule = await studentRepo.getStudentScheduleWithExceptions(studentId, paginationOptions);
        res.status(200).json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /students/my-schedule - Lịch học của chính sinh viên
exports.getMyScheduleWithExceptions = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        
        if (!decoded || decoded.role !== 'STUDENT') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const paginationOptions = {
            page: req.query.page,
            limit: req.query.limit,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        
        const schedule = await studentRepo.getStudentScheduleWithExceptions(decoded.user_id, paginationOptions);
        res.status(200).json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /students/basic-schedule/:student_id - Lịch học đơn giản
exports.getStudentBasicSchedule = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        
        if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'LECTURER')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const studentId = req.params.student_id;
        const paginationOptions = {
            page: req.query.page,
            limit: req.query.limit,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        
        const schedule = await studentRepo.getStudentBasicSchedule(studentId, paginationOptions);
        res.status(200).json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /students/my-basic-schedule - Lịch học đơn giản của chính sinh viên
exports.getMyBasicSchedule = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        
        if (!decoded || decoded.role !== 'STUDENT') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const paginationOptions = {
            page: req.query.page,
            limit: req.query.limit,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        
        const schedule = await studentRepo.getStudentBasicSchedule(decoded.user_id, paginationOptions);
        res.status(200).json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /students/exam-schedule/:student_id - Lịch thi
exports.getStudentExamSchedule = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        
        if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'LECTURER')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const studentId = req.params.student_id;
        const paginationOptions = {
            page: req.query.page,
            limit: req.query.limit,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        
        const examSchedule = await studentRepo.getStudentExamSchedule(studentId, paginationOptions);
        res.status(200).json(examSchedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /students/my-exam-schedule - Lịch thi của chính sinh viên
exports.getMyExamSchedule = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        
        if (!decoded || decoded.role !== 'STUDENT') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const paginationOptions = {
            page: req.query.page,
            limit: req.query.limit,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };
        
        const examSchedule = await studentRepo.getStudentExamSchedule(decoded.user_id, paginationOptions);
        res.status(200).json(examSchedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadStudentAvatar = async (req, res) => {
    try {
         const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        
        if (!decoded || decoded.role !== 'STUDENT') {
            return res.status(403).json({ message: 'Forbidden' });

        }
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const studentId = req.params.id;
        if (decoded.user_id !== studentId) {
            return res.status(403).json({ message: 'You can only update your own avatar' });
        }
        const updatedStudent = await studentRepo.updateStudentAvatar(studentId, file);
        if (!updatedStudent) return res.status(404).json({ message: 'Sinh viên không tồn tại' });
        res.status(200).json({ message: 'Cập nhật avatar sinh viên thành công', avatar: updatedStudent.avatar });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//  GET /students/warn-list?sessionId=&facultyId=&option=&page=&pageSize=
exports.getWarnedStudents = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || (decoded.role !== 'ADMIN')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const sessionId = req.query.sessionId;
        const facultyId = req.query.facultyId;
        const option = req.query.option;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const warnedStudents = await studentRepo.getFailedStudentsBySessionAndFaculty(sessionId, facultyId, option, page, pageSize);
        res.status(200).json(warnedStudents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /students/warn-list/search?sessionId=&facultyId=&studentId=
exports.searchWarnedStudents = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || (decoded.role !== 'ADMIN')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const sessionId = req.query.sessionId;
        const facultyId = req.query.facultyId;
        const studentId = req.query.studentId;
        const student = await studentRepo.searchFailedStudentBySessionAndFacultyWithStudentId(sessionId, facultyId, studentId);
        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};