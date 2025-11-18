import axiosInstance from "@/src/configs/axiosInstance";


export const getChats = async (page: number, pageSize: number) => {
    try {
        const response = await axiosInstance.get(`/api/chats?page=${page}&pageSize=${pageSize}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching chats:", error);
        throw error;
    }
}

export const getSearchChatsByKeyword = async (query: string) => {
    try {
        const response = await axiosInstance.get(`/api/chats/search?keyword=${query}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error searching chats:", error);
        throw error;
    }
};

export const getSearchUsersByKeyword = async (query: string) => {
    try {
        const response = await axiosInstance.get(`/api/chats/user-search?keyword=${query}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
        
    } catch (error) {
        console.error("Error searching users:", error);
        throw error;
    }
};

export const createNewChatPrivate = async (userID: string) => {
    try {
        const response = await axiosInstance.post(`/api/chats/private/${userID}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error creating new private chat:", error);
        throw error;
    }

};
export const getChatById = async (chatID: string) => {
    try {
        const response = await axiosInstance.get(`/api/chats/${chatID}`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
        
    } catch (error) {
        console.error("Error fetching chat by ID:", error);
        throw error;
    }
}

export const createNewChatPrivateAI = async () => {
    try {
        const response = await axiosInstance.post(`/api/chats/private/system`);
        if (response.data == null) {
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error creating new AI chat:", error);
        throw error;
    }
}
