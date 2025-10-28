const { v4: uuidv4 } = require('uuid');
const { Alert, IsReadAlert } = require('../databases/mongodb/schemas');
const { Op } = require('sequelize');
const mongoose = require('mongoose');
const datetimeFormatter = require("../utils/format/datetime-formatter");

/**
 * Gửi thông báo đến tất cả người dùng
 * @param {Object} alertData - Dữ liệu thông báo
 * @param {String} alertData.header - Tiêu đề thông báo
 * @param {String} alertData.body - Nội dung thông báo
 * @returns {Object} - Kết quả tạo thông báo
 */
const sendAlertToAll = async (user_id, header, body) => {
    try {
        // Validate input
        if (!header || !body) {
            throw new Error('Header và body là bắt buộc');
        }

        // Tạo alert với targetScope = 'all' và senderID = null
        const alert = new Alert({
            _id: uuidv4(),
            senderID: user_id,
            receiverID: null, // Không có receiver cụ thể vì gửi cho all
            header: header.trim(),
            body: body.trim(),
            targetScope: 'all',
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Lưu vào database
        await alert.save();

        return {
            success: true,
            message: 'Gửi thông báo thành công đến tất cả người dùng'
        };

    } catch (error) {
        console.error('Error in sendAlertToAll:', error);
        throw new Error(`Lỗi khi gửi thông báo: ${error.message}`);
    }
};

/**
 * Gửi thông báo đến nhiều người dùng cụ thể
 * @param {String} senderID - ID người gửi
 * @param {Array} receiversID - Mảng ID người nhận ["1", "2", "3"]
 * @param {String} header - Tiêu đề thông báo
 * @param {String} body - Nội dung thông báo
 * @returns {Object} - Kết quả tạo thông báo
 */
const sendAlertToPerson = async (senderID, receiversID, header, body) => {
    try {
        // Validate input
        if (!senderID || !receiversID || !header || !body) {
            throw new Error('SenderID, receiversID, header và body là bắt buộc');
        }

        // Validate receiversID là mảng và không rỗng
        if (!Array.isArray(receiversID) || receiversID.length === 0) {
            throw new Error('ReceiversID phải là mảng và không được rỗng');
        }

        const alertsToCreate = [];

        // Tạo alert cho từng receiver
        for (const receiverID of receiversID) {
            if (!receiverID || receiverID.trim() === '') {
                console.warn(`Bỏ qua receiverID không hợp lệ: ${receiverID}`);
                continue;
            }

            const alert = new Alert({
                _id: uuidv4(),
                senderID: senderID,
                receiverID: receiverID.trim(),
                header: header.trim(),
                body: body.trim(),
                targetScope: 'person',
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            alertsToCreate.push(alert);
        }

        // Bulk insert tất cả alerts
        if (alertsToCreate.length > 0) {
            await Alert.insertMany(alertsToCreate);
        }

        return {
            success: true,
            message: `Gửi thông báo thành công`
        };

    } catch (error) {
        console.error('Error in sendAlertToPerson:', error);
        throw new Error(`Lỗi khi gửi thông báo: ${error.message}`);
    }
};

/**
 * Lấy danh sách thông báo cho một người dùng
 * @param {String} userID - ID người dùng
 * @param {Number} page - Trang hiện tại (default: 1)
 * @param {Number} pageSize - Số lượng alert mỗi trang (default: 10)
 * @returns {Object} - Danh sách thông báo
 */
const getAlertsByUser = async (userID, page = 1, pageSize = 10) => {
    try {
        if (!userID) {
            throw new Error('UserID là bắt buộc');
        }

        const skip = (page - 1) * pageSize;

        // Lấy thông báo cá nhân
        const personalAlerts = await Alert.find({
            receiverID: userID,
            targetScope: 'person'
        })
            .sort({ createdAt: -1 })
            .select('_id senderID receiverID header body targetScope isRead createdAt updatedAt');

        // Lấy thông báo hệ thống (all)
        const systemAlerts = await Alert.find({
            targetScope: 'all'
        })
            .sort({ createdAt: -1 })
            .select('_id senderID receiverID header body targetScope isRead createdAt updatedAt');

        // Lấy trạng thái đọc/xóa của thông báo hệ thống cho user này
        const systemAlertIds = systemAlerts.map(alert => alert._id);
        const isReadAlerts = await IsReadAlert.find({
            alertID: { $in: systemAlertIds },
            receiverID: userID
        });

        // Tạo map để tra cứu nhanh trạng thái isRead và isDelete
        const isReadAlertMap = {};
        isReadAlerts.forEach(item => {
            isReadAlertMap[item.alertID] = {
                isRead: item.isRead,
                isDelete: item.isDelete
            };
        });

        // Xử lý thông báo hệ thống - loại bỏ những thông báo đã bị xóa
        const processedSystemAlerts = systemAlerts
            .filter(alert => {
                const readInfo = isReadAlertMap[alert._id];
                return !readInfo || !readInfo.isDelete; // Chỉ lấy những thông báo chưa bị xóa
            })
            .map(alert => {
                const readInfo = isReadAlertMap[alert._id];
                return {
                    _id: alert._id,
                    senderID: alert.senderID,
                    receiverID: alert.receiverID,
                    header: alert.header,
                    body: alert.body,
                    targetScope: alert.targetScope,
                    isRead: readInfo ? readInfo.isRead : false, // Mặc định chưa đọc nếu chưa có bản ghi
                    createdAt: alert.createdAt ? datetimeFormatter.formatDateTimeVN(alert.createdAt) : null,
                    updatedAt: alert.updatedAt ? datetimeFormatter.formatDateTimeVN(alert.updatedAt) : null
                };
            });

        // Xử lý thông báo cá nhân
        const processedPersonalAlerts = personalAlerts.map(alert => {
            return {
                _id: alert._id,
                senderID: alert.senderID,
                receiverID: alert.receiverID,
                header: alert.header,
                body: alert.body,
                targetScope: alert.targetScope,
                isRead: alert.isRead,
                createdAt: alert.createdAt ? datetimeFormatter.formatDateTimeVN(alert.createdAt) : null,
                updatedAt: alert.updatedAt ? datetimeFormatter.formatDateTimeVN(alert.updatedAt) : null
            };
        });

        // Gộp tất cả thông báo và sắp xếp theo thời gian
        const allAlerts = [...processedSystemAlerts, ...processedPersonalAlerts]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(skip, skip + pageSize);

        // Đếm tổng số thông báo (không bao gồm thông báo hệ thống đã xóa)
        const totalPersonal = personalAlerts.length;
        const totalSystem = processedSystemAlerts.length;
        const total = totalPersonal + totalSystem;

        // Đếm số thông báo chưa đọc
        const personalUnreadCount = personalAlerts.filter(alert => !alert.isRead).length;
        const systemUnreadCount = processedSystemAlerts.filter(alert => !alert.isRead).length;
        const unreadCount = personalUnreadCount + systemUnreadCount;

        // Tạo pagination links
        const linkPrev = page > 1 ? `/api/alerts/my-alerts?page=${page - 1}&pageSize=${pageSize}` : null;
        const linkNext = (page - 1) * pageSize + allAlerts.length < total ? `/api/alerts/my-alerts?page=${page + 1}&pageSize=${pageSize}` : null;

        // Tạo pages array (3 trang kế tiếp từ trang hiện tại)
        const totalPages = Math.ceil(total / pageSize);
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i >= page && i < page + 3) {
                pages.push(i);
            }
        }

        return {
            total,
            page,
            pageSize,
            alerts: allAlerts,
            linkPrev,
            linkNext,
            pages,
            unreadCount
        };

    } catch (error) {
        console.error('Error in getAlertsByUser:', error);
        throw new Error(`Lỗi khi lấy danh sách thông báo: ${error.message}`);
    }
};

/**
 * Đánh dấu thông báo đã đọc
 * @param {String} alertId - ID thông báo
 * @param {String} userID - ID người dùng (để verify quyền)
 * @returns {Object} - Kết quả cập nhật
 */
const markAlertAsRead = async (alertId, userID) => {
    try {
        if (!alertId || !userID) {
            throw new Error('AlertId và userID là bắt buộc');
        }

        // Tìm và cập nhật thông báo
        const alert = await Alert.findOneAndUpdate(
            {
                _id: alertId,
                receiverID: userID,
                targetScope: 'person'
            },
            {
                isRead: true,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!alert) {
            throw new Error('Không tìm thấy thông báo hoặc bạn không có quyền truy cập');
        }

        return {
            success: true,
            message: 'Đánh dấu đã đọc thành công'
        };

    } catch (error) {
        console.error('Error in markAlertAsRead:', error);
        throw new Error(`Lỗi khi đánh dấu đã đọc: ${error.message}`);
    }
};

/**
 *  Đánh dấu thông báo hệ thống (targetScope: 'all') đã đọc
 *  Tạo bản ghi trong IsReadAlert
 * @param {String} alertID - ID thông báo
 * @param {String} receiverID - ID người nhận
 * @returns {Object} - Kết quả tạo bản ghi
 */
const markSystemAlertAsRead = async (alertID, receiverID) => {
    try {
        if (!alertID) {
            throw new Error('AlertID là bắt buộc');
        }
        if (!receiverID) {
            throw new Error('ReceiverID là bắt buộc');
        }

        // Kiểm tra thông báo có tồn tại và là thông báo hệ thống không
        const alert = await Alert.findOne({
            _id: alertID,
            targetScope: 'all'
        });
        if (!alert) {
            throw new Error('Không tìm thấy thông báo hoặc không phải là thông báo hệ thống');
        }

        // Tạo bản ghi trong IsReadAlert
        const isReadAlert = new IsReadAlert({
            _id: uuidv4(),
            alertID: alert._id,
            receiverID: receiverID
        });
        await isReadAlert.save();

        return {
            success: true,
            message: 'Đánh dấu đã đọc thành công'
        };

    } catch (error) {
        console.error('Error in markSystemAlertAsRead:', error);
        throw new Error(`Lỗi khi đánh dấu đã đọc: ${error.message}`);
    }
};

// Xóa thông báo dành cho admin
const deleteAlert4Admin = async (alertId, senderID, createdAt) => {
    try {
        // 2 trường hợp, xóa thông báo all hoặc xóa thông báo person
        // Tìm thông báo all
        if (alertId !== '') {
            const alert = await Alert.findById(alertId);
            if (!alert) {
                throw new Error('Không tìm thấy thông báo');
            }
            if (alert.targetScope !== 'all') {
                throw new Error('Alert này không phải là thông báo hệ thống');
            }
            await Alert.findByIdAndDelete(alertId);
            await IsReadAlert.deleteMany({ alertID: alertId });
            return {
                success: true,
                message: 'Xóa thông báo thành công'
            };
        }

        const parsedDate = datetimeFormatter.parseDDMMYYYY2UTC(createdAt);
        // Tạo khoảng thời gian trong giây đó (±999ms)
        const startOfSecond = new Date(parsedDate);
        startOfSecond.setUTCMilliseconds(0);
        const endOfSecond = new Date(parsedDate);
        endOfSecond.setUTCMilliseconds(999);

        // Tạo thêm khoảng thời gian offset để xử lý múi giờ
        // Chuyển về utc chuẩn (+0) rồi mới tính offset
        const startWithOffset = new Date(startOfSecond.getTime() - 7 * 60 * 60 * 1000); // -7h
        const endWithOffset = new Date(endOfSecond.getTime() + 7 * 60 * 60 * 1000);   // +7h
        // Tạo khoảng thời gian chênh lệch 2 giây
        const diffWithOffset = new Date(endWithOffset.getTime() - startWithOffset.getTime() + 2 * 1000);
        endWithOffset.setTime(startWithOffset.getTime() + diffWithOffset.getTime());

        // Tìm thông báo trong khoảng thời gian có tính đến múi giờ
        const query = {
            senderID: senderID,
            targetScope: 'person',
            createdAt: { $gte: startWithOffset, $lte: endWithOffset }
        };

        // Tìm thông báo
        const alerts = await Alert.find(query);
        if (alerts.length === 0) {
            throw new Error('Không tìm thấy thông báo');
        }

        // Xóa thông báo với createdAt chính xác
        const deleteResult = await Alert.deleteMany(query);
        return {
            success: true,
            message: `Xóa thành công ${deleteResult.deletedCount} thông báo`
        };

    } catch (error) {
        console.error('Error in deleteAlert4Admin:', error);
        throw new Error(`Lỗi khi xóa thông báo: ${error.message}`);
    }
};

// Xóa thông báo dành cho giảng viên
const deleteAlert4Lecturer = async (senderID, createdAt) => {
    try {
        if (!senderID) {
            throw new Error('SenderID là bắt buộc');
        }
        // console.log('Input createdAt:', createdAt);

        // Parse date từ string
        const parsedDate = datetimeFormatter.parseDDMMYYYY2UTC(createdAt);
        // console.log('Parsed date:', parsedDate);
        // console.log('senderID:', senderID);

        // Vì có vấn đề múi giờ, tạo khoảng thời gian 1 giây để tìm kiếm
        const startOfSecond = new Date(parsedDate);
        startOfSecond.setUTCMilliseconds(0);
        const endOfSecond = new Date(parsedDate);
        endOfSecond.setUTCMilliseconds(999);

        // Tạo thêm khoảng thời gian offset để xử lý múi giờ
        // Chuyển về utc chuẩn (+0) rồi mới tính offset
        const startWithOffset = new Date(startOfSecond.getTime() - 7 * 60 * 60 * 1000); // -7h
        const endWithOffset = new Date(endOfSecond.getTime() + 7 * 60 * 60 * 1000);   // +7h
        // Tạo khoảng thời gian chênh lệch 2 giây
        const diffWithOffset = new Date(endWithOffset.getTime() - startWithOffset.getTime() + 2 * 1000);
        endWithOffset.setTime(startWithOffset.getTime() + diffWithOffset.getTime());

        // console.log('Search with timezone offset:');
        // console.log('- startWithOffset:', startWithOffset);
        // console.log('- endWithOffset:', endWithOffset);

        // Tìm thông báo trong khoảng thời gian có tính đến múi giờ
        const query = {
            senderID: senderID,
            targetScope: 'person',
            createdAt: { $gte: startWithOffset, $lte: endWithOffset }
        };

        // console.log('Exact query:', query);

        // Tìm thông báo
        const alerts = await Alert.find(query);
        // console.log('Found alerts with exact match:', alerts.length);

        if (alerts.length === 0) {
            throw new Error('Không tìm thấy thông báo');
        }

        // Xóa thông báo với createdAt chính xác
        const deleteResult = await Alert.deleteMany(query);
        // console.log('Deleted count:', deleteResult.deletedCount);

        return {
            success: true,
            message: `Xóa thành công ${deleteResult.deletedCount} thông báo`
        };

    } catch (error) {
        console.error('Error in deleteAlert4Lecturer:', error);
        throw new Error(`Lỗi khi xóa thông báo: ${error.message}`);
    }
};

// Xóa thông báo dành cho người nhận
const deleteAlert4Receiver = async (alertID, receiverID) => {
    try {
        if (!receiverID) {
            throw new Error('ReceiverID là bắt buộc');
        }
        if (!alertID) {
            throw new Error('AlertID là bắt buộc');
        }
        // Tìm thông báo
        const alert = await Alert.findOne({
            _id: alertID,
            receiverID: receiverID
        });
        if (!alert) {
            throw new Error('Không tìm thấy thông báo');
        }

        // Xóa thông báo
        await Alert.deleteOne({
            _id: alertID,
            receiverID: receiverID
        });

        return {
            success: true,
            message: 'Xóa thông báo thành công'
        };

    } catch (error) {
        console.error('Error in deleteAlert4Lecturer:', error);
        throw new Error(`Lỗi khi xóa thông báo: ${error.message}`);
    }
};

/**
 * Xóa mềm thông báo ở phạm vi all dành cho người nhận
 * @param {String} alertID - ID thông báo
 * @param {String} receiverID - ID người nhận
 */
const deleteAlertSystem4Receiver = async (alertID, receiverID) => {
    try {
        if (!alertID) {
            throw new Error('AlertID là bắt buộc');
        }
        if (!receiverID) {
            throw new Error('ReceiverID là bắt buộc');
        }

        // Tìm thông báo
        const isReadAlertRecord = await IsReadAlert.findOne({
            alertID: alertID,
            receiverID: receiverID
        });
        if (!isReadAlertRecord) {
            throw new Error('Không tìm thấy thông báo');
        }

        // Xóa mềm thông báo
        isReadAlertRecord.isDelete = true;
        await isReadAlertRecord.save();

        return {
            success: true,
            message: 'Xóa thông báo thành công'
        };
    } catch (error) {
        console.error('Error in deleteAlertSystem4Receiver:', error);
        throw new Error(`Lỗi khi xóa thông báo: ${error.message}`);
    }
};

/**
 * Lấy tất cả thông báo (dành cho admin)
 * @param {Number} page - Trang hiện tại
 * @param {Number} pageSize - Số lượng alert mỗi trang
 * @returns {Object} - Danh sách thông báo
 */
const getAllAlerts4Admin = async (page = 1, pageSize = 10) => {
    try {
        const skip = (page - 1) * pageSize;

        // Lấy toàn bộ thông báo (bao gồm all + person)
        const alerts = await Alert.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .select('_id senderID receiverID header body targetScope isRead createdAt updatedAt')
            .lean();

        // Chuẩn bị các promise để kiểm tra isWarningYet
        const warningCheckPromises = alerts.map(alert => {
            if (alert.header && alert.header.startsWith('Yêu cầu Cảnh báo học vụ')) {
                return isWarningYet4Alert(alert.header);
            }
            return Promise.resolve(null); // Trả về null cho các trường hợp khác
        });

        // Thực thi các promise song song
        const warningResults = await Promise.all(warningCheckPromises);

        
        // Đếm tổng số
        const total = await Alert.countDocuments({});

        // Chuẩn hóa dữ liệu trả về
        const processedAlerts = alerts.map((alert, index) => ({
            _id: alert._id,
            senderID: alert.senderID || 'System',
            receiverID: alert.receiverID || 'All',
            header: alert.header,
            body: alert.body,
            targetScope: alert.targetScope,
            isRead: alert.isRead,
            isWarningYet: warningResults[index], // Gán kết quả kiểm tra
            createdAt: alert.createdAt ? datetimeFormatter.formatDateTimeVN(alert.createdAt) : null, 
            updatedAt: alert.updatedAt ? datetimeFormatter.formatDateTimeVN(alert.updatedAt) : null
        }));

        // Tạo link pagination
        const linkPrev = page > 1 ? `/api/alerts/admin?page=${page - 1}&pageSize=${pageSize}` : null;
        const linkNext = (page - 1) * pageSize + processedAlerts.length < total
            ? `/api/alerts/admin?page=${page + 1}&pageSize=${pageSize}`
            : null;

        const totalPages = Math.ceil(total / pageSize);
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i >= page && i < page + 3) {
                pages.push(i);
            }
        }

        return {
            success: true,
            total,
            page,
            pageSize,
            alerts: processedAlerts,
            linkPrev,
            linkNext,
            pages
        };

    } catch (error) {
        console.error('Error in getAllAlertsForAdmin:', error);
        throw new Error(`Lỗi khi lấy tất cả thông báo: ${error.message}`);
    }
};

/**
 * Tìm kiếm thông báo theo keyword (dành cho admin và giảng viên)
 * @param {String} keyword - Từ khóa (tìm theo header, senderID, createdAt)
 * @param {String} role - Vai trò người dùng ('ADMIN' hoặc 'LECTURER')
 * @param {String} user_id - ID người dùng (để lọc nếu là giảng viên)
 * @param {Number} page - Trang hiện tại
 * @param {Number} pageSize - Số lượng alert mỗi trang
 * @returns {Object} - Danh sách thông báo
 */
const searchAlertsByKeyword = async (keyword, role, user_id, page = 1, pageSize = 10) => {
    try {
        if (!keyword || keyword.trim() === '') {
            return await getAllAlerts4Admin(page, pageSize);
        }

        const skip = (page - 1) * pageSize;
        const regexKeyword = new RegExp(keyword.trim(), 'i');

        // Nếu keyword trông giống ngày dd-MM-yyyy hoặc dd-MM-yyyy hh:mm:ss thì parse
        let parsedDate = null;
        const datePattern = /^\d{2}[-/]\d{2}[-/]\d{4}(?: \d{2}:\d{2}:\d{2})?$/;
        if (datePattern.test(keyword.trim())) {
            try {
                parsedDate = datetimeFormatter.parseDDMMYYYY2UTC(keyword.trim());
            } catch {
                parsedDate = null;
            }
        }

        const query = {
            $or: [
                { header: { $regex: regexKeyword } },
                { senderID: { $regex: regexKeyword } },
            ]
        };

        if (parsedDate) {
            query.$or.push({ createdAt: { $gte: parsedDate } });
        }

        // Nếu là giảng viên, chỉ được xem thông báo do mình gửi
        if (role === 'LECTURER') {
            query.senderID = user_id;
        }
        // Admin thì không cần thêm điều kiện
        const alerts = await Alert.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .select('_id senderID receiverID header body targetScope isRead createdAt updatedAt');

        const total = await Alert.countDocuments(query);

        const processedAlerts = alerts.map(alert => ({
            _id: alert._id,
            senderID: alert.senderID || 'System',
            receiverID: alert.receiverID || 'All',
            header: alert.header,
            body: alert.body,
            targetScope: alert.targetScope,
            isRead: alert.isRead,
            createdAt: alert.createdAt ? datetimeFormatter.formatDateTimeVN(alert.createdAt) : null,
            updatedAt: alert.updatedAt ? datetimeFormatter.formatDateTimeVN(alert.updatedAt) : null
        }));

        const linkPrev = page > 1
            ? `/api/alerts/admin/search?keyword=${encodeURIComponent(keyword)}&page=${page - 1}&pageSize=${pageSize}`
            : null;

        const linkNext = (page - 1) * pageSize + processedAlerts.length < total
            ? `/api/alerts/admin/search?keyword=${encodeURIComponent(keyword)}&page=${page + 1}&pageSize=${pageSize}`
            : null;

        const totalPages = Math.ceil(total / pageSize);
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i >= page && i < page + 3) pages.push(i);
        }

        return {
            success: true,
            total,
            page,
            pageSize,
            alerts: processedAlerts,
            linkPrev,
            linkNext,
            pages
        };

    } catch (error) {
        console.error('Error in searchAlertsByKeyword4Admin:', error);
        throw new Error(`Lỗi khi tìm kiếm thông báo: ${error.message}`);
    }
};

/**
 * Cập nhật thông báo (dành cho admin)
 * @param {String} alertId - ID thông báo
 * @param {String} header - Tiêu đề mới
 * @param {String} body - Nội dung mới
 * @returns {Object} - Kết quả cập nhật
 */
const updateAlert4Admin = async (alertId, header, body) => {
    try {
        const updatedAlert = await Alert.findByIdAndUpdate(alertId, { header, body }, { new: true });
        if (!updatedAlert) {
            throw new Error('Thông báo không tồn tại');
        }
        return {
            success: true,
            message: 'Cập nhật thông báo thành công'
        };
    } catch (error) {
        console.error('Error updating alert:', error);
        throw new Error(`Lỗi khi cập nhật thông báo: ${error.message}`);
    }
};

/**
 * Lấy danh sách thông báo dựa theo người gửi
 * @param {String} senderID - ID người gửi
 * @param {Number} page - Trang hiện tại (default: 1)
 * @param {Number} pageSize - Số lượng alert mỗi trang (default: 10)
 * @returns {Object} - Danh sách thông báo
 */
const getAlertsBySender = async (senderID, page = 1, pageSize = 10) => {
    try {
        if (!senderID) {
            throw new Error('SenderID là bắt buộc');
        }

        const skip = (page - 1) * pageSize;

        const alerts = await Alert.find({ senderID })
            .skip(skip)
            .limit(pageSize)
            .sort({ createdAt: -1 });

        const total = await Alert.countDocuments({ senderID });

        // Chuẩn hóa dữ liệu trả về
        const processedAlerts = alerts.map(alert => ({
            _id: alert._id,
            senderID: alert.senderID || 'System',
            receiverID: alert.receiverID || 'All',
            header: alert.header,
            body: alert.body,
            targetScope: alert.targetScope,
            isRead: alert.isRead,
            createdAt: alert.createdAt ? datetimeFormatter.formatDateTimeVN(alert.createdAt) : null,
            updatedAt: alert.updatedAt ? datetimeFormatter.formatDateTimeVN(alert.updatedAt) : null
        }));

        const linkPrev = page > 1 ? `/api/alerts/sender/${senderID}?page=${page - 1}&pageSize=${pageSize}` : null;
        const linkNext = (page - 1) * pageSize + processedAlerts.length < total
            ? `/api/alerts/sender/${senderID}?page=${page + 1}&pageSize=${pageSize}`
            : null;

        const totalPages = Math.ceil(total / pageSize);
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i >= page && i < page + 3) {
                pages.push(i);
            }
        }

        return {
            success: true,
            total,
            page,
            pageSize,
            alerts: processedAlerts,
            linkPrev,
            linkNext,
            pages
        };
    } catch (error) {
        console.error('Error getting alerts by sender:', error);
        throw new Error(`Lỗi khi lấy danh sách thông báo: ${error.message}`);
    }
};

/**
 * Kiểm tra xem cảnh báo đã được gửi chưa (dựa trên header đã cắt)
 * @param {String} header - Tiêu đề gốc của yêu cầu cảnh báo
 * @returns {Promise<boolean>} - true nếu đã có, false nếu chưa
 */
const isWarningYet4Alert = async (header) => {
    try {
        if (!header || typeof header !== 'string') {
            return false;
        }

        // Cắt bỏ 2 từ đầu, ví dụ: "Yêu cầu Cảnh báo học vụ..." -> "Cảnh báo học vụ..."
        const trimmedHeader = header.split(' ').slice(2).join(' ');

        if (!trimmedHeader) {
            return false;
        }

        // Tìm kiếm alert có header đã cắt
        const existingAlert = await Alert.findOne({ header: trimmedHeader });

        return !!existingAlert; // Trả về true nếu tìm thấy, ngược lại false

    } catch (error) {
        console.error('Error in isWarningYet4Alert:', error);
        // Trong trường hợp lỗi, coi như chưa có để tránh chặn nhầm
        return false;
    }
};

/**
 * Kiểm tra xem sinh viên đã nhận được cảnh báo cho một lớp học phần cụ thể chưa
 * @param {string} course_section_id 
 * @param {string} student_id 
 * @returns {Promise<boolean>}
 */
const isWarningYet4Student = async (course_section_id, student_id) => {
    try {
        if (!course_section_id || !student_id) {
            return false;
        }

        // Tìm kiếm alert có header chứa "Cảnh báo", course_section_id và student_id
        const existingAlert = await Alert.findOne({
            $and: [
                { header: { $regex: '^Cảnh báo', $options: 'i' } },
                { header: { $regex: course_section_id, $options: 'i' } },
                { header: { $regex: student_id, $options: 'i' } }
            ]
        });

        return !!existingAlert;

    } catch (error) {
        console.error('Error in isWarningYet4Student:', error);
        return false;
    }
};

module.exports = {
    sendAlertToAll,
    sendAlertToPerson,
    getAlertsByUser,
    updateAlert4Admin,
    markAlertAsRead,
    deleteAlert4Admin,
    deleteAlert4Lecturer,
    deleteAlert4Receiver,
    getAllAlerts4Admin,
    searchAlertsByKeyword,
    getAlertsBySender,
    markSystemAlertAsRead,
    deleteAlertSystem4Receiver,
    isWarningYet4Student
};