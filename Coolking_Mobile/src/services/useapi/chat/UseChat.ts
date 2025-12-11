import { useEffect, useState, useCallback, useRef } from "react";
import { getChats, getSearchChatsByKeyword, getSearchUsersByKeyword, createNewChatPrivate, createNewChatPrivateAI } from "../../api/chat/ChatApi";
import { updatelastReadMessage } from "../../api/chat/MessageApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ChatItemType = {
    _id: string;
    type: string;
    name: string;
    avatar: string;
    course_section_id: string;
    lastMessage: lastMessageType | null;
    createdAt: string;
    updatedAt: string;
    unread: boolean;
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
    const [loadingInitial, setLoadingInitial] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [userID, setUserID] = useState<string>('');
    
    const isInitializedRef = useRef(false);
    const isFetchingRef = useRef(false);
    const pageSize = 10;

    // Fetch user ID on mount
    useEffect(() => {
        const fetchUserID = async () => {
            try {
                const storedUserID = await AsyncStorage.getItem("userId");
                if (storedUserID) {
                    setUserID(storedUserID);
                }
            } catch (error) {
                console.error("Error fetching user ID:", error);
            }
        };
        fetchUserID();
    }, []);

    // Main fetch function
    const fetchChatsData = useCallback(async (requestedPage: number, isLoadMore: boolean = false) => {
        // Prevent duplicate simultaneous requests
        if (isFetchingRef.current) return;
        
        try {
            isFetchingRef.current = true;
            
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoadingInitial(true);
            }
            setError(null);

            const res = await getChats(requestedPage, pageSize);
            
            if (!res || !res.chats) {
                console.warn("No chats data received");
                setChats([]);
                setHasMore(false);
                return;
            }

            setChats(prevChats => {
                if (requestedPage === 1) {
                    return res.chats;
                } else {
                    const chatIds = new Set(prevChats.map(chat => chat._id));
                    const newChats = res.chats.filter((chat: ChatItemType) => !chatIds.has(chat._id));
                    return [...prevChats, ...newChats];
                }
            });

            // Calculate if more pages exist
            const { total, page: responsePage, pageSize: responsePageSize } = res;
            const calculatedHasMore = (responsePage * responsePageSize) < total;
            setHasMore(calculatedHasMore);

        } catch (error) {
            console.error("Error fetching chats:", error);
            setError(error as Error);
            if (requestedPage === 1) {
                setChats([]);
            }
        } finally {
            setLoadingMore(false);
            setLoadingInitial(false);
            isFetchingRef.current = false;
        }
    }, [pageSize]);

    // Initial load on mount
    useEffect(() => {
        if (!isInitializedRef.current && userID) {
            isInitializedRef.current = true;
            fetchChatsData(1, false);
        }
    }, [userID, fetchChatsData]);

    // Load more when page changes
    useEffect(() => {
        if (page > 1 && userID && !isFetchingRef.current) {
            fetchChatsData(page, true);
        }
    }, [page, userID, fetchChatsData]);

    const loadMoreChats = useCallback(() => {
        if (loadingMore || !hasMore || isFetchingRef.current) return;
        setPage(prevPage => prevPage + 1);
    }, [loadingMore, hasMore]);

    const refetch = useCallback(() => {
        isInitializedRef.current = false;
        setPage(1);
        setHasMore(true);
        setChats([]);
        setLoading(true);
        // Trigger fetch on next effect
        setTimeout(() => {
            if (!isFetchingRef.current) {
                fetchChatsData(1, false);
            }
        }, 0);
    }, [fetchChatsData]);

    const searchChats = useCallback(async (query: string) => {
        setLoading(true);
        try {
            const res = await getSearchChatsByKeyword(query);
            if (!res || !res.success) {
                console.warn("No search results found");
                return [];
            }
            return res.chats;
        } catch (error) {
            setError(error as Error);
            return [];
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
    }, []);

    const markMessagesAsRead = useCallback(async (chatID: string) => {
        try {
            if (!chatID) {
                console.warn("markMessagesAsRead called with invalid chatID");
                return;
            }
            const data = await updatelastReadMessage(chatID);
            if (!data || !data.success) {
                console.warn("No data returned from updatelastReadMessage");
                return;
            }
        } catch (error) {
            setError(error as Error);
        }
    }, []);

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
    }, []);

    return {
        chats,
        loading,
        loadingInitial,
        loadingMore,
        hasMore,
        error,
        page,
        refetch,
        setPage,
        loadMoreChats,
        searchChats,
        searchUsers,
        createPrivateChat,
        userID,
        markMessagesAsRead,
        createPrivateChatAI,
    };
};