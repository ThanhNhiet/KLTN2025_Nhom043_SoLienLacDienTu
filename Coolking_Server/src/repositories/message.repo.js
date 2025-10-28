const sequelize = require("../config/mariadb.conf");
const initModels = require("../databases/mariadb/model/init-models");
const models = initModels(sequelize);

const { v4: uuidv4 } = require('uuid');
const { Message, MessageStatus, MessageType } = require('../databases/mongodb/schemas/Message');
const { Chat, ChatType, MemberRole } = require('../databases/mongodb/schemas/Chat');
const mongoose = require('mongoose');
const datetimeFormatter = require("../utils/format/datetime-formatter");
const cloudinaryService = require('../services/cloudinary.service');

const folder = 'messages'; // Cloudinary folder for messages

const createMessageText = async ({ chatID, senderID, content }) => {
    try {
        if (!content || content.trim() === '') {
            throw new Error('Content cannot be empty');
            return;
        }

        // Kiểm tra xem nội dung có phải là link hay không
        const isLink = content.startsWith('http://') || content.startsWith('https://');
        const messageType = isLink ? MessageType.LINK : MessageType.TEXT;

        const newMessage = new Message({
            _id: uuidv4(),
            chatID,
            senderID,
            content,
            type: messageType,
            status: MessageStatus.SENDING,
            filename: null,
            replyTo: null,
            pinnedInfo: null,
        });
        await newMessage.save();

        const lastMessage = await Message.findOne({ chatID }).sort({ createdAt: -1 });

        if (!lastMessage) {
            throw new Error("No messages found for the given chatID");
            return;
        }

        return {
            _id: lastMessage._id,
            chatID: lastMessage.chatID,
            senderID: lastMessage.senderID,
            content: lastMessage.content,
            type: lastMessage.type,
            status: lastMessage.status,
            filename: lastMessage.filename,
            replyTo: lastMessage.replyTo,
            pinnedInfo: lastMessage.pinnedInfo,
            createdAt: datetimeFormatter.formatDateTimeVN(lastMessage.createdAt),
            updatedAt: datetimeFormatter.formatDateTimeVN(lastMessage.updatedAt)
        };

    } catch (error) {
        console.error("Error creating text message:", error);
        throw error;
    }
}

const createMessageFile = async ({ chatID, senderID, files }) => {
    try {
        if (!files || files.length === 0) {
            throw new Error('No files provided');
            return;
        }
        const filename = files.map(file => file.originalname).join(',');
        const uploadPromises = files.map(file => {
            return cloudinaryService.upload2Cloudinary(file.buffer, folder, file.originalname);
        });

        const uploadResults = await Promise.all(uploadPromises);
        const failedUploads = uploadResults.every(result => result && result.url);

        if (!failedUploads) {
            throw new Error('File upload failed');
        }
        const links = uploadResults.map(result => result.url);


        const newMessage = new Message({
            _id: uuidv4(),
            chatID,
            senderID,
            content: links.join(','),
            type: MessageType.FILE,
            status: MessageStatus.SENDING,
            filename,
            replyTo: null,
            pinnedInfo: null,
        });
        await newMessage.save();

        const lastMessage = await Message.findOne({ chatID }).sort({ createdAt: -1 });

        if (!lastMessage) {
            throw new Error("No messages found for the given chatID");
            return;
        }
        return {
            _id: lastMessage._id,
            chatID: lastMessage.chatID,
            senderID: lastMessage.senderID,
            content: lastMessage.content,
            type: lastMessage.type,
            status: lastMessage.status,
            filename: lastMessage.filename,
            replyTo: lastMessage.replyTo,
            pinnedInfo: lastMessage.pinnedInfo,
            createdAt: datetimeFormatter.formatDateTimeVN(lastMessage.createdAt),
            updatedAt: datetimeFormatter.formatDateTimeVN(lastMessage.updatedAt)
        };

    } catch (error) {
        console.error("Error creating file message:", error);
        throw error;
    }
}

const createMessageImage = async ({ chatID, senderID, images }) => {
    try {
        if (!images || images.length === 0) {
            throw new Error('No images provided');
            return;
        }
        const uploadPromises = images.map(image => {
            return cloudinaryService.upload2Cloudinary(image.buffer, folder, image.originalname);
        });

        const uploadResults = await Promise.all(uploadPromises);
        const failedUploads = uploadResults.every(result => result && result.url);

        if (!failedUploads) {
            throw new Error('Image upload failed');
        }

        const links = uploadResults.map(result => result.url);

        const newMessage = new Message({
            _id: uuidv4(),

            chatID,
            senderID,
            content: links.join(','),
            type: MessageType.IMAGE,
            status: MessageStatus.SENDING,
            filename: null,
            replyTo: null,
            pinnedInfo: null,
        });
        await newMessage.save();

        const lastMessage = await Message.findOne({ chatID }).sort({ createdAt: -1 });

        if (!lastMessage) {
            throw new Error("No messages found for the given chatID");
            return;
        }

        return {
            _id: lastMessage._id,
            chatID: lastMessage.chatID,
            senderID: lastMessage.senderID,
            content: lastMessage.content,
            type: lastMessage.type,
            status: lastMessage.status,
            filename: lastMessage.filename,
            replyTo: lastMessage.replyTo,
            pinnedInfo: lastMessage.pinnedInfo,
            createdAt: datetimeFormatter.formatDateTimeVN(lastMessage.createdAt),
            updatedAt: datetimeFormatter.formatDateTimeVN(lastMessage.updatedAt)
        };

    } catch (error) {
        console.error("Error creating image message:", error);
        throw error;
    }
}

const createMessageTextReply = async ({ chatID, senderID, content, replyTo }) => {
    try {
        // Validate content
        if (!content || content.trim() === '') {
            throw new Error('Content cannot be empty');
        }

        // Validate replyTo data
        if (!replyTo || !replyTo.messageID) {
            throw new Error('Reply information is required');
        }

        // Create reply info object with correct structure
        const replyInfo = {
            messageID: replyTo.messageID, // This should be the _id of the message being replied to
            senderID: replyTo.senderID,
            type: replyTo.type,
            content: replyTo.content
        };

        // Create new message
        const newMessage = new Message({
            _id: uuidv4(),
            chatID,
            senderID,
            content,
            type: MessageType.TEXT,
            status: MessageStatus.SENDING,
            filename: null,
            replyTo: replyInfo,
            pinnedInfo: null,
        });

        await newMessage.save();

        // Get the saved message
        const lastMessage = await Message.findById(newMessage._id);
        if (!lastMessage) {
            throw new Error("Failed to create message");
        }

        // Return formatted message
        return {
            _id: lastMessage._id,
            chatID: lastMessage.chatID,
            senderID: lastMessage.senderID,
            content: lastMessage.content,
            type: lastMessage.type,
            status: lastMessage.status,
            filename: lastMessage.filename,
            replyTo: lastMessage.replyTo,
            pinnedInfo: lastMessage.pinnedInfo,
            createdAt: datetimeFormatter.formatDateTimeVN(lastMessage.createdAt),
            updatedAt: datetimeFormatter.formatDateTimeVN(lastMessage.updatedAt)
        };
    } catch (error) {
        console.error("Error creating reply message:", error);
        throw error;
    }
};

const createMessageFileReply = async ({ chatID, senderID, replyTo, files }) => {
    try {
        if (!files || files.length === 0) {
            throw new Error('No files provided');
            return;
        }
        const filename = files.map(file => file.originalname).join(',');
        const uploadPromises = files.map(file => {
            return cloudinaryService.upload2Cloudinary(file.buffer, folder, file.originalname);
        });

        const uploadResults = await Promise.all(uploadPromises);
        const failedUploads = uploadResults.every(result => result && result.url);

        if (!failedUploads) {
            throw new Error('File upload failed');
        }
        const links = uploadResults.map(result => result.url);
        const newMessage = new Message({
            _id: uuidv4(),
            chatID,
            senderID,
            content: links.join(','),
            type: MessageType.FILE,
            status: MessageStatus.SENDING,
            filename,
            replyTo,
            pinnedInfo: null,
        });
        await newMessage.save();

        const lastMessage = await Message.findOne({ chatID }).sort({ createdAt: -1 });
        if (!lastMessage) {
            throw new Error("No messages found for the given chatID");
            return;
        }
        return {
            _id: lastMessage._id,
            chatID: lastMessage.chatID,
            senderID: lastMessage.senderID,
            content: lastMessage.content,
            type: lastMessage.type,
            status: lastMessage.status,
            filename: lastMessage.filename,
            replyTo: lastMessage.replyTo,
            pinnedInfo: lastMessage.pinnedInfo,
            createdAt: datetimeFormatter.formatDateTimeVN(lastMessage.createdAt),
            updatedAt: datetimeFormatter.formatDateTimeVN(lastMessage.updatedAt)
        };
    } catch (error) {
        console.error("Error creating file reply message:", error);
        throw error;
    }
}
const createMessageImageReply = async ({ chatID, senderID, replyTo, images }) => {
    try {
        if (!images || images.length === 0) {
            throw new Error('No images provided');
            return;
        }
        const uploadPromises = images.map(image => {
            return cloudinaryService.upload2Cloudinary(image.buffer, folder, image.originalname);
        });

        const uploadResults = await Promise.all(uploadPromises);
        const failedUploads = uploadResults.every(result => result && result.url);

        if (!failedUploads) {
            throw new Error('Image upload failed');
        }

        const links = uploadResults.map(result => result.url);

        const newMessage = new Message({
            _id: uuidv4(),
            chatID,
            senderID,
            content: links.join(','),
            type: MessageType.IMAGE,
            status: MessageStatus.SENDING,
            filename: null,
            replyTo,
            pinnedInfo: null,
        });
        await newMessage.save();

        const lastMessage = await Message.findOne({ chatID }).sort({ createdAt: -1 });

        if (!lastMessage) {
            throw new Error("No messages found for the given chatID");
            return;
        }

        return {
            _id: lastMessage._id,
            chatID: lastMessage.chatID,
            senderID: lastMessage.senderID,
            content: lastMessage.content,
            type: lastMessage.type,
            status: lastMessage.status,
            filename: lastMessage.filename,
            replyTo: lastMessage.replyTo,
            pinnedInfo: lastMessage.pinnedInfo,
            createdAt: datetimeFormatter.formatDateTimeVN(lastMessage.createdAt),
            updatedAt: datetimeFormatter.formatDateTimeVN(lastMessage.updatedAt)
        };

    } catch (error) {
        console.error("Error creating image reply message:", error);
        throw error;
    }
}

const createdMessagePinned = async ({ messageID, pinnedBy }) => {
    try {
        const message = await Message.findById({ _id: messageID });
        if (!message) {
            throw new Error("Message not found");
        }
        message.pinnedInfo = {
            messageID,
            pinnedBy,
            pinnedDate: new Date()
        };
        await message.save();

        const messageObject = message.toObject();
        if (messageObject.pinnedInfo && messageObject.pinnedInfo.pinnedDate) {
            messageObject.pinnedInfo.pinnedDate = datetimeFormatter.formatDateTimeVN(
                messageObject.pinnedInfo.pinnedDate
            );
        }
        return messageObject;
    } catch (error) {
        console.error("Error creating pinned message:", error);
        throw error;
    }
}

const unPinMessage = async (messageID) => {
    try {
        // const message = await Message.findOne({ chatID, messageID });
        const message = await Message.findById({ _id: messageID });
        if (!message) {
            throw new Error("Message not found");
        }
        //Kiểm tra message có được ghim không
        if (!message.pinnedInfo || !message.pinnedInfo.messageID) {
            throw new Error("Message is not pinned");
        }
        message.pinnedInfo = null;
        await message.save();
        return message;
    } catch (error) {
        console.error("Error unpinning message:", error);
        throw error;
    }
};

const getMessagesByChatID = async (chatID, page, pageSize) => {
    try {
        if (!chatID) {
            throw new Error('chatID is required');
        }

        // Validate chat exists first
        const chat = await Chat.findOne({ _id: chatID });
        if (!chat) {
            return {
                total: 0,
                page: 1,
                pageSize: 10,
                messages: [],
                linkPrev: null,
                linkNext: null,
                pages: []
            };
        }

        const page_num = parseInt(page) || 1;
        const pageSize_num = parseInt(pageSize) || 10;

        // Get total count of messages
        const count = await Message.countDocuments({ chatID });
        const members = chat.members || [];

        // Calculate skip from newest messages
        const skip = (page_num - 1) * pageSize_num;

        // Get messages with pagination
        const messages = await Message.find({ chatID })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize_num)
            .lean();

        // Sắp xếp tin nhắn trong trang hiện tại theo thứ tự thời gian tăng dần
        messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        if (messages.length === 0) {
            return {
                total: 0,
                page: page_num,
                pageSize: pageSize_num,
                messages: [],
                linkPrev: null,
                linkNext: null,
                pages: []
            };
        }

        // Format messages
        const formattedMessages = messages.map(msg => {
            const member = members.find(m => m.userID === msg.senderID);
            let replyMember = null;
            let rep = null;

            if (msg.replyTo) {
                replyMember = members.find(m => m.userID === msg.replyTo.senderID);
            }
            if (msg.pinnedInfo) {
                rep = members.find(m => m.userID === msg.pinnedInfo.pinnedBy);
            }

            return {
                _id: msg._id,
                chatID: msg.chatID,
                type: msg.type,
                content: msg.content,
                filename: msg.filename,
                status: msg.status,
                isDeleted: msg.isDeleted,
                senderInfo: {
                    userID: member?.userID || null,
                    name: member?.userName || 'Unknown',
                    avatar: member?.avatar || null,
                    role: member?.role || null,
                    muted: member?.muted || false,
                    joinedAt: member?.joinedAt || null,
                    lastReadAt: member?.lastReadAt || null
                },
                ...(msg.pinnedInfo ? {
                    pinnedInfo: {
                        messageID: msg.pinnedInfo?.messageID || null,
                        pinnedByinfo: rep,
                        pinnedDate: msg.pinnedInfo?.pinnedDate ?
                            datetimeFormatter.formatDateTimeVN(msg.pinnedInfo?.pinnedDate) : null
                    }
                } : null),
                ...(msg.replyTo ? {
                    replyTo: {
                        messageID: msg.replyTo?.messageID || null,
                        senderInfo: replyMember,
                        content: msg.replyTo?.content || null,
                        type: msg.replyTo?.type || null
                    }
                } : null),
                createdAt: msg.createdAt ? datetimeFormatter.formatDateTimeVN(msg.createdAt) : null,
                updatedAt: msg.updatedAt ? datetimeFormatter.formatDateTimeVN(msg.updatedAt) : null
            };
        });

        // Calculate pagination
        const totalPages = Math.ceil(count / pageSize_num);
        const hasMore = page_num < totalPages;
        const hasNewer = page_num > 1;

        return {
            total: count,
            page: page_num,
            pageSize: pageSize_num,
            messages: formattedMessages,
            linkPrev: hasMore ? `/api/messages/${chatID}?page=${page_num + 1}&pageSize=${pageSize_num}` : null,
            linkNext: hasNewer ? `/api/messages/${chatID}?page=${page_num - 1}&pageSize=${pageSize_num}` : null,
            pages: Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + page_num)
                .filter(p => p <= totalPages)
        };

    } catch (error) {
        console.error("Error retrieving messages by chatID:", error);
        throw error;
    }
};

const updateMessageStatus = async (messageID, status) => {
    try {
        const updatedMessage = await Message.findByIdAndUpdate(
            messageID,
            { status, updatedAt: datetimeFormatter.formatDateTimeVN(new Date()) },
            { new: true }
        );
        return updatedMessage;

    } catch (error) {
        console.error("Error updating message status:", error);
        throw error;
    }
}

const getLastMessageByChatID = async (chatID) => {
    try {
        const lastMessage = await Message.findOne({ chatID }).sort({ createdAt: -1 });
        if (!lastMessage) {
            throw new Error("No messages found for the given chatID");
            return;
        }
        return {
            _id: lastMessage._id,
            messageID: lastMessage.messageID,
            chatID: lastMessage.chatID,
            senderID: lastMessage.senderID,
            content: lastMessage.content,
            type: lastMessage.type,
            status: lastMessage.status,
            filename: lastMessage.filename,
            replyTo: lastMessage.replyTo,
            pinnedInfo: lastMessage.pinnedInfo,
            createdAt: lastMessage?.createdAt ? datetimeFormatter.formatDateTimeVN(lastMessage?.createdAt) : null,
            updatedAt: lastMessage?.updatedAt ? datetimeFormatter.formatDateTimeVN(lastMessage?.updatedAt) : null
        };


    } catch (error) {
        console.error("Error retrieving last message by chatID:", error);
        throw error;
    }
}

// Lấy tất cả các tin nhắn có type là image
const getAllImageMessagesByChatID = async (chatID) => {
    try {
        const messages = await Message.find({ chatID, type: 'image' }).lean();
        // Format createdAt and updatedAt fields
        messages.forEach(msg => {
            msg.createdAt = datetimeFormatter.formatDateTimeVN(msg.createdAt);
            msg.updatedAt = datetimeFormatter.formatDateTimeVN(msg.updatedAt);
        });
        return messages;
    } catch (error) {
        console.error("Error retrieving image messages by chatID:", error);
        throw error;
    }
};

// Lấy tất cả các tin nhắn có type là file
const getAllFileMessagesByChatID = async (chatID) => {
    try {
        const messages = await Message.find({ chatID, type: 'file' }).lean();
        // Format createdAt and updatedAt fields
        messages.forEach(msg => {
            msg.createdAt = datetimeFormatter.formatDateTimeVN(msg.createdAt);
            msg.updatedAt = datetimeFormatter.formatDateTimeVN(msg.updatedAt);
        });
        return messages;
    } catch (error) {
        console.error("Error retrieving file messages by chatID:", error);
        throw error;
    }
};

// Lấy tất cả các tin nhắn có type là links
const getAllLinkMessagesByChatID = async (chatID) => {
    try {
        const messages = await Message.find({ chatID, type: 'link' }).lean();
        // Format createdAt and updatedAt fields
        messages.forEach(msg => {
            msg.createdAt = datetimeFormatter.formatDateTimeVN(msg.createdAt);
            msg.updatedAt = datetimeFormatter.formatDateTimeVN(msg.updatedAt);
        });
        return messages;
    } catch (error) {
        console.error("Error retrieving link messages by chatID:", error);
        throw error;
    }
};

// Tìm kiếm tin nhắn trong chat theo từ khóa chỉ với tin nhắn text, tìm kiếm không phân biệt hoa thường, tìm kiếm tương đối
const searchMessagesInChat = async (chatID, keyword) => {
    try {
        const messages = await Message.find({
            chatID,
            type: MessageType.TEXT,
            content: { $regex: keyword, $options: 'i' }
        }).sort({ createdAt: -1 }).lean();

        // Format createdAt and updatedAt fields
        messages.forEach(msg => {
            msg.createdAt = datetimeFormatter.formatDateTimeVN(msg.createdAt);
            msg.updatedAt = datetimeFormatter.formatDateTimeVN(msg.updatedAt);
        });

        return messages;
    }
    catch (error) {
        console.error("Error searching messages in chat:", error);
        throw error;
    }
};

// Xóa tin nhắn (soft delete)
const deleteMessageByID = async (messageID, userID) => {
    try {
        // Tìm theo id
        const message = await Message.findById(messageID);
        if (!message) {
            throw new Error("Message not found");
        }
        // Kiểm tra senderID có trùng với userID không
        if (message.senderID !== userID) {
            throw new Error("Không có quyền xóa tin nhắn này");
        }
        const deletedMessage = await Message.findByIdAndUpdate(messageID, { isDeleted: true }, { new: true });
        return deletedMessage;
    } catch (error) {
        console.error("Error deleting message by ID:", error);
        throw error;
    }
};

//Lấy tất cả các tin nhắn đã được ghim trong chat
const getPinnedMessagesInChat = async (chatID) => {
    try {
        const messages = await Message.find({ chatID, 'pinnedInfo.messageID': { $ne: null } }).lean();
        // Format createdAt and updatedAt fields
        messages.forEach(msg => {
            msg.createdAt = datetimeFormatter.formatDateTimeVN(msg.createdAt);
            msg.updatedAt = datetimeFormatter.formatDateTimeVN(msg.updatedAt);
            msg.pinnedInfo.pinnedDate = datetimeFormatter.formatDateTimeVN(msg.pinnedInfo.pinnedDate);
        }
        );
        return messages;
    } catch (error) {
        console.error("Error retrieving pinned messages by chatID:", error);
        throw error;
    }
};

// Cập nhật lastReadAt của member trong chat
const updateLastReadAt = async (chatID, userID) => {
    try {
        const chat = await Chat.findById(chatID);
        if (!chat) {
            throw new Error("Chat not found");
        }

        const member = chat.members.find(m => m.userID === userID);
        if (!member) {
            throw new Error("Member not found in chat");
        }

        member.lastReadAt = new Date();
        await chat.save();

        return {
            success: true,
            message: "Đã đọc tin nhắn"
        };
    } catch (error) {
        console.error("Error updating lastReadAt:", error);
        throw error;
    }
};

module.exports = {
    createMessageText,
    createMessageFile,
    createMessageImage,
    getMessagesByChatID,
    updateMessageStatus,
    createMessageTextReply,
    createMessageFileReply,
    createMessageImageReply,
    createdMessagePinned,
    getLastMessageByChatID,
    getAllImageMessagesByChatID,
    getAllFileMessagesByChatID,
    getAllLinkMessagesByChatID,
    searchMessagesInChat,
    deleteMessageByID,
    getPinnedMessagesInChat,
    unPinMessage,
    updateLastReadAt
}
