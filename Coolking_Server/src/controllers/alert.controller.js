const alertRepo = require('../repositories/alert.repo');
const jwtUtils = require('../utils/jwt.utils');

/**
 * Gửi thông báo đến tất cả người dùng (Admin only)
 * POST /api/alerts/send-all
 */
const sendAlertToAll = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { header, body } = req.body;
        // Validate input
        if (!header || !body) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu đề và nội dung là bắt buộc'
            });
        }

        // Gọi repository để gửi thông báo
        const result = await alertRepo.sendAlertToAll(decoded.user_id, header, body);

        res.status(201).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error in sendAlertToAll controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi gửi thông báo'
        });
    }
};

/**
 * Gửi thông báo đến một người dùng cụ thể
 * POST /api/alerts/send-person
 */
const sendAlertToPerson = async (req, res) => {
    try {
        // Lấy thông tin người gửi từ token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role === 'STUDENT') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { receiversID, header, body } = req.body;

        // Validate input
        if (!receiversID || !header || !body) {
            return res.status(400).json({
                success: false,
                message: 'Người nhận, tiêu đề và nội dung là bắt buộc'
            });
        }

        // Validate receiversID là mảng
        if (!Array.isArray(receiversID) || receiversID.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách người nhận không được rỗng'
            });
        }

        // Gọi repository để gửi thông báo
        const result = await alertRepo.sendAlertToPerson(
            decoded.user_id,
            receiversID,
            header,
            body
        );

        res.status(201).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error in sendAlertToPerson controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi gửi thông báo'
        });
    }
};

/**
 * Lấy danh sách thông báo của người dùng hiện tại
 * GET /api/alerts/my-alerts?page=1&pageSize=10
 */
const getMyAlerts = async (req, res) => {
    try {
        // Lấy thông tin người dùng từ token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);

        // Lấy pagination params
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        // Validate pagination
        if (page < 1 || pageSize < 1 || pageSize > 100) {
            return res.status(400).json({
                success: false,
                message: 'Page phải >= 1 và pageSize phải từ 1-100'
            });
        }

        // Gọi repository để lấy thông báo
        const result = await alertRepo.getAlertsByUser(decoded.user_id, page, pageSize);

        res.status(200).json(result);

    } catch (error) {
        console.error('Error in getMyAlerts controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy danh sách thông báo'
        });
    }
};

/**
 * Đánh dấu thông báo đã đọc
 * PUT /api/alerts/:alertId/read
 */
const markAlertAsRead = async (req, res) => {
    try {
        // Lấy thông tin người dùng từ token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);

        const { alertId } = req.params;

        // Validate alertId
        if (!alertId) {
            return res.status(400).json({
                success: false,
                message: 'AlertId là bắt buộc'
            });
        }

        // Gọi repository để đánh dấu đã đọc
        const result = await alertRepo.markAlertAsRead(alertId, decoded.user_id);

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error in markAlertAsRead controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi đánh dấu đã đọc'
        });
    }
};

/**
 * Xóa thông báo
 * DELETE /api/alerts/:alertId
 */
const deleteAlert = async (req, res) => {
    try {
        // Lấy thông tin người dùng từ token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);

        const { createdAt, senderID, alertID } = req.body;

        let result;
        if (decoded.role === 'ADMIN') {
            result = await alertRepo.deleteAlert4Admin(alertID, senderID, createdAt);
        }
        else if (decoded.role === 'LECTURER') {
            result = await alertRepo.deleteAlert4Lecturer(decoded.user_id, createdAt);
        }
        else {
            result = await alertRepo.deleteAlert4Receiver(alertID, decoded.user_id);
        }

        res.status(200).json(result);

    } catch (error) {
        console.error('Error in deleteAlert controller:', error);

        // Xử lý lỗi permission
        if (error.message.includes('không có quyền') || error.message.includes('admin')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi xóa thông báo'
        });
    }
};

/**
 * Lấy tất cả thông báo (Admin only)
 * GET /api/alerts?page=1&pageSize=10&keyword=...
 */
const getAllAlerts = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const keyword = req.query.keyword || '';

        // Gọi repository để lấy tất cả thông báo
        const result = await alertRepo.getAllAlerts4Admin(page, pageSize, keyword);

        res.status(200).json(result);

    } catch (error) {
        console.error('Error in getAllAlerts controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy danh sách thông báo'
        });
    }
};

/**
 * Tìm kiếm các thông báo theo từ khóa (Admin only)
 * GET /api/alerts/search?keyword=&page=1&pageSize=10
 */
const searchAlerts = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role === 'STUDENT') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const keyword = req.query.keyword || '';
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        // Gọi repository để tìm kiếm thông báo
        const result = await alertRepo.searchAlertsByKeyword(keyword, decoded.role, decoded.user_id, page, pageSize);

        res.status(200).json(result);

    } catch (error) {
        console.error('Error in searchAlerts controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tìm kiếm thông báo'
        });
    }
};

/**
 * Cập nhật thông báo (Admin only)
 * PUT /api/alerts/:alertId
 */
const updateAlert4Admin = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { alertId } = req.params;
        const { header, body } = req.body;
        if (!header && !body) {
            return res.status(400).json({
                success: false,
                message: 'Chưa có thay đổi nào để cập nhật'
            });
        }
        const result = await alertRepo.updateAlert4Admin(alertId, header, body);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in updateAlert4Admin controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật thông báo'
        });
    }
};

/**
 * Lấy danh sách thông báo của người gửi hiện tại
 * GET /api/alerts/lecturer?page=1&pageSize=10
 */
const getAlertsBySender = async (req, res) => {
    try {
        // Lấy thông tin người dùng từ token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'LECTURER') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        // Lấy pagination params
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const result = await alertRepo.getAlertsBySender(decoded.user_id, page, pageSize);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in getAlertsBySender controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy danh sách thông báo'
        });
    }
};

/**
 * Đánh dấu thông báo đã đọc cho thông báo hệ thống
 * POST /api/alerts/system/:alertId/read
 */
const markSystemAlertAsRead = async (req, res) => {
    try {
        // Lấy thông tin người dùng từ token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        const { alertId } = req.params;
        const result = await alertRepo.markSystemAlertAsRead(alertId, decoded.user_id);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in markSystemAlertAsRead controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi đánh dấu thông báo là đã đọc'
        });
    }
};

/**
 * Xóa thông báo hệ thống cho người nhận
 * DELETE /api/alerts/system/:alertId
 */
const deleteAlertSystem4Receiver = async (req, res) => {
    try {
        // Lấy thông tin người dùng từ token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        const { alertId } = req.params;
        const result = await alertRepo.deleteAlertSystem4Receiver(alertId, decoded.user_id);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in deleteAlertSystem4Receiver controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi xóa thông báo hệ thống'
        });
    }
};

module.exports = {
    sendAlertToAll,
    sendAlertToPerson,
    getMyAlerts,
    markAlertAsRead,
    deleteAlert,
    getAllAlerts,
    searchAlerts,
    updateAlert4Admin,
    getAlertsBySender,
    markSystemAlertAsRead,
    deleteAlertSystem4Receiver
};