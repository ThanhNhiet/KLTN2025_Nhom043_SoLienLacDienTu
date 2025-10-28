const express = require('express');
const chatController = require('../controllers/chat.controller');
const router = express.Router();

// Tìm kiếm user theo keyword
// GET /api/chats/user-search?keyword=
router.get('/user-search', chatController.searchUserByKeyword);

// Tìm kiếm cuộc trò chuyện theo từ khóa dành cho người dùng
// GET /api/chats/search?keyword=
router.get('/search', chatController.searchChatsByKeyword);

// Tạo cuộc trò chuyện nhóm dành cho admin
// POST /api/chats/group?course_section_id=&nameGroup=
router.post('/group', chatController.createGroupChat);

// Tạo cuộc trò chuyện riêng tư giữa 2 người dùng
// POST /api/chats/private/:userID
router.post('/private/:userID', chatController.createPrivateChat);

// Lấy cuộc trò chuyện nhóm theo course_section_id
// GET /api/chats/group-info/:course_section_id
router.get('/group-info/:course_section_id', chatController.getGroupChatInfoByCourseSection);

// Cập nhật cuộc trò chuyện nhóm
// PUT /api/chats/group/:chatID
router.put('/group/:chatID', chatController.updateGroupChat);

// Dọn dẹp các cuộc trò chuyện riêng tư không hoạt động
// DELETE /api/chats/cleanup-inactive
router.delete('/cleanup-inactive', chatController.deleteInactivePrivateChats);

// Lấy thông tin cuộc trò chuyện theo chatID
// DELETE /api/chats/:chatID
router.delete('/:chatID', chatController.deleteChat);

// Lấy danh sách các cuộc trò chuyện của người dùng
// GET /api/chats?page=&pageSize=
router.get('/', chatController.getUserChats);

// Lấy tất cả cuộc trò chuyện (dành cho admin)
// GET /api/chats/all?page=1&pageSize=10
router.get('/all', chatController.getAllChats);

// Tìm kiếm tất cả cuộc trò chuyện theo từ khóa (dành cho admin)
// GET /api/chats/all/search?keyword=<keyword>&page=1&pageSize=10
router.get('/all/search', chatController.searchAllChats);

// Lấy các lớp học phần chưa có cuộc trò chuyện nhóm dành cho admin
// GET /api/chats/nonchat-course-sections?page=1&pageSize=10
router.get('/nonchat-course-sections', chatController.getNonChatCourseSections);

// Tìm kiếm các lớp học phần chưa có cuộc trò chuyện nhóm dành cho admin
// GET /api/Chats/nonchat-course-sections/search?keyword=<keyword>&page=1&pageSize=10
router.get('/nonchat-course-sections/search', chatController.searchNonChatCourseSections);

// Tạo cuộc trò chuyện nhóm với giảng viên chủ nhiệm dành cho admin
// POST /api/chats/homeroom/:lecturer_id
router.post('/homeroom/:lecturer_id', chatController.createGroupChatWithHomeroomLecturer);

// Tạo hàng loạt nhóm chat cho các lớp học phần chưa có chat theo học kỳ
// POST /api/chats/bulk-create-session/:session_id?namegroup=
// router.post('/bulk-create-session/:session_id', chatController.createBulkGroupChatsForSession);

// // Lấy danh sách các lớp học phần chưa có group chat theo học kỳ dành cho admin
// // GET /api/chats/nonchat-course-sections/session/:session_id?page=1&pageSize=10
// router.get('/nonchat-course-sections/session/:session_id', chatController.getNonChatCourseSectionsBySession);

// Dọn dẹp các nhóm chat của các course section đã hoàn thành
// DELETE /api/chats/cleanup-gr-completed/:session_id
router.delete('/cleanup-gr-completed/:session_id', chatController.cleanupCompletedCourseSectionChats);

// Cập nhật trạng thái tắt thông báo của cuộc trò chuyện
// PUT /api/chats/mute/:chatID
router.put('/mute/:chatID', chatController.updateMuteStatus);

// Lấy thông tin cuộc trò chuyện theo chatID dành cho admin
// GET /api/chats/info/:chatID
router.get('/info/:chatID', chatController.getChatInfoByID4Admin);

// Lấy thông tin cuộc trò chuyện theo chatID
// GET /api/chats/:chatID
router.get('/:chatID', chatController.getChatInfoByID);

module.exports = router;