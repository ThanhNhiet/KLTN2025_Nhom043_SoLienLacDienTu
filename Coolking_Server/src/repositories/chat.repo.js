const sequelize = require("../config/mariadb.conf");
const { Op, Sequelize } = require('sequelize');
const initModels = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);

const { v4: uuidv4 } = require('uuid');
const { Chat, ChatType, MemberRole } = require('../databases/mongodb/schemas/Chat');
const { Message, MessageType } = require('../databases/mongodb/schemas/Message');
const mongoose = require('mongoose');
const datetimeFormatter = require("../utils/format/datetime-formatter");
const { where } = require("../databases/mongodb/schemas/Alert");

/**
 * Format lastMessage content based on message type
 * @param {Object} message - Message object
 * @returns {string} - Formatted content
 */
const formatLastMessageContent = (message) => {
    if (!message) return '';
    if (message.isDeleted === true) {
        return '[Tin nhắn đã bị thu hồi]';
    }
    switch (message.type) {
        case MessageType.TEXT:
        case MessageType.LINK:
            return message.content || '';
        case MessageType.IMAGE:
            return 'Hình ảnh';
        case MessageType.FILE:
            return 'File';
        default:
            return message.content || '';
    }
};

/**
 * Get last message for a chat
 * @param {string} chatID - Chat ID
 * @returns {Promise<Object|null>} - Last message object or null
 */
const getLastMessage = async (chatID) => {
    try {
        const lastMessage = await Message.findOne({ chatID })
            .sort({ createdAt: -1 })
            .select('senderID type content filename createdAt isDeleted')
            .lean();

        if (!lastMessage) return null;
        return {
            senderID: lastMessage.senderID,
            type: lastMessage.type,
            content: formatLastMessageContent(lastMessage),
            createdAt: lastMessage.createdAt
        };
    } catch (error) {
        console.error('Error getting last message:', error);
        return null;
    }
};

/**
 * Tạo group chat cho admin (course section)
 * @param {string} admin_id - ID của admin
 * @param {string} nameGroup - Tên nhóm chat
 * @param {string} course_section_id - ID của course section
 * @returns {Promise<Object>} - Chat được tạo
 */
const createGroupChat4Admin = async (admin_id, nameGroup, course_section_id) => {
    try {
        // Lấy danh sách lecturers của course section
        const lecturerCourseSections = await models.LecturerCourseSection.findAll({
            where: { course_section_id },
            include: [{
                model: models.Lecturer,
                as: 'lecturer',
                attributes: ['lecturer_id', 'name', 'avatar']
            }]
        });

        // Lấy danh sách students của course section
        const studentCourseSections = await models.StudentCourseSection.findAll({
            where: { course_section_id },
            include: [{
                model: models.Student,
                as: 'student',
                attributes: ['student_id', 'name', 'avatar']
            }]
        });

        // Tạo members array
        const members = [];
        const now = new Date();

        // Thêm lecturers với role admin
        lecturerCourseSections.forEach(lcs => {
            if (lcs.lecturer) {
                members.push({
                    userID: lcs.lecturer.lecturer_id,
                    userName: lcs.lecturer.name,
                    avatar: lcs.lecturer?.avatar || 'https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809711/privateavatar_hagxki.png',
                    role: MemberRole.LECTURER,
                    joinedAt: now,
                    muted: false
                });
            }
        });

        // Thêm students với role member
        studentCourseSections.forEach(scs => {
            if (scs.student) {
                members.push({
                    userID: scs.student.student_id,
                    userName: scs.student.name,
                    avatar: scs.student?.avatar || 'https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809711/privateavatar_hagxki.png',
                    role: MemberRole.MEMBER,
                    joinedAt: now,
                    muted: false
                });
            }
        });

        // Tạo chat object
        const chatData = {
            _id: uuidv4(),
            course_section_id,
            type: ChatType.GROUP,
            name: nameGroup,
            avatar: "https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809477/groupavatar_driiwd.png",
            createdBy: admin_id,
            updatedBy: admin_id,
            members
        };

        // Lưu vào MongoDB
        const newChat = new Chat(chatData);
        await newChat.save();

        return {
            success: true,
            message: 'Nhóm chat được tạo thành công'
        };

    } catch (error) {
        console.error('Error creating group chat:', error);
        throw new Error(`Failed to create group chat: ${error.message}`);
    }
};

/**
 * Tạo nhóm chat cho lớp có giảng viên chủ nhiệm (dành cho admin)
 * @param {string} admin_id - ID của admin
 * @param {string} lecturer_id - ID của giảng viên chủ nhiệm
 */
const createGroupChatWithHomeroomLecturer = async (admin_id, lecturer_id) => {
    try {
        // Lấy thông tin giảng viên chủ nhiệm
        const lecturer = await models.Lecturer.findOne({
            where: { lecturer_id },
            attributes: ['lecturer_id', 'name', 'avatar', 'homeroom_class_id']
        });

        if (!lecturer) {
            return {
                success: false,
                message: 'Không tìm thấy giảng viên'
            };
        }

        if (!lecturer.homeroom_class_id) {
            return {
                success: false,
                message: 'Giảng viên không có lớp chủ nhiệm'
            };
        }

        // Lấy danh sách students trong lớp chủ nhiệm
        const students = await models.Student.findAll({
            where: { clazz_id: lecturer.homeroom_class_id },
            attributes: ['student_id', 'name', 'avatar']
        });

        // Lấy tên lớp từ lecturer.homeroom_class_id
        const clazz = await models.Clazz.findOne({
            where: { id: lecturer.homeroom_class_id },
            attributes: ['name']
        });

        // Tạo nhóm chat với giảng viên chủ nhiệm
        const members = [];
        const now = new Date();
        // Thêm giảng viên chủ nhiệm với role lecturer
        members.push({
            userID: lecturer.lecturer_id,
            userName: lecturer.name,
            avatar: lecturer?.avatar || 'https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809711/privateavatar_hagxki.png',
            role: MemberRole.LECTURER,
            joinedAt: now,
            muted: false
        });

        // Thêm sinh viên vào nhóm chat
        students.forEach(student => {
            members.push({
                userID: student.student_id,
                userName: student.name,
                avatar: student?.avatar || 'https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809711/privateavatar_hagxki.png',
                role: MemberRole.MEMBER,
                joinedAt: now,
                muted: false
            });
        });

        // Tạo chat object
        const chatData = {
            _id: uuidv4(),
            type: ChatType.GROUP,
            name: "Chủ nhiệm " + clazz.name,
            avatar: "https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809477/groupavatar_driiwd.png",
            createdBy: admin_id,
            updatedBy: admin_id,
            members
        };

        // Lưu vào MongoDB
        const newChat = new Chat(chatData);
        await newChat.save();

        return {
            success: true,
            message: 'Nhóm chat được tạo thành công'
        };

    } catch (error) {
        console.error('Error creating group chat with homeroom lecturer:', error);
        throw new Error(`Failed to create group chat with homeroom lecturer: ${error.message}`);
    }
};

/**
 * Tạo private chat giữa user và system
 * @param {string} UserID - ID của user tạo chat
 * @returns {Promise<Object>} - Chat được tạo
 */

const createPrivateChatWithSystem = async (UserID) => {
    try {
        // Kiểm tra xem private chat đã tồn tại chưa
        const existingChat = await Chat.findOne({
            type: ChatType.PRIVATE,
            $and: [
                { "members.userID": UserID },
                { "members.userID": "SYSTEM" }
            ]
        });
        if (existingChat) {
            return {
                success: true,
                chat: existingChat,
                message: 'Cuộc trò chuyện đã tồn tại'
            };
        }
        // Lấy thông tin của request user
        let requestUser = null;
        if (UserID.startsWith('SV')) {
            requestUser = await models.Student.findOne({
                where: { student_id: UserID },
                attributes: ['student_id', 'name', 'avatar']
            });
        } else if (UserID.startsWith('PA')) {
            requestUser = await models.Parent.findOne({
                where: { parent_id: UserID },
                attributes: ['parent_id', 'name', 'avatar']
            });
        }

        if (!requestUser) {
            return {
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            };
        }

        // Tạo members array
        const now = new Date();
        const members = [
            {
                userID: UserID,
                userName: requestUser.name,
                avatar: requestUser?.avatar || 'https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809711/privateavatar_hagxki.png',
                role: MemberRole.MEMBER,
                joinedAt: now,
                muted: false
            },
            {
                userID: "SYSTEM",
                userName: "Trợ lý ảo",
                role: MemberRole.SYSTEM,
                avatar: 'https://res.cloudinary.com/echoappchat/image/upload/v1763027571/logo_agxf1c.jpg',
                joinedAt: now,
                muted: false
            }
        ];
        // Tạo chat object
        const chatData = {
            _id: uuidv4(),
            type: ChatType.PRIVATE,
            avatar: "https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809711/privateavatar_hagxki.png",
            createdBy: UserID,
            updatedBy: UserID,
            members
        };
        // Lưu vào MongoDB
        const newChat = new Chat(chatData);
        await newChat.save();

        return {
            success: true,
            chat: newChat,
            message: 'Cuộc trò chuyện được tạo thành công'
        };

    } catch (error) {
        console.error('Error creating private chat with system:', error);
        throw new Error(`Failed to create private chat with system: ${error.message}`);
    }
}




/**
 * Tạo private chat giữa 2 users
 * @param {string} requestUserID - ID của user tạo chat
 * @param {string} targetUserID - ID của user được chat
 * @returns {Promise<Object>} - Chat được tạo
 */
const createPrivateChat4Users = async (requestUserID, targetUserID) => {
    try {
        // Kiểm tra xem private chat đã tồn tại chưa
        const existingChat = await Chat.findOne({
            type: ChatType.PRIVATE,
            $and: [
                { "members.userID": requestUserID },
                { "members.userID": targetUserID }
            ]
        });

        if (existingChat) {
            return {
                success: true,
                data: existingChat,
                message: 'Cuộc trò chuyện đã tồn tại'
            };
        }

        // Lấy thông tin của request user
        let requestUser = null;
        if (requestUserID.startsWith('LE')) {
            requestUser = await models.Lecturer.findOne({
                where: { lecturer_id: requestUserID },
                attributes: ['lecturer_id', 'name', 'avatar']
            });
        }

        if (requestUserID.startsWith('SV')) {
            requestUser = await models.Student.findOne({
                where: { student_id: requestUserID },
                attributes: ['student_id', 'name', 'avatar']
            });
        }

        if (requestUserID.startsWith('PA')) {
            requestUser = await models.Parent.findOne({
                where: { parent_id: requestUserID },
                attributes: ['parent_id', 'name', 'avatar']
            });
        }

        if (requestUserID.startsWith('AD')) {
            requestUser = await models.Staff.findOne({
                where: { admin_id: requestUserID },
                attributes: ['admin_id', 'name', 'avatar']
            });
            requestUser.name = "Quản trị viên - " + requestUser.name;
        }

        // Lấy thông tin của target user
        let targetUser = null;
        if (targetUserID.startsWith('LE')) {
            targetUser = await models.Lecturer.findOne({
                where: { lecturer_id: targetUserID },
                attributes: ['lecturer_id', 'name', 'avatar']
            });
        }

        if (targetUserID.startsWith('SV')) {
            targetUser = await models.Student.findOne({
                where: { student_id: targetUserID },
                attributes: ['student_id', 'name', 'avatar']
            });
        }

        if (targetUserID.startsWith('PA')) {
            targetUser = await models.Parent.findOne({
                where: { parent_id: targetUserID },
                attributes: ['parent_id', 'name', 'avatar']
            });
        }

        if (targetUserID.startsWith('AD')) {
            targetUser = await models.Staff.findOne({
                where: { admin_id: targetUserID },
                attributes: ['admin_id', 'name', 'avatar']
            });
            targetUser.name = "Quản trị viên - " + targetUser.name;
        }

        if (!requestUser || !targetUser) {
            throw new Error('One or both users not found');
        }

        // Tạo members array
        const now = new Date();
        const members = [
            {
                userID: requestUserID,
                userName: requestUser.name,
                avatar: requestUser?.avatar || 'https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809711/privateavatar_hagxki.png',
                joinedAt: now,
                muted: false
            },
            {
                userID: targetUserID,
                userName: targetUser.name,
                avatar: targetUser?.avatar || 'https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809711/privateavatar_hagxki.png',
                joinedAt: now,
                muted: false
            }
        ];

        // Tạo chat object
        const chatData = {
            _id: uuidv4(),
            type: ChatType.PRIVATE,
            avatar: "https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809711/privateavatar_hagxki.png",
            createdBy: requestUserID,
            updatedBy: requestUserID,
            members
        };

        // Lưu vào MongoDB
        const newChat = new Chat(chatData);
        await newChat.save();

        return {
            success: true,
            message: 'Cuộc trò chuyện được tạo thành công'
        };

    } catch (error) {
        console.error('Error creating private chat:', error);
        throw new Error(`Failed to create private chat: ${error.message}`);
    }
};

/**
 * Lấy thông tin group chat theo course section
 * @param {string} course_section_id - ID của course section
 * @returns {Promise<Object>} - Thông tin group chat
 */
const getGroupChatInfoByCourseSection4Admin = async (course_section_id) => {
    try {
        const groupChatDoc = await Chat.findOne({
            course_section_id,
            type: ChatType.GROUP
        });

        if (!groupChatDoc) {
            return {
                success: false,
                message: 'Nhóm chat không tồn tại cho course section này'
            };
        }

        // Chuyển thành plain object và format ngày giờ
        const groupChat = groupChatDoc.toObject();

        // Format createdAt, updatedAt, members[{..., joinedAt: ...}]
        groupChat.createdAt = datetimeFormatter.formatDateTimeVN(groupChat.createdAt);
        groupChat.updatedAt = datetimeFormatter.formatDateTimeVN(groupChat.updatedAt);
        groupChat.members = groupChat.members.map(member => ({
            ...member._doc || member, // Handle nested document
            joinedAt: datetimeFormatter.formatDateTimeVN(member.joinedAt)
        }));

        return {
            success: true,
            message: 'Tìm thấy nhóm chat',
            data: groupChat
        };

    } catch (error) {
        console.error('Error getting group chat info:', error);
        throw new Error(`Failed to get group chat info: ${error.message}`);
    }
};

/**
 * Lấy danh sách các đoạn chat của một user với phân trang
 * @param {string} userID - ID của user
 * @param {string} roleAccount - Role của account ('STUDENT', 'PARENT', 'LECTURER', 'ADMIN')
 * @param {number} page - Trang hiện tại (mặc định 1)
 * @param {number} pageSize - Kích thước trang (mặc định 10)
 * @returns {Promise<Object>} - Danh sách các đoạn chat với phân trang
 */
const getUserChats = async (userID, roleAccount, page = 1, pageSize = 10) => {
    try {
        const page_num = Math.max(1, parseInt(page) || 1);
        const pageSize_num = Math.max(1, parseInt(pageSize) || 10);

        let chatFilter = {
            "members.userID": userID
        };

        // Phân loại chat theo role để tối ưu hóa truy vấn
        if (roleAccount === 'STUDENT') {
            // Student chỉ có group chat và private chat với lecturer
            chatFilter = {
                "members.userID": userID,
                $or: [
                    { type: ChatType.GROUP },
                    { type: ChatType.PRIVATE }
                ]
            };
        } else if (roleAccount === 'PARENT') {
            // Parent chỉ có private chat
            chatFilter = {
                "members.userID": userID,
                type: ChatType.PRIVATE
            };
        } else if (roleAccount === 'LECTURER') {
            chatFilter = {
                "members.userID": userID,
                $or: [
                    { type: ChatType.GROUP },
                    { type: ChatType.PRIVATE }
                ]
            };
        } else if (roleAccount === 'ADMIN') {
            // Admin chat với phụ huynh
            chatFilter = {
                "members.userID": userID,
                type: ChatType.PRIVATE
            };
        }

        // Lấy tất cả chats trước (không phân trang)
        let allChats = await Chat.find(chatFilter)
            .lean(); // Sử dụng lean() để tăng performance

        // Loại bỏ chats có chứa member với userID === "SYSTEM"
        allChats = allChats.filter(chat => !chat.members.some(member => member.userID === "SYSTEM"));

        // Xử lý dữ liệu và lấy tin nhắn cuối cùng cho tất cả chats
        const processedChats = await Promise.all(allChats.map(async (chat) => {
            const result = {
                _id: chat._id,
                type: chat.type,
                name: chat.name,
                avatar: chat.avatar,
            };

            // Nếu là private chat, tạo tên chat từ tên của người kia
            if (chat.type === ChatType.PRIVATE) {
                const otherMember = chat.members.find(member => member.userID !== userID);
                result.name = otherMember ? otherMember.userName : 'Unknown User';
                result.avatar = otherMember?.avatar || result.avatar;
            }

            // Thêm thông tin về member hiện tại
            const currentMember = chat.members.find(member => member.userID === userID);

            // Lấy tin nhắn cuối cùng (nếu có)
            result.lastMessage = await getLastMessage(chat._id);

            // so sánh lastMessage.createdAt với currentMember.lastReadAt để đánh dấu tin nhắn đã đọc
            result.unread = false;
            if (result.lastMessage && currentMember && currentMember.lastReadAt) {
                const lastMessageTime = new Date(result.lastMessage.createdAt);
                const lastReadTime = new Date(currentMember.lastReadAt);
                if (lastMessageTime >= lastReadTime) {
                    result.unread = true;
                }
            }

            // Lưu thời gian tin nhắn cuối cùng để sort (trước khi format)
            result.lastMessageTime = result.lastMessage ? new Date(result.lastMessage.createdAt) : new Date(0);

            if (result.lastMessage) {
                result.lastMessage.createdAt = result.lastMessage.createdAt
                    ? datetimeFormatter.formatDateTimeVN(result.lastMessage.createdAt)
                    : null;
            }

            return result;
        }));

        // Sort theo thời gian tin nhắn cuối cùng (mới nhất trước)
        processedChats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

        // Xóa field lastMessageTime khỏi response (không cần thiết cho client)
        processedChats.forEach(chat => delete chat.lastMessageTime);

        // Tính toán phân trang sau khi sort
        const total = processedChats.length;
        const totalPages = Math.ceil(total / pageSize_num);
        const skip = (page_num - 1) * pageSize_num;
        const paginatedChats = processedChats.slice(skip, skip + pageSize_num);

        return {
            total: total,
            page: page_num,
            pageSize: pageSize_num,
            totalPages,
            chats: paginatedChats,
            linkPrev: page_num > 1 ? `/chats?page=${page_num - 1}&pageSize=${pageSize_num}` : null,
            linkNext: page_num < totalPages ? `/chats?page=${page_num + 1}&pageSize=${pageSize_num}` : null,
            pages: Array.from({ length: Math.min(3, totalPages - page_num + 1) }, (_, i) => page_num + i)
        };

    } catch (error) {
        console.error('Error getting user chats:', error);
        throw new Error(`Failed to get user chats: ${error.message}`);
    }
};

/**
 * Lấy tất cả chatID của user, dùng để join socket rooms khi đăng nhập
 * @param {string} userID - ID của user
 * @returns {Promise<Array>} - Mảng chatID
 */
const getAllChatIdsForUser = async (userID) => {
    try {
        // Sử dụng projection members.$ để chỉ lấy subdocument của user đó
        const chats = await Chat.find(
            { 'members.userID': userID },
            { _id: 1, 'members.$': 1 }
        ).lean();

        return chats.map(chat => ({
            _id: chat._id.toString(),
            // Lấy trạng thái muted từ phần tử member đầu tiên (và duy nhất do query)
            muted: chat.members[0]?.muted || false
        }));
    } catch (error) {
        console.error('Error getting chat IDs for user:', error);
        throw new Error(`Failed to get chat IDs for user: ${error.message}`);
    }
};
/**
 * Lấy tất cả chatID của user, dùng để join socket rooms khi đăng nhập
 * @param {string} chatId - ID của chat
 * @returns {Promise<Array>} - Mảng chatID
 */

const getMemberUserIdsByChat = async (chatId) => {
    try {
        const doc = await Chat.findById(chatId, { name: 1, type: 1, members: 1 }).lean();
        if (!doc) {
            throw new Error('Chat not found');
        }
        const userIds = doc.members.map(member => member.userID);
        const chatName = doc.name;
        return {
            userIds,
            chatName
        };
    } catch (error) {
        console.error('Error getting member user IDs by chat:', error);
        throw new Error(`Failed to get member user IDs by chat: ${error.message}`);
    }
}
const getChatMembersWithMutedStatus = async (chatId) => {
    try {
        const chat = await Chat.findById(chatId).select('members type name').lean();
        if (!chat) return null;

        // Trả về danh sách user ID và trạng thái muted tương ứng
        // Map: userID -> muted (boolean)
        const memberMutedMap = new Map();
        chat.members.forEach(m => {
            memberMutedMap.set(m.userID, m.muted);
        });

        return {
            chatName: chat.name,
            memberMutedMap // Map<String, Boolean>
        };
    } catch (error) {
        console.error('Error getting chat members:', error);
        return null;
    }
};

/**
 * Tìm kiếm chats theo từ khóa
 * @param {string} userID - ID của user hiện tại 
 * @param {string} keyword - Từ khóa tìm kiếm (name chat đối với group; phone, email đối với private)
 * @param {string} roleAccount - Role của user hiện tại để phân quyền tìm kiếm
 * @returns {Promise<Object>} - Danh sách chats với currentMember (không phân trang)
 */
const searchChatsByKeyword = async (userID, keyword, roleAccount) => {
    try {
        if (!keyword || keyword.trim() === '') {
            return {
                success: false,
                message: 'Từ khóa tìm kiếm không được để trống'
            };
        }

        const searchKeyword = keyword.trim();
        let chatFilter = { 'members.userID': userID };

        // Phân quyền tìm kiếm theo role
        let groupChatFilter = {};
        let privateChatFilter = {};

        if (roleAccount === 'STUDENT') {
            // Student có thể tìm group + private chats
            groupChatFilter = {
                'members.userID': userID,
                type: ChatType.GROUP,
                name: { $regex: searchKeyword, $options: 'i' }
            };
            privateChatFilter = {
                'members.userID': userID,
                type: ChatType.PRIVATE
            };
        } else if (roleAccount === 'PARENT') {
            // Parent chỉ có thể tìm private chats
            privateChatFilter = {
                'members.userID': userID,
                type: ChatType.PRIVATE
            };
        } else if (roleAccount === 'LECTURER' || roleAccount === 'ADMIN') {
            // Lecturer có thể tìm tất cả chats
            groupChatFilter = {
                'members.userID': userID,
                type: ChatType.GROUP,
                name: { $regex: searchKeyword, $options: 'i' }
            };
            privateChatFilter = {
                'members.userID': userID,
                type: ChatType.PRIVATE
            };
        }

        // Query group chats và private chats riêng biệt
        const [groupChats, allPrivateChats] = await Promise.all([
            Object.keys(groupChatFilter).length > 0 ?
                Chat.find(groupChatFilter)
                    .populate('course_section_id', 'name code')
                    .sort({ lastMessageAt: -1 })
                    .limit(10)
                    .lean() : [],
            Object.keys(privateChatFilter).length > 0 ?
                Chat.find(privateChatFilter)
                    .sort({ lastMessageAt: -1 })
                    .lean() : []
        ]);

        // Filter private chats theo phone/email/name từ MariaDB
        const filteredPrivateChats = [];

        const searchCondition = {
            [Op.and]: [
                {
                    [Op.or]: [
                        { email: { [Op.like]: `%${searchKeyword}%` } },
                        { phone: { [Op.like]: `%${searchKeyword}%` } },
                        { name: { [Op.like]: `%${searchKeyword}%` } }
                    ]
                },
                { isDeleted: false }
            ]
        };

        for (const chat of allPrivateChats) {
            const otherMember = chat.members.find(member => member.userID !== userID);

            if (otherMember) {
                let userFound = false;

                // Tìm trong Student
                const student = await models.Student.findOne({
                    where: {
                        ...searchCondition,
                        student_id: otherMember.userID
                    }
                });

                if (student) userFound = true;

                // Tìm trong Lecturer nếu chưa tìm thấy
                if (!userFound) {
                    const lecturer = await models.Lecturer.findOne({
                        where: {
                            ...searchCondition,
                            lecturer_id: otherMember.userID
                        }
                    });
                    if (lecturer) userFound = true;
                }

                // Tìm trong Parent nếu chưa tìm thấy
                if (!userFound) {
                    const parent = await models.Parent.findOne({
                        where: {
                            ...searchCondition,
                            parent_id: otherMember.userID
                        }
                    });
                    if (parent) userFound = true;
                }

                // Chỉ thêm vào results nếu tìm thấy user matching
                if (userFound) {
                    filteredPrivateChats.push(chat);
                }
            }
        }

        // Kết hợp results và limit tổng cộng 20
        const allChats = [...groupChats, ...filteredPrivateChats]
            .sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt))
            .slice(0, 20);

        // Format response giống getUserChats
        const results = await Promise.all(allChats.map(async (chat) => {
            const currentMember = chat.members.find(member => member.userID === userID);

            let chatInfo = {
                _id: chat._id,
                type: chat.type,
                name: chat.name,
                avatar: chat.avatar,
            };

            // Nếu là private chat, tên chat chính là tên của đối phương (đã có sẵn trong members.userName)
            if (chat.type === ChatType.PRIVATE) {
                const otherMember = chat.members.find(member => member.userID !== userID);
                if (otherMember) {
                    chatInfo.name = otherMember.userName;
                    chatInfo.avatar = otherMember.avatar || chatInfo.avatar;
                }
            }

            // Lấy tin nhắn cuối cùng (nếu có)
            chatInfo.lastMessage = await getLastMessage(chat._id);

            // so sánh lastMessage.createdAt với currentMember.lastReadAt để đánh dấu tin nhắn đã đọc
            chatInfo.unread = false;
            if (chatInfo.lastMessage && currentMember && currentMember.lastReadAt) {
                const lastMessageTime = new Date(chatInfo.lastMessage.createdAt);
                const lastReadTime = new Date(currentMember.lastReadAt);
                if (lastMessageTime >= lastReadTime) {
                    chatInfo.unread = true;
                }
            }

            if (chatInfo.lastMessage) {
                chatInfo.lastMessage.createdAt = chatInfo.lastMessage.createdAt
                    ? datetimeFormatter.formatDateTimeVN(chatInfo.lastMessage.createdAt)
                    : null;
            }

            return chatInfo;
        }));

        return {
            success: true,
            chats: results
        };

    } catch (error) {
        console.error('Error searching users for chat:', error);
        throw new Error(`Failed to search users: ${error.message}`);
    }
};


/**
 * Cập nhật group chat cho admin
 * @param {string} admin_id - ID của admin
 * @param {string} chatID - ID của chat
 * @param {Object} data - Dữ liệu cập nhật {students: [], lecturers: []}
 * @returns {Promise<Object>} - Chat đã được cập nhật
 */
const updateGroupChat4Admin = async (admin_id, chatID, data) => {
    try {
        const { name = '', students = [], lecturers = [] } = data;

        // Kiểm tra chat có tồn tại và user có quyền admin không
        const chat = await Chat.findOne({
            _id: chatID,
            type: ChatType.GROUP
        });

        if (!chat) {
            throw new Error('Chat not found');
        }

        // Lấy thông tin lecturers và kiểm tra tồn tại
        const lectureDetails = [];
        if (lecturers.length > 0) {
            const lecturerRecords = await models.Lecturer.findAll({
                where: { lecturer_id: lecturers },
                attributes: ['lecturer_id', 'name', 'avatar']
            });

            // Kiểm tra lecturers không tồn tại trong database
            const foundLecturerIds = lecturerRecords.map(l => l.lecturer_id);
            const notFoundLecturers = lecturers.filter(id => !foundLecturerIds.includes(id));
            if (notFoundLecturers.length > 0) {
                return {
                    success: false,
                    message: `Không tìm thấy giảng viên với ID: ${notFoundLecturers.join(', ')}`
                };
            }

            lectureDetails.push(...lecturerRecords);
        }

        // Lấy thông tin students và kiểm tra tồn tại
        const studentDetails = [];
        if (students.length > 0) {
            const studentRecords = await models.Student.findAll({
                where: { student_id: students },
                attributes: ['student_id', 'name', 'avatar']
            });

            // Kiểm tra students không tồn tại trong database
            const foundStudentIds = studentRecords.map(s => s.student_id);
            const notFoundStudents = students.filter(id => !foundStudentIds.includes(id));
            if (notFoundStudents.length > 0) {
                return {
                    success: false,
                    message: `Không tìm thấy sinh viên với ID: ${notFoundStudents.join(', ')}`
                };
            }

            studentDetails.push(...studentRecords);
        }

        // Lấy danh sách members hiện tại
        const currentMembers = chat.members || [];
        const existingUserIDs = currentMembers.map(member => member.userID);

        // Tạo members mới để thêm vào
        const now = new Date();
        const membersToAdd = [];

        // Thêm lecturers với role lecturer (chỉ thêm nếu chưa có)
        lectureDetails.forEach(lecturer => {
            if (!existingUserIDs.includes(lecturer.lecturer_id)) {
                membersToAdd.push({
                    userID: lecturer.lecturer_id,
                    userName: lecturer.name,
                    avatar: lecturer.avatar,
                    role: MemberRole.LECTURER,
                    joinedAt: now,
                    muted: false
                });
            }
        });

        // Thêm students với role member (chỉ thêm nếu chưa có)
        studentDetails.forEach(student => {
            if (!existingUserIDs.includes(student.student_id)) {
                membersToAdd.push({
                    userID: student.student_id,
                    userName: student.name,
                    avatar: student.avatar,
                    role: MemberRole.MEMBER,
                    joinedAt: now,
                    muted: false
                });
            }
        });

        // Kết hợp members cũ + members mới
        const allMembers = [...currentMembers, ...membersToAdd];

        // Cập nhật chat
        let updatedChat;
        if (name && name.trim() !== '') {
            updatedChat = await Chat.findByIdAndUpdate(
                chatID,
                {
                    name: name.trim(),
                    members: allMembers,
                    updatedBy: admin_id
                },
                { new: true }
            );
        } else {
            updatedChat = await Chat.findByIdAndUpdate(
                chatID,
                {
                    members: allMembers,
                    updatedBy: admin_id
                },
                { new: true }
            );
        }

        // Tạo message chi tiết về kết quả
        let message = '';
        if (membersToAdd.length === 0) {
            message = 'Tất cả thành viên đã có trong nhóm chat';
        } else {
            const addedLecturers = membersToAdd.filter(m => m.role === MemberRole.LECTURER).length;
            const addedStudents = membersToAdd.filter(m => m.role === MemberRole.MEMBER).length;
            message = `Đã thêm ${membersToAdd.length} thành viên mới vào nhóm chat`;
            if (addedLecturers > 0 && addedStudents > 0) {
                message += ` (${addedLecturers} giảng viên, ${addedStudents} sinh viên)`;
            } else if (addedLecturers > 0) {
                message += ` (${addedLecturers} giảng viên)`;
            } else if (addedStudents > 0) {
                message += ` (${addedStudents} sinh viên)`;
            }
        }

        return {
            success: true,
            message: message
        };

    } catch (error) {
        console.error('Error updating group chat:', error);
        throw new Error(`Failed to update group chat: ${error.message}`);
    }
};

/**
 * Xóa group chat cho admin
 * @param {string} chatID - ID của chat
 * @returns {Promise<Object>} - Kết quả xóa
 */
const deleteGroupChat4Admin = async (chatID) => {
    try {
        const deletedChat = await Chat.findByIdAndDelete(chatID);

        if (!deletedChat) {
            throw new Error('Chat not found');
        }

        return {
            success: true,
            message: 'Xóa nhóm chat thành công'
        };

    } catch (error) {
        console.error('Error deleting group chat:', error);
        throw new Error(`Failed to delete group chat: ${error.message}`);
    }
};

/**
 * Xoá private chat của các accounts có status INACTIVE
 * @returns {Promise<Object>} - Kết quả xóa
 */
const deleteInactivePrivateChats = async () => {
    try {
        // Lấy danh sách user_id của các account có status INACTIVE
        const inactiveAccounts = await models.Account.findAll({
            where: { status: 'INACTIVE' },
            attributes: ['user_id']
        });

        if (inactiveAccounts.length === 0) {
            return {
                success: true,
                message: 'Không có tài khoản INACTIVE nào để xóa chat'
            };
        }

        const inactiveUserIds = inactiveAccounts.map(account => account.user_id);

        // Xóa các private chat có chứa user INACTIVE (MongoDB operation)
        const deleteResult = await Chat.deleteMany({
            type: ChatType.PRIVATE,
            "members.userID": { $in: inactiveUserIds }
        });

        return {
            success: true,
            deletedCount: deleteResult.deletedCount,
            message: `Đã xóa ${deleteResult.deletedCount} private chat của các tài khoản không hoạt động`
        };

    } catch (error) {
        console.error('Error deleting inactive private chats:', error);
        throw new Error(`Failed to delete inactive private chats: ${error.message}`);
    }
};

/**
 * Lấy tất cả chats, phân trang, dành cho admin
 * @param {number} page - Trang hiện tại (mặc định 1)
 * @param {number} pageSize - Kích thước trang (mặc định 10)
 */
const getAllChats = async (page = 1, pageSize = 10) => {
    try {
        const page_num = Math.max(1, parseInt(page) || 1);
        const pageSize_num = Math.max(1, parseInt(pageSize) || 10);
        const skip = (page_num - 1) * pageSize_num;
        const total = await Chat.countDocuments({});
        const totalPages = Math.ceil(total / pageSize_num);
        const chats = await Chat.find({})
            .sort({ updatedAt: -1 }) // Sắp xếp theo thời gian cập nhật gần nhất
            .skip(skip)
            .limit(pageSize_num)
            .lean(); // Sử dụng lean() để tăng performance
        const processedChats = chats.map(chat => ({
            _id: chat._id,
            type: chat.type,
            name: chat.name,
            avatar: chat.avatar,
            course_section_id: chat.course_section_id,
            createdAt: chat?.createdAt ? datetimeFormatter.formatDateTimeVN(chat.createdAt) : null,
            updatedAt: chat?.updatedAt ? datetimeFormatter.formatDateTimeVN(chat.updatedAt) : null,
            memberCount: chat.members.length
        }));

        return {
            total,
            page: page_num,
            pageSize: pageSize_num,
            totalPages,
            chats: processedChats,
            linkPrev: page_num > 1 ? `/chats?page=${page_num - 1}&pageSize=${pageSize_num}` : null,
            linkNext: page_num < totalPages ? `/chats?page=${page_num + 1}&pageSize=${pageSize_num}` : null,
            pages: Array.from({ length: Math.min(3, totalPages - page_num + 1) }, (_, i) => page_num + i)
        };

    } catch (error) {
        console.error('Error getting all chats:', error);
        throw new Error(`Failed to get all chats: ${error.message}`);
    }
};

/** Tìm kiếm chats theo từ khóa, dành cho admin
 * @param {string} keyword - Từ khóa tìm kiếm (name chat đối với group; phone, email đối với private; course_section_id)
 * @param {number} page - Trang hiện tại (mặc định 1)
 * @param {number} pageSize - Kích thước trang (mặc định 10)
 * @returns {Promise<Object>} - Danh sách chats có phân trang
 */
const searchChatsByKeyword4Admin = async (keyword, page = 1, pageSize = 10) => {
    try {
        if (!keyword || keyword.trim() === '') {
            return await getAllChats(page, pageSize);
        }

        const searchKeyword = keyword.trim();
        const page_num = Math.max(1, parseInt(page) || 1);
        const pageSize_num = Math.max(1, parseInt(pageSize) || 10);
        const skip = (page_num - 1) * pageSize_num;

        // Kiểm tra xem keyword có phải là UUID (course_section_id) không
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(searchKeyword);

        let groupChats = [];

        if (isUUID) {
            // Nếu là UUID, tái sử dụng getGroupChatInfoByCourseSection4Admin
            try {
                const groupChatResult = await getGroupChatInfoByCourseSection4Admin(searchKeyword);
                if (groupChatResult.success && groupChatResult.data) {
                    groupChats = [groupChatResult.data];
                }
            } catch (error) {
                console.log('No group chat found for course_section_id:', searchKeyword);
            }
        } else {
            // Tìm group chats theo tên
            const groupChatFilter = {
                type: ChatType.GROUP,
                name: { $regex: searchKeyword, $options: 'i' }
            };
            groupChats = await Chat.find(groupChatFilter).sort({ updatedAt: -1 }).lean();
        }

        // Tìm private chats
        const privateChatFilter = {
            type: ChatType.PRIVATE
        };

        const allPrivateChats = await Chat.find(privateChatFilter).sort({ updatedAt: -1 }).lean();

        // Filter private chats theo phone/email/name từ MariaDB
        // Chỉ tìm private chat khi keyword KHÔNG phải là UUID (course_section_id)
        let filteredPrivateChats = [];

        if (!isUUID) {
            const searchCondition = {
                [Op.or]: [
                    { email: { [Op.like]: `%${searchKeyword}%` } },
                    { phone: { [Op.like]: `%${searchKeyword}%` } },
                    { name: { [Op.like]: `%${searchKeyword}%` } }
                ]
            };

            for (const chat of allPrivateChats) {
                let userFound = false;
                const allUserIDs = chat.members.map(member => member.userID);

                // Tìm trong Student
                const students = await models.Student.findAll({
                    where: {
                        ...searchCondition,
                        student_id: { [Op.in]: allUserIDs }
                    }
                });
                if (students.length > 0) userFound = true;

                // Tìm trong Lecturer nếu chưa tìm thấy
                if (!userFound) {
                    const lecturers = await models.Lecturer.findAll({
                        where: {
                            ...searchCondition,
                            lecturer_id: { [Op.in]: allUserIDs }
                        }
                    });
                    if (lecturers.length > 0) userFound = true;
                }

                // Tìm trong Parent nếu chưa tìm thấy
                if (!userFound) {
                    const parents = await models.Parent.findAll({
                        where: {
                            ...searchCondition,
                            parent_id: { [Op.in]: allUserIDs }
                        }
                    });
                    if (parents.length > 0) userFound = true;
                }

                if (userFound) {
                    filteredPrivateChats.push(chat);
                }
            }
        }

        // Kết hợp results và phân trang
        const allChats = [...groupChats, ...filteredPrivateChats]
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        const total = allChats.length;
        const totalPages = Math.ceil(total / pageSize_num);
        const paginatedChats = allChats.slice(skip, skip + pageSize_num);

        const processedChats = paginatedChats.map(chat => ({
            _id: chat._id,
            type: chat.type,
            name: chat.name,
            avatar: chat.avatar,
            course_section_id: chat.course_section_id,
            createdAt: chat?.createdAt ? datetimeFormatter.formatDateTimeVN(chat.createdAt) : null,
            updatedAt: chat?.updatedAt ? datetimeFormatter.formatDateTimeVN(chat.updatedAt) : null,
            memberCount: chat.members.length
        }));

        return {
            total,
            page: page_num,
            pageSize: pageSize_num,
            totalPages,
            chats: processedChats,
            linkPrev: page_num > 1 ? `/chats/search?keyword=${encodeURIComponent(keyword)}&page=${page_num - 1}&pageSize=${pageSize_num}` : null,
            linkNext: page_num < totalPages ? `/chats/search?keyword=${encodeURIComponent(keyword)}&page=${page_num + 1}&pageSize=${pageSize_num}` : null,
            pages: Array.from({ length: Math.min(3, totalPages - page_num + 1) }, (_, i) => page_num + i)
        };

    } catch (error) {
        console.error('Error searching chats for admin:', error);
        throw new Error(`Failed to search chats: ${error.message}`);
    }
};

/**
 * Lấy danh sách các lớp học phần chưa có group chat
 * @param {number} page - Trang hiện tại (mặc định 1) 
 * @param {number} pageSize - Kích thước trang (mặc định 10)
 * @returns {Promise<Object>} - Danh sách course sections chưa có group chat
 */
const getNonChatCourseSections = async (faculty_id = "CNTT", page = 1, pageSize = 10) => {
    try {
        const page_num = Math.max(1, parseInt(page) || 1);
        const pageSize_num = Math.max(1, parseInt(pageSize) || 10);
        const offset = (page_num - 1) * pageSize_num;

        // Lấy danh sách course_section_id đã có group chat
        const existingGroupChats = await Chat.find(
            { type: ChatType.GROUP, course_section_id: { $exists: true, $ne: null } },
            { course_section_id: 1 }
        ).lean();
        const existingCourseSectionIds = existingGroupChats.map(chat => chat.course_section_id);

        const whereCondition = {
            id: { [Op.notIn]: existingCourseSectionIds },
            isCompleted: false
        };

        const includeCondition = [
            {
                model: models.Subject,
                as: 'subject',
                attributes: ['name'],
                where: { faculty_id: faculty_id },
                include: [
                    {
                        model: models.Faculty,
                        as: 'faculty',
                        attributes: ['name']
                    }
                ],
                required: true
            },
            {
                model: models.Clazz,
                as: 'clazz',
                attributes: ['name']
            },
            {
                model: models.Session,
                as: 'session',
                attributes: ['name', 'years']
            },
            {
                model: models.LecturerCourseSection,
                as: 'lecturers_course_sections',
                where: {isMain: true},
                include: [
                    {
                        model: models.Lecturer,
                        as: 'lecturer',
                        attributes: ['lecturer_id', 'name']
                    }
                ]
            },
            {
                model: models.Schedule,
                as: 'schedules',
                where: {
                    isExam: false,
                    user_id: { [Op.like]: 'LE%' }
                },
                attributes: ['start_lesson', 'end_lesson', 'room'],
                required: false // LEFT JOIN
            }
        ];


        const rows = await models.CourseSection.findAll({
            where: whereCondition,
            include: includeCondition,
            attributes: ['id', 'createdAt', 'updatedAt'],
            order: [['updatedAt', 'DESC']],
        });

        const allFlattenedRecords = [];
        rows.forEach(cs => {
            const lecturer = cs.lecturers_course_sections?.[0]?.lecturer;
            const baseRecord = {
                subjectName: cs.subject.name,
                className: cs.clazz?.name || 'N/A',
                course_section_id: cs.id,
                facultyName: cs.subject.faculty.name,
                sessionName: cs.session ? `${cs.session.name} ${cs.session.years}` : 'N/A',
                lecturerName: lecturer?.name || 'N/A',
                createdAt: datetimeFormatter.formatDateTimeVN(cs.createdAt),
                updatedAt: datetimeFormatter.formatDateTimeVN(cs.updatedAt)
            };

            if (cs.schedules && cs.schedules.length > 0) {
                cs.schedules.forEach(schedule => {
                    let subjectSuffix = '';
                    if (schedule.room) {
                        subjectSuffix = schedule.room.startsWith('TH_') ? '-TH' : '-LT';
                    }
                    allFlattenedRecords.push({
                        ...baseRecord,
                        subjectName: (baseRecord.subjectName || 'N/A') + subjectSuffix,
                        start_lesson: schedule.start_lesson || 'N/A',
                        end_lesson: schedule.end_lesson || 'N/A'
                    });
                });
            } else {
                allFlattenedRecords.push({
                    ...baseRecord,
                    start_lesson: 'N/A',
                    end_lesson: 'N/A'
                });
            }
        });

        const total = allFlattenedRecords.length;

        if (total === 0) {
            return {
                total: 0, page: page_num, pageSize: pageSize_num, totalPages: 0,
                courseSections: [], linkPrev: null, linkNext: null, pages: []
            };
        }

        const totalPages = Math.ceil(total / pageSize_num);

        // Cắt mảng để lấy đúng trang
        const paginatedResults = allFlattenedRecords.slice(offset, offset + pageSize_num);

        // Thêm faculty_id vào link phân trang
        const paginationUrl = (page) => `/course-sections/nonchat-course-sections?faculty_id=${faculty_id}&page=${page}&pageSize=${pageSize_num}`;

        return {
            total,
            page: page_num,
            pageSize: pageSize_num,
            totalPages,
            courseSections: paginatedResults,
            linkPrev: page_num > 1 ? paginationUrl(page_num - 1) : null,
            linkNext: page_num < totalPages ? paginationUrl(page_num + 1) : null,
            pages: Array.from({ length: Math.min(3, totalPages - page_num + 1) }, (_, i) => page_num + i)
        };

    } catch (error) {
        console.error('Error getting non-chat course sections:', error);
        throw new Error(`Failed to get non-chat course sections: ${error.message}`);
    }
};

/**
 * Tìm kiếm các lớp học phần chưa có group chat theo từ khóa
 * @param {string} keyword - Từ khóa tìm kiếm (subject name, class name, session name, course_section_id)
 * @param {number} page - Trang hiện tại (mặc định 1)
 * @param {number} pageSize - Kích thước trang (mặc định 10)
 * @returns {Promise<Object>} - Danh sách course sections chưa có group chat phù hợp
 */
const searchNonChatCourseSections = async (faculty_id = "CNTT", keyword, page = 1, pageSize = 10) => {
    try {
        if (!keyword || keyword.trim() === '') {
            return await getNonChatCourseSections(faculty_id, page, pageSize);
        }

        const searchKeyword = keyword.trim();
        const page_num = Math.max(1, parseInt(page) || 1);
        const pageSize_num = Math.max(1, parseInt(pageSize) || 10);
        const offset = (page_num - 1) * pageSize_num;

        // Lấy danh sách course_section_id đã có group chat
        const existingGroupChats = await Chat.find(
            { type: ChatType.GROUP, course_section_id: { $exists: true, $ne: null } },
            { course_section_id: 1 }
        ).lean();
        const existingCourseSectionIds = existingGroupChats.map(chat => chat.course_section_id);

        // Kiểm tra xem keyword có phải là UUID (course_section_id) không
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(searchKeyword);
        const searchKeywordLike = `%${searchKeyword.toLowerCase()}%`;

        // Xây dựng điều kiện WHERE động
        const whereCondition = {
            isCompleted: false,
            id: { [Op.notIn]: existingCourseSectionIds } // Loại bỏ các ID đã có chat
        };

        if (isUUID) {
            // Nếu là UUID, chỉ tìm chính xác theo ID
            whereCondition.id = {
                [Op.eq]: searchKeyword,
                [Op.notIn]: existingCourseSectionIds // Vẫn đảm bảo nó chưa có chat
            };
        } else {
            whereCondition[Op.or] = [
                // Tìm theo subject name (không phân biệt hoa thường)
                Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col('subject.name')),
                    'LIKE',
                    searchKeywordLike
                ),
                // Tìm theo class name (không phân biệt hoa thường)
                Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col('clazz.name')),
                    'LIKE',
                    searchKeywordLike
                )
            ];
        }

        const rows = await models.CourseSection.findAll({
            where: whereCondition,
            include: [
                {
                    model: models.Subject,
                    as: 'subject',
                    attributes: ['name'],
                    include: [
                        {
                            model: models.Faculty,
                            as: 'faculty',
                            attributes: ['name']
                        }
                    ],
                    required: false // LEFT JOIN
                },
                {
                    model: models.Clazz,
                    as: 'clazz',
                    attributes: ['name'],
                    required: false
                },
                {
                    model: models.Session,
                    as: 'session',
                    attributes: ['name', 'years']
                },
                {
                    model: models.LecturerCourseSection,
                    as: 'lecturers_course_sections',
                    include: [
                        {
                            model: models.Lecturer,
                            as: 'lecturer',
                            attributes: ['lecturer_id', 'name']
                        }
                    ]
                },
                {
                    model: models.Schedule,
                    as: 'schedules',
                    where: {
                        isExam: false,
                        user_id: { [Op.like]: 'LE%' }
                    },
                    attributes: ['start_lesson', 'end_lesson', 'room'],
                    required: false
                }
            ],
            attributes: ['id', 'createdAt', 'updatedAt'],
            order: [['updatedAt', 'DESC']]
        });

        // LÀM PHẲNG KẾT QUẢ THEO SCHEDULE
        const allFlattenedRecords = [];
        rows.forEach(cs => {
            const lecturer = cs.lecturers_course_sections?.[0]?.lecturer;
            const baseRecord = {
                subjectName: cs.subject?.name || 'N/A',
                className: cs.clazz?.name || 'N/A',
                course_section_id: cs.id,
                facultyName: cs.subject?.faculty?.name || 'N/A',
                sessionName: cs.session ? `${cs.session.name} ${cs.session.years}` : 'N/A',
                lecturerName: lecturer?.name || 'N/A',
                createdAt: datetimeFormatter.formatDateTimeVN(cs.createdAt),
                updatedAt: datetimeFormatter.formatDateTimeVN(cs.updatedAt)
            };

            if (cs.schedules && cs.schedules.length > 0) {
                cs.schedules.forEach(schedule => {
                    let subjectSuffix = '';
                    if (schedule.room) {
                        subjectSuffix = schedule.room.startsWith('TH_') ? '-TH' : '-LT';
                    }
                    allFlattenedRecords.push({
                        ...baseRecord,
                        subjectName: (baseRecord.subjectName || 'N/A') + subjectSuffix,
                        start_lesson: schedule.start_lesson || 'N/A',
                        end_lesson: schedule.end_lesson || 'N/A'
                    });
                });
            } else {
                // Nếu CourseSection không có schedule (thỏa mãn user_id LIKE 'LE%'),
                // bạn vẫn push 1 record (theo logic code gốc của bạn)
                allFlattenedRecords.push({
                    ...baseRecord,
                    start_lesson: 'N/A',
                    end_lesson: 'N/A'
                });
            }
        });

        // Tổng số record BÂY GIỜ mới là tổng của mảng đã làm phẳng
        const total = allFlattenedRecords.length;
        if (total === 0) {
            return {
                total: 0, page: page_num, pageSize: pageSize_num, totalPages: 0,
                courseSections: [], linkPrev: null, linkNext: null, pages: []
            };
        }
        const totalPages = Math.ceil(total / pageSize_num);
        // Cắt mảng để lấy đúng trang hiện tại
        const paginatedResults = allFlattenedRecords.slice(offset, offset + pageSize_num);

        return {
            total,
            page: page_num,
            pageSize: pageSize_num,
            totalPages,
            courseSections: paginatedResults,
            linkPrev: page_num > 1 ? `/nonchat-course-sections/search?faculty_id=${encodeURIComponent(faculty_id)}&keyword=${encodeURIComponent(keyword)}&page=${page_num - 1}&pageSize=${pageSize_num}` : null,
            linkNext: page_num < totalPages ? `/nonchat-course-sections/search?faculty_id=${encodeURIComponent(faculty_id)}&keyword=${encodeURIComponent(keyword)}&page=${page_num + 1}&pageSize=${pageSize_num}` : null,
            pages: Array.from({ length: Math.min(3, totalPages - page_num + 1) }, (_, i) => page_num + i)
        };

    } catch (error) {
        console.error('Error searching non-chat course sections:', error);
        throw new Error(`Failed to search non-chat course sections: ${error.message}`);
    }
};

/**
 * Mute/Unmute member trong group chat (dành cho tất cả thành viên)
 * @param {string} user_id - ID của user thực hiện
 * @param {string} chat_id - ID của chat
 */
const updateMuteStatus = async (user_id, chat_id) => {
    try {
        const chat = await Chat.findOne({ _id: chat_id });
        if (!chat) {
            throw new Error('Chat not found or not a group chat');
        }
        const memberIndex = chat.members.findIndex(member => member.userID === user_id);
        if (memberIndex === -1) {
            throw new Error('User is not a member of this chat');
        }
        chat.members[memberIndex].muted = !chat.members[memberIndex].muted;
        const muteMessage = chat.members[memberIndex].muted ? 'Đã tắt thông báo' : 'Đã bật thông báo';
        await chat.save();
        return {
            success: true,
            message: muteMessage
        };
    } catch (error) {
        console.error('Error updating mute status:', error);
        throw new Error(`Failed to update mute status: ${error.message}`);
    }
};

/**
 * Dọn dẹp các group chat theo học kỳ với điều kiện lớp học phần đã hoàn thành
 * @param {string} session_id - ID của học kỳ
 * @returns {Promise<Object>} - Kết quả dọn dẹp
 */

const cleanupCompletedCourseSectionChats = async (session_id) => {
    try {
        // Tìm các lớp học phần đã hoàn thành trong học kỳ (sử dụng Sequelize)
        const completedCourseSections = await models.CourseSection.findAll({
            where: {
                session_id: session_id,
                isCompleted: true
            },
            attributes: ['id']
        });

        if (completedCourseSections.length === 0) {
            return {
                success: true,
                message: 'Không có lớp học phần đã hoàn thành nào trong học kỳ này',
                deletedCount: 0
            };
        }

        // Lấy danh sách course_section_id đã hoàn thành
        const completedCourseSectionIds = completedCourseSections.map(cs => cs.id);

        // Dọn dẹp các group chat tương ứng (sử dụng MongoDB)
        const deleteResult = await Chat.deleteMany({
            type: ChatType.GROUP,
            course_section_id: { $in: completedCourseSectionIds }
        });

        return {
            success: true,
            message: `Đã dọn dẹp ${deleteResult.deletedCount} group chat cho ${completedCourseSections.length} lớp học phần đã hoàn thành`,
            deletedCount: deleteResult.deletedCount,
            courseSectionCount: completedCourseSections.length
        };
    } catch (error) {
        console.error('Error cleaning up completed course section chats:', error);
        throw new Error(`Failed to clean up completed course section chats: ${error.message}`);
    }
};

/**
 * Tạo hàng loạt group chat cho các lớp học phần chưa có chat theo học kỳ (dành cho admin)
 * @param {string} admin_id - ID của admin
 * @param {string} session_id - ID của học kỳ
 * @param {string} nameTemplate - Template tên nhóm (có thể chứa placeholders như {subjectName}, {className})
 * @returns {Promise<Object>} - Kết quả tạo hàng loạt chat
 */
const createBulkGroupChats = async (admin_id, courseSections, sessionInfo) => {
    try {
        if (!courseSections || courseSections.length === 0) {
            return {
                success: true,
                message: "Không có lớp học phần nào được chọn để tạo nhóm.",
                createdChats: [], failedChats: [], totalProcessed: 0
            };
        }

        const results = {
            success: true, createdChats: [], failedChats: [],
            totalProcessed: courseSections.length
        };

        // Lấy danh sách tất cả ID cần xử lý
        const allCourseSectionIds = courseSections.map(cs => cs.course_section_id);

        // 1. Lấy TẤT CẢ lecturers
        const allLecturers = await models.LecturerCourseSection.findAll({
            where: { course_section_id: { [Op.in]: allCourseSectionIds } },
            include: [{
                model: models.Lecturer,
                as: 'lecturer',
                attributes: ['lecturer_id', 'name', 'avatar']
            }],
            raw: true,
            nest: true  // Giữ cấu trúc object (lecturer.name)
        });

        // 2. Lấy TẤT CẢ students
        const allStudents = await models.StudentCourseSection.findAll({
            where: { course_section_id: { [Op.in]: allCourseSectionIds } },
            include: [{
                model: models.Student,
                as: 'student',
                attributes: ['student_id', 'name', 'avatar']
            }],
            raw: true,
            nest: true
        });

        // 3. Xử lý dữ liệu (Map) để tra cứu nhanh trong JavaScript
        // Key = course_section_id, Value = Array<MemberObject>
        const membersMap = new Map();
        const defaultAvatar = 'https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809711/privateavatar_hagxki.png';
        const now = new Date();

        // Map Lecturers
        allLecturers.forEach(lcs => {
            if (!lcs.lecturer) return;
            const key = lcs.course_section_id;
            const member = {
                userID: lcs.lecturer.lecturer_id,
                userName: lcs.lecturer.name,
                avatar: lcs.lecturer.avatar || defaultAvatar,
                role: MemberRole.LECTURER,
                joinedAt: now,
                muted: false
            };
            if (!membersMap.has(key)) membersMap.set(key, []);
            membersMap.get(key).push(member);
        });

        // Map Students
        allStudents.forEach(scs => {
            if (!scs.student) return;
            const key = scs.course_section_id;
            const member = {
                userID: scs.student.student_id,
                userName: scs.student.name,
                avatar: scs.student.avatar || defaultAvatar,
                role: MemberRole.MEMBER,
                joinedAt: now,
                muted: false
            };
            if (!membersMap.has(key)) membersMap.set(key, []);
            membersMap.get(key).push(member);
        });

        // 4. Chuẩn bị mảng chats để insert
        const chatsToInsert = [];
        for (const courseSection of courseSections) {
            let chatName = "";
            try {
                if (!courseSection.course_section_id || !courseSection.subjectName || !courseSection.className) {
                    throw new Error("Dữ liệu course section không đầy đủ.");
                }

                // Tạo tên nhóm
                const lessons = `Tiết ${courseSection.start_lesson || '?'}-${courseSection.end_lesson || '?'}`;
                chatName = `${sessionInfo}_${courseSection.subjectName}_${courseSection.className}_${lessons}`;

                // Lấy members đã được tra cứu
                const members = membersMap.get(courseSection.course_section_id) || [];

                // Tạo chat object
                const chatData = {
                    _id: uuidv4(),
                    course_section_id: courseSection.course_section_id,
                    type: ChatType.GROUP,
                    name: chatName,
                    avatar: "https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809477/groupavatar_driiwd.png",
                    createdBy: admin_id,
                    updatedBy: admin_id,
                    members: members
                };

                chatsToInsert.push(chatData);

                // Ghi nhận thành công (tạm thời)
                results.createdChats.push({
                    course_section_id: courseSection.course_section_id,
                    chat_name: chatName,
                    status: 'prepared_for_insert'
                });

            } catch (error) {
                // Bắt lỗi nếu 1 item bị hỏng (ví dụ: thiếu data)
                console.error(`Error processing course section ${courseSection.course_section_id}:`, error);
                results.failedChats.push({
                    course_section_id: courseSection.course_section_id,
                    chat_name: chatName || "Lỗi tạo tên",
                    error: error.message,
                    status: 'failed_preparation'
                });
            }
        }

        // 5. Insert TẤT CẢ vào MongoDB
        if (chatsToInsert.length > 0) {
            try {
                await Chat.insertMany(chatsToInsert, { ordered: false });
                // ordered: false nghĩa là nếu 1 cái lỗi, nó vẫn insert những cái còn lại
            } catch (mongoError) {
                console.error('Mongo insertMany error:', mongoError);
                // Ghi đè toàn bộ kết quả là 'thất bại'
                results.failedChats.push({
                    course_section_id: 'ALL',
                    chat_name: 'N/A',
                    error: `Lỗi MongoDB: ${mongoError.message}`,
                    status: 'failed_insert_many'
                });
                // Xóa các chat đã chuẩn bị
                results.createdChats = [];
            }
        }

        // 7. Tạo thông báo tổng kết
        const successCount = results.createdChats.length;
        const failedCount = results.failedChats.length;
        let message = `Đã xử lý ${results.totalProcessed} lớp học phần. `;
        message += `Tạo thành công: ${successCount} nhóm chat`;
        if (failedCount > 0) {
            message += `, Thất bại: ${failedCount} nhóm chat`;
        }

        return {
            ...results,
            message: message,
            sessionInfo: sessionInfo
        };

    } catch (error) {
        console.error('Error creating bulk group chats:', error);
        throw new Error(`Failed to create bulk group chats: ${error.message}`);
    }
};

/**
 * Lấy danh sách các lớp học phần chưa có group chat theo học kỳ và theo khoa. Không phân trang.
 * @param {string} session_id - ID của học kỳ
 * @param {number} faculty_id - ID của khoa
 * @returns {Promise<Object>} - Danh sách course sections chưa có group chat trong session
 */
const getNonChatCourseSectionsBySessionFaculty = async (session_id, faculty_id) => {
    try {
        // Kiểm tra session có tồn tại không
        const session = await models.Session.findOne({
            where: { id: session_id },
            attributes: ['name', 'years']
        });

        if (!session) {
            return {
                success: false,
                message: 'Không tìm thấy học kỳ với ID đã cho'
            };
        }

        // Lấy danh sách course_section_id đã có group chat
        const existingGroupChats = await Chat.find(
            { type: ChatType.GROUP, course_section_id: { $exists: true, $ne: null } },
            { course_section_id: 1 }
        ).lean();

        const existingCourseSectionIds = existingGroupChats.map(chat => chat.course_section_id);

        // Điều kiện WHERE để lọc theo session và loại bỏ các course section đã có group chat
        const whereCondition = {
            session_id: session_id,
            isCompleted: false,
            ...(existingCourseSectionIds.length > 0 ? { id: { [Op.notIn]: existingCourseSectionIds } } : {})
        };

        const includeConditions = [
            {
                model: models.Subject,
                as: 'subject',
                attributes: ['name'],
                where: { faculty_id: faculty_id },
                required: true,
            },
            {
                model: models.Clazz,
                as: 'clazz',
                attributes: ['name']
            },
            {
                model: models.Schedule,
                as: 'schedules',
                where: {
                    isExam: false,
                    user_id: { [Op.like]: 'LE%' }
                },
                attributes: ['start_lesson', 'end_lesson', 'room'],
                required: false
            }
        ];

        // Lấy danh sách course sections
        const courseSections = await models.CourseSection.findAll({
            where: whereCondition,
            include: includeConditions,
            attributes: ['id']
        });

        // Format dữ liệu trả về - tạo một bản ghi cho mỗi schedule
        const processedCourseSections = [];
        courseSections.forEach(cs => {
            const baseRecord = {
                subjectName: cs.subject?.name || 'N/A',
                className: cs.clazz?.name || 'N/A',
                course_section_id: cs.id,
            };

            // Nếu có schedules, tạo một bản ghi cho mỗi schedule
            if (cs.schedules && cs.schedules.length > 0) {
                cs.schedules.forEach(schedule => {
                    let subjectSuffix = '';
                    if (schedule.room) {
                        subjectSuffix = schedule.room.startsWith('TH_') ? '-TH' : '-LT';
                    }

                    processedCourseSections.push({
                        ...baseRecord,
                        subjectName: (baseRecord.subjectName || 'N/A') + subjectSuffix,
                        start_lesson: schedule.start_lesson || 'N/A',
                        end_lesson: schedule.end_lesson || 'N/A'
                    });
                });
            } else {
                // Nếu không có schedules, loại bỏ bản ghi
                // processedCourseSections.push({
                //     ...baseRecord,
                //     start_lesson: 'N/A',
                //     end_lesson: 'N/A'
                // });
            }
        });

        // Tổng số sau khi xử lý schedules
        const totalCount = processedCourseSections.length;

        return {
            success: true,
            totalCount,
            courseSections: processedCourseSections,
            sessionInfo: `${session.name} ${session.years}`
        };

    } catch (error) {
        console.error('Error getting non-chat course sections by session:', error);
        throw new Error(`Failed to get non-chat course sections by session: ${error.message}`);
    }
};

/**
 * Lấy thông tin cuộc trò chuyện theo chatID với format chuẩn
 * @param {string} chatID - ID của chat
 * @returns {Promise<Object>} - Thông tin chat đã được format
 */
const getChatInfoById = async (userID, chatID) => {
    try {
        // Sử dụng findOneAndUpdate để tìm và cập nhật trong một thao tác
        const chat = await Chat.findOneAndUpdate(
            { _id: chatID, "members.userID": userID },
            { $set: { "members.$.lastReadAt": new Date() } },
            { new: true }
        ).lean();

        if (!chat) {
            return {
                success: false,
                message: 'Không tìm thấy cuộc trò chuyện hoặc bạn không phải là thành viên'
            };
        }

        // Format thông tin chat
        if (chat.type === ChatType.PRIVATE && chat.members.length === 2) {
            const otherMember = chat.members.find(member => member.userID !== userID);
            chat.name = otherMember ? otherMember.userName : 'Private Chat';
            chat.avatar = otherMember ? otherMember.avatar : null;
        }

        const formattedChat = {
            _id: chat._id,
            type: chat.type,
            name: chat.name,
            avatar: chat.avatar,
            course_section_id: chat.course_section_id || null,
            createdBy: chat.createdBy,
            updatedBy: chat.updatedBy,
            createdAt: datetimeFormatter.formatDateTimeVN(chat.createdAt),
            updatedAt: datetimeFormatter.formatDateTimeVN(chat.updatedAt),
            members: chat.members.map(member => ({
                userID: member.userID,
                userName: member.userName,
                role: member.role || 'member',
                avatar: member.avatar,
                joinedAt: datetimeFormatter.formatDateTimeVN(member.joinedAt),
                muted: member.muted,
                lastReadAt: member.lastReadAt ? datetimeFormatter.formatDateTimeVN(member.lastReadAt) : null
            }))
        };

        return {
            success: true,
            chat: formattedChat
        };
    } catch (error) {
        console.error('Error getting chat info by ID:', error);
        throw new Error(`Failed to get chat info by ID: ${error.message}`);
    }
};

/**
 * Lấy thông tin chat theo chatID (dành cho admin)
 * @param {string} chatID - ID của chat
 * @returns {Promise<Object>} - Thông tin chat đã được format
 */
const getChatInfoById4Admin = async (chatID) => {
    try {
        const chat = await Chat.findOne({ _id: chatID }).lean();
        if (!chat) {
            return {
                success: false,
                message: 'Không tìm thấy cuộc trò chuyện'
            };
        }
        // Format thông tin chat
        const formattedChat = {
            _id: chat._id,
            type: chat.type,
            name: chat.name,
            avatar: chat.avatar,
            course_section_id: chat.course_section_id || null,
            createdBy: chat.createdBy,
            updatedBy: chat.updatedBy,
            createdAt: datetimeFormatter.formatDateTimeVN(chat.createdAt),
            updatedAt: datetimeFormatter.formatDateTimeVN(chat.updatedAt),
            members: chat.members.map(member => ({
                userID: member.userID,
                userName: member.userName,
                role: member.role || 'member',
                avatar: member.avatar,
                joinedAt: datetimeFormatter.formatDateTimeVN(member.joinedAt),
                muted: member.muted,
                lastReadAt: member.lastReadAt ? datetimeFormatter.formatDateTimeVN(member.lastReadAt) : null
            }))
        };
        return {
            success: true,
            chat: formattedChat
        };
    } catch (error) {
        console.error('Error getting chat info by ID for admin:', error);
        throw new Error(`Failed to get chat info by ID for admin: ${error.message}`);
    }
};

/**
 * Tìm kiếm user theo keyword tìm kiếm chính xác (dành cho admin)
 * @param {string} keyword - Từ khóa tìm kiếm (userID, email, phone)
 */
const searchUserByKeyword = async (keyword) => {
    try {
        if (!keyword || keyword.trim() === '') {
            return {
                success: false,
                message: 'Từ khóa tìm kiếm không được để trống'
            };
        }
        const searchKeyword = keyword.trim();

        let result = {};

        // Tìm kiếm trong Staff
        result = await models.Staff.findOne({
            where: {

                [Op.or]: [
                    { admin_id: searchKeyword },
                    { phone: searchKeyword },
                    { email: searchKeyword }
                ]
            },
            attributes: ['admin_id', 'name', 'avatar'],
            raw: true
        });
        if (result) result.type = 'Quản trị viên';

        if (result === null) {
            // Tìm kiếm trong Student
            result = await models.Student.findOne({
                where: {
                    [Op.or]: [
                        { student_id: searchKeyword },
                        { phone: searchKeyword },
                        { email: searchKeyword }
                    ]
                },
                attributes: ['student_id', 'name', 'avatar'],
                raw: true
            });
            if (result) result.type = 'Sinh viên';
        }

        if (result === null) {
             // Tìm kiếm trong Parent
            result = await models.Parent.findOne({
                where: {
                    [Op.or]: [
                        { parent_id: searchKeyword },
                        { phone: searchKeyword },
                        { email: searchKeyword }
                    ]
                },
                attributes: ['parent_id', 'name', 'avatar'],
                raw: true
            });
            if (result) result.type = 'Phụ huynh';
        }

        if (result === null) {
            return {
                success: false,
                message: 'Không tìm thấy người dùng với từ khóa đã cho'
            };
        }

        return {
            success: true,
            result
        };
    } catch (error) {
        console.error('Error searching user by keyword:', error);
        throw new Error(`Failed to search user by keyword: ${error.message}`);
    }
};

/**
 * Tìm kiếm user theo keyword (dành cho parent)
 * @param {string} keyword - Từ khóa tìm kiếm (userID, email, phone)
 */
const searchUserByKeyword4Parent = async (keyword) => {
    try {
        if (!keyword || keyword.trim() === '') {
            return {
                success: false,
                message: 'Từ khóa tìm kiếm không được để trống'
            };
        }
        const searchKeyword = keyword.trim();

        let result = {};

        // Tìm kiếm trong Staff
        result = await models.Staff.findOne({
            where: {
                [Op.or]: [
                    { admin_id: searchKeyword },
                    { phone: searchKeyword },
                    { email: searchKeyword }
                ]
            },
            attributes: ['admin_id', 'name', 'avatar'],
            raw: true
        });
        if (result) result.type = 'Quản trị viên';

        if (result === null) {
            // Tìm kiếm giảng viên
            result = await models.Lecturer.findOne({
                where: {
                    [Op.or]: [
                        { lecturer_id: searchKeyword },
                        { phone: searchKeyword },
                        { email: searchKeyword }
                    ]
                },
                attributes: ['lecturer_id', 'name', 'avatar'],
                raw: true
            });
            if (result) result.type = 'Giảng viên';
        }

        return {
            success: true,
            result
        };
    } catch (error) {
        console.error('Error searching user by keyword:', error);
        throw new Error(`Failed to search user by keyword: ${error.message}`);
    }
};

/**
 * Tìm kiếm user theo keyword (dành cho Sinh viên)
 * @param {string} keyword - Từ khóa tìm kiếm (userID, email, phone)
 */
const searchUserByKeyword4Student = async (keyword) => {
    try {
        if (!keyword || keyword.trim() === '') {
            return {
                success: false,
                message: 'Từ khóa tìm kiếm không được để trống'
            };
        }
        const searchKeyword = keyword.trim();

        let result = {};

        // Tìm kiếm trong Staff
        result = await models.Staff.findOne({
            where: {
                [Op.or]: [
                    { admin_id: searchKeyword },
                    { phone: searchKeyword },
                    { email: searchKeyword }
                ]
            },
            attributes: ['admin_id', 'name', 'avatar'],
            raw: true
        });
        if (result) result.type = 'Quản trị viên';

        if (result === null) {
            // Tìm kiếm giảng viên
            result = await models.Lecturer.findOne({
                where: {
                    [Op.or]: [
                        { lecturer_id: searchKeyword },
                        { phone: searchKeyword },
                        { email: searchKeyword }
                    ]
                },
                attributes: ['lecturer_id', 'name', 'avatar'],
                raw: true
            });
            if (result) result.type = 'Giảng viên';
        }

        return {
            success: true,
            result
        };
    } catch (error) {
        console.error('Error searching user by keyword:', error);
        throw new Error(`Failed to search user by keyword: ${error.message}`);
    }
};

/**
 * Tìm kiếm user theo keyword (dành cho giảng viên)
 * @param {string} keyword - Từ khóa tìm kiếm (userID, email, phone)
 */
const searchUserByKeyword4Lecturer = async (keyword) => {
    try {
        if (!keyword || keyword.trim() === '') {
            return {
                success: false,
                message: 'Từ khóa tìm kiếm không được để trống'
            };
        }
        const searchKeyword = keyword.trim();

        let result = {};

        // Tìm kiếm trong Staff
        result = await models.Staff.findOne({
            where: {
                [Op.or]: [
                    { admin_id: searchKeyword },
                    { phone: searchKeyword },
                    { email: searchKeyword }
                ]
            },
            attributes: ['admin_id', 'name', 'avatar'],
            raw: true
        });
        if (result) result.type = 'Quản trị viên';

        // Tìm kiếm trong Lecturer
        result = await models.Lecturer.findOne({
            where: {
                [Op.or]: [
                    { lecturer_id: searchKeyword },
                    { phone: searchKeyword },
                    { email: searchKeyword }
                ]
            },
            attributes: ['lecturer_id', 'name', 'avatar'],
            raw: true
        });
        if (result) result.type = 'Giảng viên';

        if (result === null) {
            // Tìm kiếm trong Student
            result = await models.Student.findOne({
                where: {
                    [Op.or]: [
                        { student_id: searchKeyword },
                        { phone: searchKeyword },
                        { email: searchKeyword }
                    ]
                },
                attributes: ['student_id', 'name', 'avatar'],
                raw: true
            });
            if (result) result.type = 'Sinh viên';
        }

        if (result === null) {
           // Tìm kiếm trong Parent
            result = await models.Parent.findOne({
                where: {
                    [Op.or]: [
                        { parent_id: searchKeyword },
                        { phone: searchKeyword },
                        { email: searchKeyword }
                    ]
                },
                attributes: ['parent_id', 'name', 'avatar'],
                raw: true
            });
            if (result) result.type = 'Phụ huynh';
        }

        return {
            success: true,
            result
        };
    } catch (error) {
        console.error('Error searching user by keyword:', error);
        throw new Error(`Failed to search user by keyword: ${error.message}`);
    }
};

/**
 * Xóa 1 member khỏi nhóm chat
 * @param {string} chat_id - ID của chat
 * @param {string} user_id - ID của user bị xóa
 * @returns {Promise<Object>} - Kết quả xóa member
 */
const deleteMemberFromGroupChat4Admin = async (chat_id, user_id) => {
    try {
        // Kiểm tra chat có tồn tại và là group chat không
        const chat = await Chat.findOne({
            _id: chat_id,
            type: ChatType.GROUP
        });

        if (!chat) {
            return {
                success: false,
                message: 'Không tìm thấy nhóm chat hoặc chat không phải là nhóm'
            };
        }

        // Kiểm tra member có tồn tại trong nhóm không
        const memberIndex = chat.members.findIndex(member => member.userID === user_id);

        if (memberIndex === -1) {
            return {
                success: false,
                message: 'Thành viên không tồn tại trong nhóm chat'
            };
        }

        const memberToDelete = chat.members[memberIndex];
        chat.members.splice(memberIndex, 1);
        await chat.save();

        // Lấy thông tin user bị xóa để trả về message
        let userName = memberToDelete.userName;
        let userType = 'thành viên';

        if (memberToDelete.role === MemberRole.ADMIN) {
            userType = 'quản trị viên';
        } else if (memberToDelete.role === MemberRole.LECTURER) {
            userType = 'giảng viên';
        }

        return {
            success: true,
            message: `Đã xóa ${userType} ${userName} khỏi nhóm chat ${chat.name}`,
            remainingMemberCount: chat.members.length
        };

    } catch (error) {
        console.error('Error deleting member from group chat:', error);
        throw new Error(`Failed to delete member from group chat: ${error.message}`);
    }
};

/**
 * Tạo hàng loạt nhóm chat chủ nhiệm cho TẤT CẢ giảng viên có lớp chủ nhiệm
 * (Chỉ tạo nếu nhóm chưa tồn tại)
 * @param {string} admin_id - ID của admin thực hiện
 */
const createBulkGroupChatsWithHomeroomLecturers = async (admin_id) => {
    try {
        // BƯỚC 1: Lấy tất cả giảng viên có lớp chủ nhiệm (homeroom_class_id không null)
        const lecturers = await models.Lecturer.findAll({
            where: {
                homeroom_class_id: {
                    [Op.ne]: null
                }
            },
            attributes: ['lecturer_id', 'name', 'avatar', 'homeroom_class_id']
        });

        if (lecturers.length === 0) {
            return { success: true, message: 'Không có giảng viên nào có lớp chủ nhiệm để tạo nhóm.' };
        }

        // Lấy danh sách các class_id cần xử lý
        const classIds = lecturers.map(l => l.homeroom_class_id);

        // BƯỚC 2: Lấy thông tin Lớp và Sinh viên song song (Promise.all) để tối ưu
        const [classes, students] = await Promise.all([
            // Lấy thông tin tên lớp
            models.Clazz.findAll({
                where: { id: classIds },
                attributes: ['id', 'name']
            }),
            // Lấy tất cả sinh viên thuộc các lớp này
            models.Student.findAll({
                where: { clazz_id: classIds },
                attributes: ['student_id', 'name', 'avatar', 'clazz_id']
            })
        ]);

        // BƯỚC 3: Chuẩn bị dữ liệu để truy xuất nhanh (Mapping)
        // Map: class_id -> class_name
        const classMap = new Map();
        classes.forEach(c => classMap.set(c.id, c.name));

        // Map: class_id -> danh sách sinh viên
        const studentsByClass = new Map();
        students.forEach(s => {
            if (!studentsByClass.has(s.clazz_id)) {
                studentsByClass.set(s.clazz_id, []);
            }
            studentsByClass.get(s.clazz_id).push(s);
        });

        // BƯỚC 4: Kiểm tra các nhóm chat đã tồn tại trong MongoDB để tránh trùng lặp
        // Giả sử tên nhóm là unique key logic: "Chủ nhiệm [Tên lớp]"
        const expectedGroupNames = classes.map(c => "Chủ nhiệm " + c.name);
        const existingChats = await Chat.find({
            type: ChatType.GROUP,
            name: { $in: expectedGroupNames }
        }).select('name');
        
        const existingChatNames = new Set(existingChats.map(c => c.name));

        // BƯỚC 5: Xây dựng danh sách các Chat Object cần insert
        const chatsToInsert = [];
        const now = new Date();
        let skippedCount = 0;

        for (const lecturer of lecturers) {
            const className = classMap.get(lecturer.homeroom_class_id);
            if (!className) continue;

            const chatName = "Chủ nhiệm " + className;

            // Nếu nhóm đã tồn tại thì bỏ qua
            if (existingChatNames.has(chatName)) {
                skippedCount++;
                continue;
            }

            const members = [];

            // 5.1. Thêm giảng viên
            members.push({
                userID: lecturer.lecturer_id,
                userName: lecturer.name,
                avatar: lecturer?.avatar || 'https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809711/privateavatar_hagxki.png',
                role: MemberRole.LECTURER,
                joinedAt: now,
                muted: false
            });

            // 5.2. Thêm sinh viên của lớp đó
            const classStudents = studentsByClass.get(lecturer.homeroom_class_id) || [];
            classStudents.forEach(student => {
                members.push({
                    userID: student.student_id,
                    userName: student.name,
                    avatar: student?.avatar || 'https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809711/privateavatar_hagxki.png',
                    role: MemberRole.MEMBER,
                    joinedAt: now,
                    muted: false
                });
            });

            // 5.3. Tạo object Chat
            chatsToInsert.push({
                _id: uuidv4(),
                type: ChatType.GROUP,
                name: chatName,
                avatar: "https://res.cloudinary.com/dplg9r6z1/image/upload/v1758809477/groupavatar_driiwd.png",
                createdBy: admin_id,
                updatedBy: admin_id,
                members: members,
                createdAt: now,
                updatedAt: now
            });
        }

        // BƯỚC 6: Thực hiện Bulk Insert vào MongoDB
        if (chatsToInsert.length > 0) {
            await Chat.insertMany(chatsToInsert);
        }

        return {
            success: true,
            message: `Hoàn tất xử lý. Đã tạo mới: ${chatsToInsert.length} nhóm. Bỏ qua (đã tồn tại): ${skippedCount} nhóm.`,
            details: {
                created: chatsToInsert.length,
                skipped: skippedCount,
                total_lecturers_scanned: lecturers.length
            }
        };

    } catch (error) {
        console.error('Error creating bulk group chats:', error);
        throw new Error(`Failed to create bulk group chats: ${error.message}`);
    }
};

// Xóa tất cả các nhóm chat chủ nhiệm dựa theo tên lớp danh nghĩa + khóa
// ví dụ:"DHCNTT17" sẽ xóa tất cả nhóm tên "Chủ nhiệm DHCNTT17A", "Chủ nhiệm DHCNTT17B",...
const cleanupHomeroomChatsByClazzName = async (clazzName) => {
    try {
        if (!clazzName || clazzName.trim() === '') {
            return {
                success: false,
                message: 'Tên lớp không được để trống'
            };
        }
        // clazzName phải kết thúc bằng số
        if (!/\d$/.test(clazzName.trim())) {
            return {
                success: false,
                message: 'Tên lớp phải kết thúc bằng số'
            };
        }

        const prefix = `Chủ nhiệm ${clazzName.trim()}`;

        // Tìm và xóa các nhóm chat có tên bắt đầu với prefix
        const deleteResult = await Chat.deleteMany({
            type: ChatType.GROUP,
            name: { $regex: `^${prefix}` }
        });
        return {
            success: true,
            message: `Đã xóa ${deleteResult.deletedCount} nhóm chat chủ nhiệm cho lớp ${clazzName}.`
        };
    } catch (error) {
        console.error('Error cleaning up completed course section chats:', error);
        throw new Error(`Failed to clean up completed course section chats: ${error.message}`);
    }
};

module.exports = {
    createGroupChat4Admin,
    createPrivateChat4Users,
    createPrivateChatWithSystem,
    getGroupChatInfoByCourseSection4Admin,
    getUserChats,
    searchChatsByKeyword,
    updateGroupChat4Admin,
    deleteGroupChat4Admin,
    deleteInactivePrivateChats,
    getAllChats,
    searchChatsByKeyword4Admin,
    getNonChatCourseSections,
    searchNonChatCourseSections,
    createGroupChatWithHomeroomLecturer,
    updateMuteStatus,
    cleanupCompletedCourseSectionChats,
    createBulkGroupChats,
    getNonChatCourseSectionsBySessionFaculty,
    getChatInfoById,
    getChatInfoById4Admin,
    createBulkGroupChatsWithHomeroomLecturers,
    cleanupHomeroomChatsByClazzName,

    searchUserByKeyword,
    searchUserByKeyword4Parent,
    searchUserByKeyword4Student,
    searchUserByKeyword4Lecturer,

    deleteMemberFromGroupChat4Admin,

    getAllChatIdsForUser, //not served api
    getMemberUserIdsByChat, //not served api
    getChatMembersWithMutedStatus //not served api
};
