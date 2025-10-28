const staffRepo = require('../repositories/staff.repo');
const jwtUtils = require('../utils/jwt.utils');

// GET /api/staffs/admin/info
exports.getStaffAdminInfo = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const staff = await staffRepo.getStaffByAdmin_id4Admin(decoded.user_id);
        if (!staff) return res.status(404).json({ message: 'Nhân viên không tồn tại' });
        res.status(200).json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/staffs/add-admin-id/:staff_id?adminid=<admin_id>&position=<position>
// exports.addAdminId4Staff = async (req, res) => {
//     try {
//         const authHeader = req.headers['authorization'];
//         const token = authHeader && authHeader.split(' ')[1];
//         const decoded = jwtUtils.verifyAccessToken(token);
//         if (!decoded || decoded.role !== 'ADMIN') {
//             return res.status(403).json({ message: 'Forbidden' });
//         }
//         const staff_id = req.params.staff_id;
//         const admin_id = req.query.adminid;
//         const position = req.query.position;
//         const newStaff = await staffRepo.addAdmin_id4Staff(admin_id, staff_id, position);
//         if (!newStaff) return res.status(400).json({ success: false, message: 'Thêm admin thất bại' });
//         res.status(201).json({ success: true, message: 'Thêm admin thành công' });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// PUT /api/staffs/admin
exports.updateStaffAdminInfo = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const updatedStaff = await staffRepo.updateStaff4Admin(decoded.user_id, req.body);
        if (!updatedStaff) return res.status(404).json({ success: false, message: 'Nhân viên không tồn tại' });
        res.status(200).json({ success: true, message: 'Cập nhật thông tin nhân viên thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/staffs/:id
// exports.deleteStaff = async (req, res) => {
//     try {
//         const authHeader = req.headers['authorization'];
//         const token = authHeader && authHeader.split(' ')[1];
//         const decoded = jwtUtils.verifyAccessToken(token);
//         if (!decoded || decoded.role !== 'ADMIN') {
//             return res.status(403).json({ message: 'Forbidden' });
//         }
//         const deletedStaff = await staffRepo.deleteStaff(req.params.id);
//         if (!deletedStaff) return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
//         res.status(200).json({ message: 'Xóa nhân viên thành công' });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// GET /api/staffs/:id
exports.getStaffById = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const staff_id = req.params.id;
        const staff = await staffRepo.getStaffByStaff_id(staff_id);
        if (!staff) return res.status(404).json({ message: 'Nhân viên không tồn tại' });
        res.status(200).json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/staff/admin/avatar
exports.uploadAvatarStaffAdmin = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
        }
        const updatedStaffAdmin = await staffRepo.uploadAvatar4Admin(decoded.user_id, req.file);
        if (!updatedStaffAdmin) return res.status(404).json({ message: 'Nhân viên không tồn tại' });
        res.status(200).json({ success: true, message: 'Cập nhật avatar thành công', avatar: updatedStaffAdmin.avatar });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/staffs/admin/all?department=<department>
exports.getAllStaffsAdmin = async (req, res) => {
    try {
        const { department } = req.query;
        const staffs = await staffRepo.getAllStaffs(department);
        res.status(200).json(staffs);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};