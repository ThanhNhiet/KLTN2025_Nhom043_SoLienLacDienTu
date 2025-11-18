import axiosInstance from "@/src/configs/axiosInstance";

export const getLastMessage = async (chatId: string) => {
    try {
        const response = await axiosInstance.get(`/api/messages/last/${chatId}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching last message:", error);
        throw error;
    }
}
export const getAllMessages = async (chatId: string, page: number, pageSize: number) => {
    try {
        const response = await axiosInstance.get(`/api/messages/${chatId}?page=${page}&pagesize=${pageSize}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;  
    } catch (error) {
        console.error("Error fetching all messages:", error);
        throw error;
    }
}

export const sendMessageText = async (chatId: string, content: string) => {
    try {
        const response = await axiosInstance.post(`/api/messages/text`, { 
            chatID:chatId,
            text: content 
        });
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error sending text message:", error);
        throw error;
    }
}
type File = { uri: string; fileName?: string; mimeType?: string; }
function getRandomFloat(min: number, max: number) {
  // Đảm bảo min < max
  if (min >= max) {
    console.warn("Min value must be less than max value.");
    return min; // Hoặc ném lỗi
  }
  return Math.random() * (max - min) + min;
}
export const sendMessageImage = async (chatId: string, fileDatas: File[]) => {
    try {
        const formData = new FormData();
        formData.append('chatID', chatId);
        
        fileDatas.forEach((fileData, index) => {
            const randomInteger = getRandomFloat(1000, 9999); // Tạo số nguyên ngẫu nhiên 4 chữ số
            // Lấy phần đuôi file (extension) một cách an toàn
            const uriParts = fileData.uri.split('.');
            const extension = uriParts.length > 1 ? uriParts.pop() : 'tmp'; // Lấy phần tử cuối hoặc dùng 'tmp'

            // Luôn tạo tên file mới
            const fileName = `photo_${randomInteger}.${extension}`;
            formData.append('files', {
                uri: fileData.uri,
                name: fileName,
                type: fileData.mimeType || 'image/jpeg',
            } as any);
        });

        const response = await axiosInstance.post('/api/messages/image', 
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        if (!response.data) {
            throw new Error("No data received");
        }

        return response.data;
    } catch (error) {
        console.error("Error sending image message:", error);
        throw error;
    }
};
export const sendMessageFile = async (chatId: string, fileDatas: File[]) => {
    try {
        const formData = new FormData();
        formData.append('chatID', chatId);
        fileDatas.forEach((fileData, index) => {
            formData.append('files', {
                uri: fileData.uri,
                name: fileData.fileName || `photo.${fileData.uri.split('.').pop()}`,
                type: fileData.mimeType || 'image/jpeg',
            } as any);
        });
        const response = await axiosInstance.post(`/api/messages/file`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data; 
    } catch (error) {
        console.error("Error sending file message:", error);
        throw error;
    }
}

export const replyToMessage = async (chatID: string, text: string, replyTo: Object) => {
    try {
        const response = await axiosInstance.post(`/api/messages/text/reply`, {
            chatID: chatID,
            text: text,
            replyTo: replyTo
        });
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error replying to message:", error);
        throw error;
    }
}
     
export const getPinnedMessage = async (chatId: string) => {
    try {
        const response = await axiosInstance.get(`/api/messages/pinned/${chatId}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching pinned message:", error);
        throw error;
    }
}

export const pinMessage = async (messageID: string,userId: string) => {
    try {
        const response = await axiosInstance.post(`api/messages/pinned`, {
           messageID,
           pinnedBy: userId
        });
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error pinning message:", error);
        throw error;
    }
};

export const unpinMessage = async (messageID: string) => {
    try {
        const response = await axiosInstance.post(`/api/messages/unpin/${messageID}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error unpinning message:", error);
        throw error;
    }
}

export const apiReplayToMessageText = async (chatID: string, content: string, replyTo: Object) => {
    try {
        const response = await axiosInstance.post(`/api/messages/text/reply`, {
            chatID: chatID,
            text: content,
            replyTo: replyTo
        });
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error replying to message:", error);
        throw error;
    }
}
export const apiReplayToMessageImage = async (chatID: string, fileDatas: File[], replyTo: Object) => {
    try {
        const formData = new FormData();
        formData.append('chatID', chatID);
        formData.append('replyTo', JSON.stringify(replyTo));
        fileDatas.forEach((fileData) => {
            formData.append('files', {
                uri: fileData.uri,
                name: fileData.fileName || `photo.${fileData.uri.split('.').pop()}`,
                type: fileData.mimeType || 'image/jpeg',
            } as any);
        });
        const response = await axiosInstance.post(`/api/messages/image/reply`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error replying to message:", error);
        throw error;
    }
}

export const apiReplayToMessageFile = async (chatID: string, fileDatas: File[], replyTo: Object) => {
    try {
        const formData = new FormData();    
        formData.append('chatID', chatID);
        formData.append('replyTo', JSON.stringify(replyTo));
        fileDatas.forEach((fileData) => {   
            formData.append('files', {
                uri: fileData.uri,
                name: fileData.fileName || `file.${fileData.uri.split('.').pop()}`,
                type: fileData.mimeType || 'application/octet-stream',
            } as any);
        });
        const response = await axiosInstance.post(`/api/messages/file/reply`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error replying to message:", error);
        throw error;
    }
}

export const deleteMessage = async (messageID: string) => {
    try {
        const response = await axiosInstance.delete(`/api/messages/${messageID}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
        
    } catch (error) {
        console.error("Error deleting message:", error);
        throw error;
    }
}


export const updatelastReadMessage = async (chatID: string) => {
    try {
        const response = await axiosInstance.put(`/api/messages/lastread/${chatID}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error updating last read message:", error);
        throw error;
    }
}

export const getFaqSections = async () => {
    try {
        const response = await axiosInstance.get(`/api/messages/sections/faqSections`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching sections:", error);
        throw error;
    }
}

export const createNewChatPrivateAI = async (chatId:string,question:string,section:string | null) => {
    try {
        const response = await axiosInstance.post(`/api/messages/faqAsk`,{
            chatID:chatId,
            question:question,
            section:section
        });
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
        
    } catch (error) {
        console.error("Error creating new private AI chat:", error);
        throw error;
    }
}