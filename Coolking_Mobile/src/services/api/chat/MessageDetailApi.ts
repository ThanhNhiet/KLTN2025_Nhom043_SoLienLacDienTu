import axiosInstance from "@/src/configs/axiosInstance";

export const getImagesInChat = async (chatId: string) => {
    try {
        const response = await axiosInstance.get(`/api/messages/images/${chatId}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching images in chat:", error);
        throw error;
    }
}

export const getFilesInChat = async (chatId: string) => {
    try {
        const response = await axiosInstance.get(`/api/messages/files/${chatId}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching files in chat:", error);
        throw error;
    }
}

export const getLinksInChat = async (chatId: string) => {
    try {
        const response = await axiosInstance.get(`/api/messages/links/${chatId}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching links in chat:", error);
        throw error;
    }
}


