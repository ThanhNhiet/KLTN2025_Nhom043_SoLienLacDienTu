const accountRepo = require('../repositories/coursesection.repo');
const jwtUtils = require('../utils/jwt.utils');

// GET /coursesections/lecturer?page=&pageSize=
exports.getCourseSectionsByLecturer = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'LECTURER') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { page, pageSize } = req.query;
        const result = await accountRepo.getCourseSectionsByLecturer(decoded.user_id, page, pageSize);
        res.status(200).json(result);
    } catch (err) {
        console.error('Error in getCourseSectionsByLecturer:', err);
        res.status(500).json({ message: err.message });
    }
};

// GET /coursesections/lecturer/search?keyword=&page=&pageSize=
exports.searchCourseSectionsByKeyword4Lecturer = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'LECTURER') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const {keyword, page, pageSize } = req.query;
        // const {keyword = ''} = req.body;
        const result = await accountRepo.searchCourseSectionsByKeyword4Lecturer(decoded.user_id, keyword, page, pageSize);
        res.status(200).json(result);
    } catch (err) {
        console.error('Error in searchCourseSectionsByKeyword:', err);
        res.status(500).json({ message: err.message });
    }
};

// GET /coursesections/lecturer/filter?session=&faculty=&page=&pageSize=
exports.filterCourseSections4Lecturer = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'LECTURER') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { session, faculty, page, pageSize } = req.query;
        const result = await accountRepo.filterCourseSections4Lecturer(decoded.user_id, session, faculty, page, pageSize);
        res.status(200).json(result);
    } catch (err) {
        console.error('Error in filterCourseSections:', err);
        res.status(500).json({ message: err.message });
    }
};

// GET /coursesections/:course_section_id/students-parents
exports.getStudentsAndParentsByCourseSection = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role === 'STUDENT') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { course_section_id } = req.params;
        const result = await accountRepo.getStudentsAndParentsByCourseSection(course_section_id);
        res.status(200).json(result);
    } catch (err) {
        console.error('Error in getStudentsAndParentsByCourseSection:', err);
        res.status(500).json({ message: err.message });
    }
};

// GET /coursesections/student?page=&pageSize=
exports.getCourseSectionsByStudent = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'STUDENT') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { page, pageSize } = req.query;
        const result = await accountRepo.getCourseSectionsByStudent(decoded.user_id, page, pageSize);
        res.status(200).json(result);
    } catch (err) {
        console.error('Error in getCourseSectionsByStudent:', err);
        res.status(500).json({ message: err.message });
    }
};

// GET /coursesections/student-4-homeroomle?student_id=&page=&pageSize=
exports.getCourseSectionsByStudent = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'LECTURER') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { student_id, page, pageSize } = req.query;
        const result = await accountRepo.getCourseSectionsByStudent(student_id, page, pageSize);
        res.status(200).json(result);
    } catch (err) {
        console.error('Error in getCourseSectionsByStudent:', err);
        res.status(500).json({ message: err.message });
    }
};