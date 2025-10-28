const chatRepo = require('../repositories/chat.repo');
const jwtUtils = require('../utils/jwt.utils');

// POST /api/chats/group?course_section_id=&nameGroup=
exports.createGroupChat = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { nameGroup, course_section_id } = req.query;
        if (!nameGroup || !course_section_id) {
            return res.status(400).json({
                success: false,
                message: 'Tên nhóm và mã course section là bắt buộc'
            });
        }
        const chat = await chatRepo.createGroupChat4Admin(decoded.user_id, nameGroup, course_section_id);
        res.status(201).json(chat);
    } catch (error) {
        console.error('Error in createGroupChat controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo nhóm chat'
        });
    }
};

// POST /api/chats/private/:userID
exports.createPrivateChat = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { userID } = req.params;
        if (!userID) {
            return res.status(400).json({
                success: false,
                message: 'userID là bắt buộc'
            });
        }
        const chat = await chatRepo.createPrivateChat4Users(decoded.user_id, userID);
        res.status(201).json(chat);
    } catch (error) {
        console.error('Error in createPrivateChat controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo cuộc trò chuyện'
        });
    }
};

// GET /api/chats/group-info/:course_section_id
exports.getGroupChatInfoByCourseSection = async (req, res) => {
    try {
        const { course_section_id } = req.params;
        if (!course_section_id) {
            return res.status(400).json({
                success: false,
                message: 'course_section_id là bắt buộc'
            });
        }
        const chat = await chatRepo.getGroupChatInfoByCourseSection4Admin(course_section_id);
        res.status(200).json(chat);
    } catch (error) {
        console.error('Error in getGroupChatInfoByCourseSection controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy thông tin nhóm chat'
        });
    }
};

// PUT /api/chats/group/:chatID
exports.updateGroupChat = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { chatID } = req.params;
        const updateData = req.body; // {name?, students: [], lecturers: []}
        
        if (!chatID) {
            return res.status(400).json({
                success: false,
                message: 'chatID là bắt buộc'
            });
        }

        const chat = await chatRepo.updateGroupChat4Admin(decoded.user_id, chatID, updateData);
        res.status(200).json(chat);
    } catch (error) {
        console.error('Error in updateGroupChat controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật nhóm chat'
        });
    }
};

// DELETE /api/chats/:chatID
exports.deleteChat = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { chatID } = req.params;
        if (!chatID) {
            return res.status(400).json({
                success: false,
                message: 'chatID là bắt buộc'
            });
        }
        const result = await chatRepo.deleteGroupChat4Admin(chatID);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in deleteChat controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi xóa cuộc trò chuyện'
        });
    }
};

// GET /api/chats?page=&pageSize=
exports.getUserChats = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const { page, pageSize } = req.query;
        const chats = await chatRepo.getUserChats(decoded.user_id, decoded.role, page, pageSize);
        res.status(200).json(chats);
    } catch (error) {
        console.error('Error in getUserChats controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy danh sách cuộc trò chuyện'
        });
    }
};

// GET /api/chats/search?keyword=
exports.searchChatsByKeyword = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { keyword } = req.query;
        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: 'keyword là bắt buộc'
            });
        }
        const chats = await chatRepo.searchChatsByKeyword(decoded.user_id, keyword, decoded.role);
        res.status(200).json(chats);
    } catch (error) {
        console.error('Error in searchChatsByKeyword controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tìm kiếm cuộc trò chuyện'
        });
    }
};

// DELETE /api/chats/cleanup-inactive
exports.deleteInactivePrivateChats = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const result = await chatRepo.deleteInactivePrivateChats();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in deleteInactivePrivateChats controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi xóa cuộc trò chuyện riêng không hoạt động'
        });
    }
};

// GET /api/chats/all?page=1&pageSize=10
exports.getAllChats = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { page, pageSize } = req.query;
        const chats = await chatRepo.getAllChats(page, pageSize);
        res.status(200).json(chats);
    } catch (error) {
        console.error('Error in getAllChats controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy danh sách cuộc trò chuyện'
        });
    }
};

// GET /api/chats/all/search?keyword=&page=&pageSize=
exports.searchAllChats = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { keyword, page, pageSize } = req.query;
        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: 'keyword là bắt buộc'
            });
        }
        const chats = await chatRepo.searchChatsByKeyword4Admin(keyword, page, pageSize);
        res.status(200).json(chats);
    } catch (error) {
        console.error('Error in searchAllChats controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tìm kiếm cuộc trò chuyện'
        });
    }
};

// GET /api/chats/nonchat-course-sections?page=1&pageSize=10
exports.getNonChatCourseSections = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { page, pageSize } = req.query;
        const courseSections = await chatRepo.getNonChatCourseSections(page, pageSize);
        res.status(200).json(courseSections);
    } catch (error) {
        console.error('Error in getNonChatCourseSections controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy danh sách course section chưa có nhóm chat'
        });
    }
};

// GET /api/Chats/nonchat-course-sections/search?keyword=<keyword>&page=1&pageSize=10
exports.searchNonChatCourseSections = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { keyword, page, pageSize } = req.query;
        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: 'keyword là bắt buộc'
            });
        }
        const courseSections = await chatRepo.searchNonChatCourseSections(keyword, page, pageSize);
        res.status(200).json(courseSections);
    } catch (error) {
        console.error('Error in searchNonChatCourseSections controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tìm kiếm course section chưa có nhóm chat'
        });
    }
};

// POST /api/chats/homeroom/:lecturer_id
exports.createGroupChatWithHomeroomLecturer = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { lecturer_id } = req.params;
        if (!lecturer_id) {
            return res.status(400).json({
                success: false,
                message: 'lecturer_id là bắt buộc'
            });
        }
        const chat = await chatRepo.createGroupChatWithHomeroomLecturer(decoded.user_id, lecturer_id);
        res.status(201).json(chat);
    } catch (error) {
        console.error('Error in createGroupChatWithHomeroomLecturer controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo nhóm chat với giảng viên chủ nhiệm'
        });
    }
};

// GET /api/chats/nonchat-course-sections/session/:session_id?page=1&pageSize=10
// exports.getNonChatCourseSectionsBySession = async (req, res) => {
//     try {
//         const authHeader = req.headers['authorization'];
//         const token = authHeader && authHeader.split(' ')[1];
//         const decoded = jwtUtils.verifyAccessToken(token);
//         if (!decoded || decoded.role !== 'ADMIN') {
//             return res.status(403).json({ message: 'Forbidden' });
//         }
//         const { session_id } = req.params;
//         const { page, pageSize } = req.query;
        
//         if (!session_id) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'session_id là bắt buộc'
//             });
//         }
        
//         const courseSections = await chatRepo.getNonChatCourseSectionsBySession(session_id, page, pageSize);
//         res.status(200).json(courseSections);
//     } catch (error) {
//         console.error('Error in getNonChatCourseSectionsBySession controller:', error);
//         res.status(500).json({
//             success: false,
//             message: error.message || 'Lỗi server khi lấy danh sách course section chưa có nhóm chat theo học kỳ'
//         });
//     }
// };

// POST /api/chats/bulk-create-session/:session_id?namegroup=
// exports.createBulkGroupChatsForSession = async (req, res) => {
//     try {
//         const authHeader = req.headers['authorization'];
//         const token = authHeader && authHeader.split(' ')[1];
//         const decoded = jwtUtils.verifyAccessToken(token);
//         if (!decoded || decoded.role !== 'ADMIN') {
//             return res.status(403).json({ message: 'Forbidden' });
//         }
//         const { session_id } = req.params;
//         const { namegroup } = req.query; // Get namegroup from query params
        
//         if (!session_id) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'session_id là bắt buộc'
//             });
//         }

//         const result = await chatRepo.createBulkGroupChatsForSession(
//             decoded.user_id,
//             session_id,
//             namegroup
//         );
//         res.status(201).json(result);
//     } catch (error) {
//         console.error('Error in createBulkGroupChatsForSession controller:', error);
//         res.status(500).json({
//             success: false,
//             message: error.message || 'Lỗi server khi tạo hàng loạt nhóm chat cho học kỳ'
//         });
//     }
// };

// DELETE /api/chats/cleanup-gr-completed/:session_id
exports.cleanupCompletedCourseSectionChats = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const { session_id } = req.params;
        if (!session_id) {
            return res.status(400).json({
                success: false,
                message: 'session_id là bắt buộc'
            });
        }

        const result = await chatRepo.cleanupCompletedCourseSectionChats(session_id);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in cleanupCompletedCourseSectionChats controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi dọn dẹp nhóm chat của các course section đã hoàn thành'
        });
    }
};

// PUT /api/chats/mute/:chatID
exports.updateMuteStatus = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { chatID } = req.params;
        const result = await chatRepo.updateMuteStatus(decoded.user_id, chatID);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in updateMuteStatus controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật trạng thái tắt thông báo của cuộc trò chuyện'
        });
    }
};

// GET /api/chats/:chatID
exports.getChatInfoByID = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { chatID } = req.params;
        if (!chatID) {
            return res.status(400).json({
                success: false,
                message: 'chatID là bắt buộc'
            });
        }
        const chat = await chatRepo.getChatInfoById(decoded.user_id, chatID);
        res.status(200).json(chat);
    } catch (error) {
        console.error('Error in getChatInfoByID controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy thông tin cuộc trò chuyện'
        });
    }
};

// GET /api/chats/info/:chatID
exports.getChatInfoByID4Admin = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);  
        if (!decoded || decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { chatID } = req.params;
        if (!chatID) {
            return res.status(400).json({
                success: false,
                message: 'chatID là bắt buộc'
            });
        }
        const chat = await chatRepo.getChatInfoById4Admin(chatID);
        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy thông tin cuộc trò chuyện'
        });
    }
};

// GET /api/chats/user-search?keyword=
exports.searchUserByKeyword = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { keyword } = req.query;
        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: 'keyword là bắt buộc'
            });
        }
        let users;
        switch (decoded.role) {
            case 'ADMIN':
                users = await chatRepo.searchUserByKeyword(keyword);
                break;
            case 'LECTURER':
                users = await chatRepo.searchUserByKeyword4Lecturer(keyword);
                break;
            case 'PARENT':
                users = await chatRepo.searchUserByKeyword4Parent(keyword);
                break;
            case 'STUDENT':
                users = await chatRepo.searchUserByKeyword4Student(keyword);
                break;
            default:
                return res.status(403).json({ message: 'Forbidden' });
        }
        res.status(200).json(users);
    } catch (error) {
        console.error('Error in searchUserByKeyword controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tìm kiếm người dùng'
        });
    }
};