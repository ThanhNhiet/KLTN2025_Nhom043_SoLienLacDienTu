const attendanceRepo = require('../repositories/attendance.repo');
const jwtUtils = require('../utils/jwt.utils');

// GET /attendances/students/:course_section_id
exports.getAttendanceDetailsByCourseSectionAndAttendanceID = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'LECTURER') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { course_section_id } = req.params;
        if (!course_section_id) {
            return res.status(400).json({ 
                success: false,
                message: 'Mã học phần (course_section_id) là bắt buộc' 
            });
        }

        const attendanceDetails = await attendanceRepo.getAttendanceDetailsByCourseSectionID(course_section_id, decoded.user_id);
        return res.status(200).json(attendanceDetails);

    } catch (error) {
        console.error('Error in getAttendanceDetailsByCourseSectionID:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal Server Error',
            error: error.message 
        });
    }
};

// POST /attendances/students/:course_section_id
exports.createAttendanceStudents = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'LECTURER') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { course_section_id } = req.params;
        if (!course_section_id) {
            return res.status(400).json({ 
                success: false,
                message: 'Mã học phần (course_section_id) là bắt buộc' 
            });
        }
        const attendanceData = req.body;
        if (!attendanceData || !Array.isArray(attendanceData.students) || attendanceData.students.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Dữ liệu điểm danh (students) là bắt buộc và phải là một mảng không rỗng' 
            });
        }
        const result = await attendanceRepo.createAttendanceRecord(decoded.user_id, course_section_id, attendanceData);
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in createOrUpdateAttendanceStudents:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
};

// PUT /attendances/students/:attendance_id
exports.updateAttendanceStudents = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'LECTURER') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { attendance_id } = req.params;
        if (!attendance_id) {
            return res.status(400).json({
                success: false,
                message: 'Mã điểm danh (attendance_id) là bắt buộc'
            });
        }
        const attendanceData = req.body;
        if (!attendanceData || !Array.isArray(attendanceData.students) || attendanceData.students.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu điểm danh (students) là bắt buộc và phải là một mảng không rỗng'
            });
        }
        const result = await attendanceRepo.updateAttendanceRecord(attendance_id, attendanceData);
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in updateAttendanceStudents:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
};

// DELETE /attendances/students/:attendance_id
exports.deleteAttendanceStudents = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'LECTURER') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { attendance_id } = req.params;
        if (!attendance_id) {
            return res.status(400).json({
                success: false,
                message: 'Mã điểm danh (attendance_id) là bắt buộc'
            });
        }
        const result = await attendanceRepo.deleteAttendanceRecord(attendance_id);
        if (result.success) {
            return res.status(200).json(result);
        } else {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Error in deleteAttendanceStudents:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
};


// GET /attendances/student/:course_section_id
exports.getAttendanceByStudentByCourseID = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'STUDENT') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const studentId = decoded.user_id;
        const {subject_id, course_section_id } = req.query;
        if (!course_section_id || !subject_id) {
            return res.status(400).json({
                success: false,
                message: 'Mã học phần (subject_id) và mã lớp học phần (course_section_id) là bắt buộc'
            });
        }
        const attendanceRecords = await attendanceRepo.getAttendanceByStudentBySubject(studentId, subject_id, course_section_id);
        return res.status(200).json(attendanceRecords);

    } catch (error) {
        console.error('Error in getAttendanceByStudentBySubject:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
};

// GET /attendances/parent
exports.getAttendanceByStudentByCourseIDByParent = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        
        if (!decoded || decoded.role !== 'PARENT') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const parentId = decoded.user_id;
        const { studentId } = req.params;
        const { page, pagesize } = req.query;

        if (!studentId) {
            return res.status(400).json({   
                success: false,
                message: 'Mã sinh viên (studentId) là bắt buộc'
            });
        }

        const attendanceRecords = await attendanceRepo.getAttendanceByStudentBySubjectByParent(
            parentId, 
            studentId, 
            parseInt(page), 
            parseInt(pagesize)
        );

        return res.status(200).json(attendanceRecords);

    } catch (error) {
        console.error('Error in getAttendanceByStudentByCourseIDByParent:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
};