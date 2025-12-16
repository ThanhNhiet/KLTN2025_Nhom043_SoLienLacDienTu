const lecturerRepo = require('../repositories/lecturer.repo');
const jwtUtils = require('../utils/jwt.utils');

exports.getLecturerInfo = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        const lecturer = await lecturerRepo.getLecturerByLecturer_id(decoded.user_id);
        if (!lecturer) return res.status(404).json({ message: 'Giảng viên không tồn tại' });
        res.status(200).json(lecturer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    };
};

exports.updateLecturerInfo = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        const updatedLecturer = await lecturerRepo.updateLecturer(decoded.user_id, req.body);
        if (!updatedLecturer) return res.status(404).json({ message: 'Giảng viên không tồn tại' });
        res.status(200).json({ success: true, message: 'Cập nhật thông tin giảng viên thành công', name: updatedLecturer.name });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadAvatar = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
        }
        const updatedLecturer = await lecturerRepo.uploadAvatar(decoded.user_id, req.file);
        if (!updatedLecturer) return res.status(404).json({ message: 'Giảng viên không tồn tại' });
        res.status(200).json({ success: true, message: 'Cập nhật avatar thành công', avatar: updatedLecturer.avatar });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLecturerById = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const lecturer_id = req.params.id;
        const lecturer = await lecturerRepo.getLecturerById4Admin(lecturer_id);
        if (!lecturer) return res.status(404).json({ message: 'Giảng viên không tồn tại' });
        res.status(200).json(lecturer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//GET /lecturer/students-in-homeroom
exports.getStudentsInfoInHomeroomClass = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        console.log(decoded);
        if (!decoded || decoded.role !== 'LECTURER') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const lecturer_id = decoded.user_id;
        const students = await lecturerRepo.getStudentsInfoInHomeroomClassByLecturerId(lecturer_id);
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//GET /lecturer/homeroom-info/:class_id
exports.getLecturerInfoByHomeroomClassId = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const class_id = req.params.class_id;
        const lecturer = await lecturerRepo.getLecturerInfoByHomeroomClassId(class_id);
        if (!lecturer) return res.status(404).json({ message: 'Lớp học không tồn tại hoặc chưa có giáo viên chủ nhiệm' });
        res.status(200).json(lecturer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};