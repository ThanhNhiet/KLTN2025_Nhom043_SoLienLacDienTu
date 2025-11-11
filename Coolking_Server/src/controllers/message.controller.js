const messageRepo = require('../repositories/message.repo');
const jwtUtils = require('../utils/jwt.utils');
const faqRepo = require('../repositories/FaqSection.repo');

// POST /api/messages/text
exports.createMessageText = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { chatID, text } = req.body;
        
        if (!chatID || !text) {
            return res.status(400).json({
                success: false,
                message: 'chatID và text là bắt buộc'
            });
        }

        if (!decoded.user_id) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy thông tin người gửi trong token'
            });
        }

        const newMessage = await messageRepo.createMessageText({
            chatID,
            senderID: decoded.user_id,
            content: text
        });

        return res.status(201).json(
            newMessage
    );

    } catch (error) {
        console.error('Error in createMessageText controller:', error);
       res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo tin nhắn văn bản'
        });
    }
};

// POST /api/messages/file
exports.createMessageFile = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { chatID } = req.body;

        if (!chatID || !req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'chatID và file là bắt buộc'
            });
        }

        const newMessage = await messageRepo.createMessageFile({
            chatID,
            senderID: decoded.user_id,
            files: req.files  // Use the array of files directly
        });

        return res.status(201).json(
            newMessage
        );

    } catch (error) {
        console.error('Error in createMessageFile controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo tin nhắn file'
        });
    }
};

// POST /api/messages/image
exports.createMessageImage = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { chatID } = req.body;
        if (!chatID || !req.files || req.files.length === 0) {
            return res.status(400).json({   
                success: false,
                message: 'chatID và file là bắt buộc'
            });
        }

        const newMessage = await messageRepo.createMessageImage({
            chatID,
            senderID: decoded.user_id,
            images: req.files  // Use the array of files directly
        });

        return res.status(201).json(
            newMessage
        );

    } catch (error) {
        console.error('Error in createMessageImage controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo tin nhắn hình ảnh'
        });
    }
};  

// POST /api/messages/TextReply
exports.createMessageTextReply = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { chatID, text, replyTo } = req.body;

        if (!chatID || !text) {
            return res.status(400).json({
                success: false,
                message: 'chatID và text là bắt buộc'
            });
        }

        if (!decoded.user_id) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy thông tin người gửi trong token'
            });
        }

        const newMessage = await messageRepo.createMessageTextReply({
            chatID,
            senderID: decoded.user_id,
            content: text,
            replyTo: replyTo
        });

        return res.status(201).json(
            newMessage
        );

    } catch (error) {
        console.error('Error in createMessageReply controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo tin nhắn phản hồi'
        });
    }
};

// Post /api/messages/fileReply
exports.createMessageFileReply = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { chatID, replyTo } = req.body;
        const files = req.files;
        if (!chatID || !files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'chatID và file là bắt buộc'
            });
        }

        const newMessage = await messageRepo.createMessageFileReply({
            chatID,
            senderID: decoded.user_id,
            files,
            replyTo
        });

        return res.status(201).json(
            newMessage
        );

    } catch (error) {
        console.error('Error in createMessageFileReply controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo tin nhắn phản hồi'
        });
    }
};
// Post /api/messages/imageReply
exports.createMessageImageReply = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { chatID, replyTo } = req.body;

        const files = req.files;
        if (!chatID || !files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'chatID và hình ảnh là bắt buộc'
            });
        }

        const newMessage = await messageRepo.createMessageImageReply({
            chatID,
            senderID: decoded.user_id,
            images: files,
            replyTo
        });

        return res.status(201).json(
            newMessage
        );

    } catch (error) {
        console.error('Error in createMessageImageReply controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo tin nhắn phản hồi'
        });
    }
};

// Post /api/messages/pinned
exports.createdMessagePinned = async (req, res) => {
    try {   
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        // const { chatID, messageID, pinnedBy } = req.body;
        // if (!chatID || !messageID || !pinnedBy) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'chatID, messageID và pinnedBy là bắt buộc'
        //     });
        // }
        const { messageID, pinnedBy } = req.body;
        if (!messageID || !pinnedBy) {
            return res.status(400).json({
                success: false,
                message: 'messageID và pinnedBy là bắt buộc'
            });
        }
        const newMessage = await messageRepo.createdMessagePinned({ messageID, pinnedBy });
        return res.status(200).json(newMessage);
    } catch (error) {
        console.error('Error in createdMessagePinned controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi ghim tin nhắn'
        });
    }
};

// POST /api/messages/unpin/:messageID
exports.unPinMessage = async (req, res) => {
    try {   
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { messageID } = req.params;
        if (!messageID) {
            return res.status(400).json({
                success: false,
                message: 'messageID là bắt buộc'
            });
        }
        const unpinnedMessage = await messageRepo.unPinMessage( messageID);
        return res.status(200).json(unpinnedMessage);
    } catch (error) {
        console.error('Error in unPinMessage controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi bỏ ghim tin nhắn'
        });
    }
};

// GET /api/messages/:chatID
exports.getMessagesByChatID = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { chatID } = req.params;
         const { page, pageSize } = req.query;
        if (!chatID) {
            return res.status(400).json({
                success: false,
                message: 'chatID là bắt buộc'
            });
        }   
        const messages = await messageRepo.getMessagesByChatID(chatID, page, pageSize);
        return res.status(200).json(messages);

    } catch (error) {
        console.error('Error in getMessagesByChatID controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy tin nhắn'
        });
    }
};
// PUT /api/messages/:messageID/status
exports.updateMessageStatus = async (req, res) => {
    try {       
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);  
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { messageID } = req.params;
        const { status } = req.body;
        if (!messageID || !status) {
            return res.status(400).json({
                success: false,
                message: 'messageID và status là bắt buộc'
            });
        }   
        const updatedMessage = await messageRepo.updateMessageStatus(messageID, status);
        return res.status(200).json(updatedMessage);
    } catch (error) {
        console.error('Error in updateMessageStatus controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật trạng thái tin nhắn'
        });
    }   
};

// GET /api/messages/last/:chatID
exports.getLastMessageByChatID = async (req, res) => {
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

        const lastMessage = await messageRepo.getLastMessageByChatID(chatID);
        return res.status(200).json(lastMessage);
    } catch (error) {
        console.error('Error in getLastMessageByChatID controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy tin nhắn cuối cùng'
        });
    }
}

// GET /api/messages/images/:chatID
exports.getAllImageMessagesByChatID = async (req, res) => {
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
        const imageMessages = await messageRepo.getAllImageMessagesByChatID(chatID);
        return res.status(200).json(imageMessages);
    } catch (error) {
        console.error('Error in getAllImageMessagesByChatID controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy tất cả tin nhắn hình ảnh'
        });
    }
};

// GET /api/messages/files/:chatID
exports.getAllFileMessagesByChatID = async (req, res) => {
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
        const fileMessages = await messageRepo.getAllFileMessagesByChatID(chatID);
        return res.status(200).json(fileMessages);
    } catch (error) {
        console.error('Error in getAllFileMessagesByChatID controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy tất cả tin nhắn file'
        });
    }
};

// GET /api/messages/links/:chatID
exports.getAllLinkMessagesByChatID = async (req, res) => {
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
        const linkMessages = await messageRepo.getAllLinkMessagesByChatID(chatID);
        return res.status(200).json(linkMessages);
    } catch (error) {
        console.error('Error in getAllLinkMessagesByChatID controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy tất cả tin nhắn link'
        });
    }
};

// GET /api/messages/search/:chatID?keyword=...
exports.searchMessagesInChat = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { chatID } = req.params;
        const { keyword} = req.query;
        if (!chatID || !keyword) {
            return res.status(400).json({
                success: false,
                message: 'chatID và keyword là bắt buộc'
            });
        }
        const searchResults = await messageRepo.searchMessagesInChat(chatID, keyword);
        return res.status(200).json(searchResults);
    } catch (error) {
        console.error('Error in searchMessagesInChat controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tìm kiếm tin nhắn'
        });
    }
};

// DELETE /api/messages/:messageID
exports.deleteMessageByID = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { messageID } = req.params;
        if (!messageID) {
            return res.status(400).json({
                success: false,
                message: 'messageID là bắt buộc'
            });
        }
        const deletedMessage = await messageRepo.deleteMessageByID(messageID, decoded.user_id);
        return res.status(200).json(deletedMessage);
    } catch (error) {
        console.error('Error in deleteMessageByID controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi xóa tin nhắn'
        });
    }
};

// GET /api/messages/pinned/:chatID
exports.getPinnedMessagesInChat = async (req, res) => {
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
        const pinnedMessages = await messageRepo.getPinnedMessagesInChat(chatID);
        return res.status(200).json(pinnedMessages);
    } catch (error) {
        console.error('Error in getPinnedMessagesInChat controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy tin nhắn đã ghim'
        });
    }
};

// PUT /api/messages/lastread/:chatID
exports.updateLastReadAt = async (req, res) => {
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
        const updatedInfo = await messageRepo.updateLastReadAt(chatID, decoded.user_id);
        return res.status(200).json(updatedInfo);
    }
    catch (error) {
        console.error('Error in updateLastReadAt controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật thời gian đọc cuối cùng'
        });
    }
};


exports.createMessageChatAI = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (decoded.role  === 'ADMIN'){
            res.status(403).json({ message: 'Forbidden' });
        }
        const { section ,question ,chatID} = req.body;
        if (!chatID  || !question) {
            return res.status(400).json({
                success: false,
                message: 'chatID, section và question là bắt buộc'
            });
        }
        if (!decoded.user_id) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy thông tin người gửi trong token'
            });
        }
        const newMessage =  await messageRepo.createMessageAI( chatID, decoded.user_id, section ,question);
        return res.status(200).json(newMessage);

        
    } catch (error) {
        console.error('Error in createMessageAI controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tạo tin nhắn AI'
        });
    }
}

exports.getSections = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        const decoded = jwtUtils.verifyAccessToken(token);
        if (!decoded){
            res.status(403).json({ message: 'Forbidden' });
        }
        const sections = await faqRepo.getSections();
        return res.status(200).json({
            success: true,
            data: sections
        });
        
    } catch (error) {
        console.error('Error in getSections controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy các mục FAQ'
        });
    }
}