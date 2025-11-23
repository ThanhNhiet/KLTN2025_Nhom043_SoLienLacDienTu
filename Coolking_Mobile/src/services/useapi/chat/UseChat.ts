import { useEffect, useState,useCallback } from "react";
import { getChats , getSearchChatsByKeyword , getSearchUsersByKeyword, createNewChatPrivate, createNewChatPrivateAI} from "../../api/chat/ChatApi";
import { refresh } from "@react-native-community/netinfo";
import { updatelastReadMessage } from "../../api/chat/MessageApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { set } from "date-fns";
// Giữ nguyên các type ChatItemType, lastMessageType
type ChatItemType = {
    _id: string;
    type: string;
    name: string;
    avatar: string;
    course_section_id: string;
    lastMessage: lastMessageType | null;
    createdAt: string;
    updatedAt: string;
    unread:boolean;
}
type lastMessageType = {
            senderID: string;
            content: string;
            type: string;
            createdAt: string;
}


export const useChat = () => {
    const [chats, setChats] = useState<ChatItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState<any[]>([]);
    const [userID, setUserID] = useState<string>('');

    useEffect(() => {
        const fetchUserID = async () => {
            try {
                const storedUserID = await AsyncStorage.getItem("userId");
                if (storedUserID) {
                    setUserID(storedUserID);
                } else {
                    console.warn("No user ID found in storage");
                }

            } catch (error) {
                console.error("Error fetching user ID:", error);
            }
        }
        fetchUserID();
    }, []);

    const getfetchChats = useCallback(async (page: number,pageSize: number) => {
        try {
           // setLoading(true);
            const res = await getChats(page, pageSize);
            if (!res && !res.chats){
                console.warn("No chats data received");
                setChats([]);
                return;
            }
            setChats(res.chats);
            setTotalPages(res.pages);
            setError(null);
            
        } catch (error) {
            setError(error as Error);
            setChats([])
        } finally{
            setLoading(false);
        }
    },[page]);
    useEffect(() => {
        getfetchChats(page,10);
    },[getfetchChats]);

    const searchChats = useCallback(async (query: string) => {
        setLoading(true);
        try {
            const res = await getSearchChatsByKeyword(query);
            if (!res || !res.success) {
                console.warn("No search results found");
               // setChats([]);
                return;
            }
            return res.chats;
            setError(null);
        } catch (error) {
            setError(error as Error);
           // setChats([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const searchUsers = useCallback(async (query: string) => {
        setLoading(true);
        try {
            const res = await getSearchUsersByKeyword(query);   
            if (!res || !res.success) {
                console.warn("No user search results found");
                return [];
            }
            
            // Transform the result into the expected format
            const users = Array.isArray(res.result) 
                ? res.result.map((user: any) => ({
                    id: user.type === "Giảng viên" ? user.lecturer_id : user.admin_id,
                    name: user.name,
                    avatar: user.avatar,
                    type: user.type
                }))
                : [{
                    id: res.result.lecturer_id || res.result.admin_id,
                    name: res.result.name,
                    avatar: res.result.avatar,
                    type: res.result.type
                }];

            return users;
        } catch (error) {
            setError(error as Error);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const createPrivateChat = useCallback(async (userID: string) => {
        setLoading(true);
        try {
            const res = await createNewChatPrivate(userID);
            if (!res || !res.success) {
                console.warn("Failed to create private chat");
                return null;
            }
            return res;
    } catch (error) {
        setError(error as Error);
        return null;
    } finally {
        setLoading(false);
    }

    },[]);

    const markMessagesAsRead = useCallback(async (chatID: string) => {
        try {
            if (!chatID) {
                console.warn("markMessagesAsRead called with invalid chatID");
                return;
            }
            const data = await updatelastReadMessage(chatID);
            if (!data && !data.success) {
                console.warn("No data returned from updatelastReadMessage");
                return;
            }
        } catch (error) {
            setError(error as Error);
        }
    },[]);

    const createPrivateChatAI = useCallback(async () => {
        setLoading(true);
        try {
            const res = await createNewChatPrivateAI(); 
            if (!res || !res.success) {
                console.warn("Failed to create private AI chat");
                return null;
            }
            return res.chat;
        } catch (error) {
            setError(error as Error);
            return null;
        } finally {
            setLoading(false);
        }
    },[]);

    return {
        chats,
        loading,
        error,
        page,
        refetch: () => getfetchChats(page,10),
        setPage,
        totalPages,
        searchChats,
        searchUsers,
        createPrivateChat,
        userID,
        markMessagesAsRead,
        createPrivateChatAI,
    };
};