import axiosInstance from "../configs/axiosConf";

class MessageServices {

    // GET /api/messages/search/:chatID?keyword=xin chào
    async searchMessages(chatID: string, keyword: string) {
        try {
            const response = await axiosInstance.get(`/messages/search/${chatID}`, {
                params: { keyword }
            });
            return response.data;
        } catch (error) {
            console.error("Error searching messages:", error);
            throw error;
        }
    }

    // GET /api/messages/images/:chatID
    async getAllImagesInChat(chatID: string) {
        try {
            const response = await axiosInstance.get(`/messages/images/${chatID}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching images in chat:", error);
            throw error;
        }
    }

    // GET /api/messages/files/:chatID
    async getAllFilesInChat(chatID: string) {
        try {
            const response = await axiosInstance.get(`/messages/files/${chatID}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching files in chat:", error);
            throw error;
        }
    }

    // GET /api/messages/links/:chatID
    async getAllLinksInChat(chatID: string) {
        try {
            const response = await axiosInstance.get(`/messages/links/${chatID}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching links in chat:", error);
            throw error;
        }
    }

    // GET /api/messages/:chatID?page=1&pageSize=10
    async getLatestMessages(chatID: string) {
        try {
            const response = await axiosInstance.get(`/messages/${chatID}`, {
                params: {
                    page: 1,
                    pageSize: 5
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching latest messages:", error);
            throw error;
        }
    }

    // GET with linkPrev for pagination
    async getMessagesByLinkPrev(linkPrev: string) {
        try {
            // linkPrev đã được clean (bỏ /api) trong useMessage
            const response = await axiosInstance.get(linkPrev);
            return response.data;
        } catch (error) {
            console.error("Error fetching messages by linkPrev:", error);
            throw error;
        }
    }

    // POST /api/messages/text
    // Body: { chatID, text }
    async sendTextMessage(chatID: string, text: string) {
        try {
            const response = await axiosInstance.post(`/messages/text`, { chatID, text });
            return response.data;
        } catch (error) {
            console.error("Error sending text message:", error);
            throw error;
        }
    }

    // POST /api/messages/image
    // Body: { chatID: text, files: File[] }
    async sendImageMessages(chatID: string, files: File[]) {
        try {
            const formData = new FormData();
            formData.append('chatID', chatID);
            files.forEach((file) => {
                formData.append('files', file);
            });
            const response = await axiosInstance.post(`/messages/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error sending image messages:", error);
            throw error;
        }
    }

    // POST /api/messages/file
    // Body: { chatID: text, files: File[] }
    async sendFileMessages(chatID: string, files: File[]) {
        try {
            const formData = new FormData();
            formData.append('chatID', chatID);
            files.forEach((file) => {
                formData.append('files', file);
            }
            );
            const response = await axiosInstance.post(`/messages/file`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error sending file messages:", error);
            throw error;
        }
    }

    // POST /api/messages/text/reply
    // Body: { chatID, text, replyTo: { messageID, senderID, type, content} }
    async sendReplyTextMessage(chatID: string, text: string, replyTo: { messageID: string; senderID: string; type: string; content: string; }) {
        try {
            const response = await axiosInstance.post(`/messages/text/reply`, { chatID, text, replyTo });
            return response.data;
        } catch (error) {
            console.error("Error sending reply text message:", error);
            throw error;
        }
    }

    // POST /api/messages/image/reply
    async sendReplyImageMessage(chatID: string, images: File[], replyTo: { messageID: string; senderID: string; type: string; content: string; }) {
        try {
            const formData = new FormData();
            formData.append('chatID', chatID);
            formData.append('replyTo[messageID]', replyTo.messageID);
            formData.append('replyTo[senderID]', replyTo.senderID);
            formData.append('replyTo[type]', replyTo.type);
            formData.append('replyTo[content]', replyTo.content);
            images.forEach((file) => {
                formData.append('files', file);
            });
            const response = await axiosInstance.post(`/messages/image/reply`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error sending reply image message:", error);
            throw error;
        }
    }

    // POST /api/messages/file/reply
    async sendReplyFileMessage(chatID: string, files: File[], replyTo: { messageID: string; senderID: string; type: string; content: string; }) {
        try {
            const formData = new FormData();
            formData.append('chatID', chatID);
            formData.append('replyTo[messageID]', replyTo.messageID);
            formData.append('replyTo[senderID]', replyTo.senderID);
            formData.append('replyTo[type]', replyTo.type);
            formData.append('replyTo[content]', replyTo.content);
            files.forEach((file) => {
                formData.append('files', file);
            });
            const response = await axiosInstance.post(`/messages/file/reply`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error sending reply file message:", error);
            throw error;
        }
    }

    // GET /api/messages/pinned/:chatID
    async getPinnedMessages(chatID: string) {
        try {
            const response = await axiosInstance.get(`/messages/pinned/${chatID}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching pinned messages:", error);
            throw error;
        }
    }

    // POST /api/messages/pinned
    // Body: { chatID, messageID, pinnedBy }
    async pinMessage(messageID: string, pinnedBy: string) {
        try {
            const response = await axiosInstance.post(`/messages/pinned`, { messageID, pinnedBy });
            return response.data;
        } catch (error) {
            console.error("Error pinning message:", error);
            throw error;
        }
    }

    // POST /api/messages/unpin/:messageID
    async unpinMessage( messageID: string) {
        try {
            const response = await axiosInstance.post(`/messages/unpin/${messageID}`);
            return response.data;
        } catch (error) {
            console.error("Error unpinning message:", error);
            throw error;
        }
    }

    // PUT /api/messages/:messageID/status
    // Body: { status }
    // status: 'sending', 'sent', 'read'
    async updateMessageStatus(messageID: string, status: string) {
        try {
            const response = await axiosInstance.put(`/messages/${messageID}/status`, { status });
            return response.data;
        } catch (error) {
            console.error("Error updating message status:", error);
            throw error;
        }
    }

    // DELETE /api/messages/:messageID
    async deleteMessage(messageID: string) {
        try {
            const response = await axiosInstance.delete(`/messages/${messageID}`);
            return response.data;
        } catch (error) {
            console.error("Error deleting message:", error);
            throw error;
        }
    }

    // PUT /api/messages/lastread/:chatID
    async updateLastReadMessage(chatID: string) {
        try {
            const response = await axiosInstance.put(`/messages/lastread/${chatID}`);
            return response.data;
        } catch (error) {
            console.error("Error updating last read message:", error);
            throw error;
        }
    }

}

export const messageServices = new MessageServices();
export default messageServices;
