import { getFaqSections } from "../../api/chat/MessageApi";
import React,{useEffect,useCallback,useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getChatById } from "../../api/chat/ChatApi";
import { 
    getAllMessages, 
    sendMessageText as apiSendMessageText, 
    sendMessageImage as apiSendMessageImage, 
    sendMessageFile as apiSendMessageFile, 
    replyToMessage,
    getPinnedMessage,
    pinMessage,
    unpinMessage,
    apiReplayToMessageText,
    apiReplayToMessageFile,
    apiReplayToMessageImage,
    deleteMessage,
    createNewChatPrivateAI

    
} from "../../api/chat/MessageApi";

// --- Types (không đổi) ---
type ItemSenderInfo = { 
    userID: string; 
    name: string; 
    avatar: string | null; 
    role: string; 
    muted: boolean; 
    joninDate?: string | null; 
    lastReadAt?: string | null; 
}
type ItempinnedByinfo ={
    userID: string; 
    userName: string; 
    avatar: string | null; 
    role: string; 
    muted: boolean; 
    joninDate?: string | null; 
    lastReadAt?: string | null; 
}
type ItemReplyByinfo ={
    userID: string; 
    userName: string; 
    avatar: string | null; 
    role: string; 
    muted: boolean; 
    joninDate?: string | null; 
    lastReadAt?: string | null; 
}
type ItemPinnedInfo = { 
    messageID: string; 
    pinnedByinfo : ItempinnedByinfo; 
    pinnedDate: string; 
}
type ItemReplyInfo = { 
    messageID: string; 
    senderInfo: ItemReplyByinfo; 
    content: string; 
    type: string; 
}
type ItemMessage = { _id: string; 
    chatID: string; 
    type: 'text' | 'image' | string; 
    content: string; 
    filename: string | null; 
    status: string; 
    isDeleted: boolean; 
    senderInfo: ItemSenderInfo ; 
    pinnedInfo: ItemPinnedInfo | null; 
    replyTo: ItemReplyInfo | null; 
    createdAt: string; 
    updatedAt: string; 
};
type ChatInfoType = {
    id: string;
    name: string;
    avatar: string;
    memberCount: number;
}
interface MessagesApiResponse { messages: ItemMessage[]; hasMore: boolean; pages: any[]; total: number; page: number; pageSize: number; }

// --- CẬP NHẬT: Hàm parseCustomDate ổn định hơn ---
const parseCustomDate = (dateString: string): Date => {
    // Input format: "DD/MM/YYYY HH:mm:ss"
    const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2}):(\d{2})/);
    if (parts && parts.length === 7) {
        try {
            // parts[0] is the full match
            const day = parseInt(parts[1], 10);
            const month = parseInt(parts[2], 10) - 1; // Month is 0-indexed
            const year = parseInt(parts[3], 10);
            const hour = parseInt(parts[4], 10);
            const minute = parseInt(parts[5], 10);
            const second = parseInt(parts[6], 10);

            // Kiểm tra tính hợp lệ cơ bản
            if (month < 0 || month > 11 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
                 console.warn("Invalid date components parsed:", { day, month, year, hour, minute, second });
                 return new Date(0); // Fallback
            }

           // Tạo đối tượng Date (giờ địa phương)
           const d = new Date(year, month, day, hour, minute, second);
           // Kiểm tra xem việc tạo Date có thành công không (tránh trường hợp tháng/ngày không hợp lệ)
           if (isNaN(d.getTime())) {
                console.warn("Resulting date is invalid:", dateString);
                return new Date(0);
           }
           return d;
        } catch (e) {
           console.error(`Error creating date object from "${dateString}":`, e);
           return new Date(0); // Fallback
        }
    }
    console.warn("Could not parse date format:", dateString);
    return new Date(0); // Fallback
};

export const useMessageAi = (chatId: string) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [faqSections, setFaqSections] = useState<string[]>([]);
    const [messages, setMessages] = useState<ItemMessage[]>([]);
    const [input, setInput] = useState('');
    const [chatInfo, setChatInfo] = useState<ChatInfoType>({ id: "", name: "", avatar: "", memberCount: 0 });
    const [page, setPage] = useState(1);
    const pageSize = 15;
    const [loadingInitial, setLoadingInitial] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [senderInfo, setSenderInfo] = useState<ItemSenderInfo | null>(null);
    const [inforSystem, setInforSystem] = useState<ItemSenderInfo | null>(null);
     const [selectedFaq, setSelectedFaq] = useState<string | null>(null);
    const fetchFaqSections = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getFaqSections(); 
            if (!res || !res.success) {
                console.warn("Failed to fetch FAQ sections");
                setFaqSections([]);
                return;
            }
            setFaqSections(res.data);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to fetch FAQ sections");
            setFaqSections([]);
        }
        finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFaqSections();
    }, [fetchFaqSections, chatId]);

    const fetchChatInfo = useCallback(async (chatID: string) => {
            try {
                const dataChat = await getChatById(chatID);
                if (!dataChat || !dataChat.chat) throw new Error("Failed to fetch chat info");
                // Xử lý data chat info
                if (dataChat && dataChat.chat) {
                    const chatInfoData = {
                        id: dataChat.chat._id,
                            name: dataChat.chat.name,
                            avatar: dataChat.chat.avatar,
                            memberCount: dataChat.chat.members.length,
                        };
                setChatInfo(chatInfoData);
                    } else{
                        throw new Error("Chat data is missing");
                    }
            } catch (error) {
                console.error("Error fetching chat info:", error);
                setError(error instanceof Error ? error.message : "Failed to fetch chat info");
            }
        }, []);
        useEffect(() => {
            if (chatId) {
                fetchChatInfo(chatId);
            }
        }, [chatId, fetchChatInfo]);
    
        const fetchMessages = useCallback(async (chatID: string, requestedPage: number, pSize: number) => {
            if (loadingMore || (requestedPage > 1 && !hasMore)) return;
    
            if (requestedPage === 1) setLoadingInitial(true);
            else setLoadingMore(true);
            setError(null);
    
            try {
                const response: MessagesApiResponse = await getAllMessages(chatID, requestedPage, pSize);
                if (!response || !Array.isArray(response.messages)) throw new Error("Invalid API response");
    
                // Sắp xếp lô tin nhắn mới nhất -> cũ nhất (chronological: oldest first)
                const sortedNewMessages = [...response.messages].sort((a, b) => // Tạo bản sao trước khi sort
                    parseCustomDate(a.createdAt).getTime() - parseCustomDate(b.createdAt).getTime()
                );
    
    
                setMessages((prevMessages) => {
                    let updatedMessages;
                    if (requestedPage === 1) {
                        updatedMessages = sortedNewMessages;
                    } else {
                        // guard: prevMessages may contain undefined elements, use optional chaining
                        const existingIds = new Set(prevMessages.map(m => m?._id));
                        const uniqueNewMessages = sortedNewMessages.filter(m => !existingIds.has(m._id));
                        updatedMessages = [...uniqueNewMessages, ...prevMessages]; // Prepend older
                    }
                    return updatedMessages;
                });
                const { total, page, pageSize } = response;
                let calculatedHasMore = (page * pageSize) < total;
                if (!calculatedHasMore) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
    
            } catch (err) {
                console.error("Error fetching messages:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch messages");
            } finally {
                setLoadingInitial(false);
                setLoadingMore(false);
            }
        }, [loadingMore, hasMore]);
    
        // Effect reset khi chatId thay đổi
        useEffect(() => {
            if (chatId) {
                setMessages([]);
                setPage(1);
                setHasMore(true);
                setError(null);
                fetchMessages(chatId, 1, pageSize);
            } else {
                setMessages([]);
                setPage(1);
                setHasMore(false);
            }
        }, [chatId, pageSize]);
    
    
         // Effect fetch khi page thay đổi (cho phân trang)
        useEffect(() => {
            if (page > 1 && chatId) {
                
                fetchMessages(chatId, page, pageSize);
            }
        }, [page, chatId, fetchMessages, pageSize]); 

         const loadMoreMessages = useCallback(() => {
        if (!loadingMore && hasMore) {
            setPage((prevPage) => prevPage + 1);
        } else {
            console.log("Load more skipped:", {loadingMore, hasMore});
        }
    }, [loadingMore, hasMore]);

     useEffect(() => {
        const fetchUserId = async () => {
            const id = await AsyncStorage.getItem('userId');
            if (id) {
                setUserId(id);
            } else {
                console.warn("Could not retrieve userId from AsyncStorage");
            }
        };
        fetchUserId();
    }, []); 

    useEffect(() => {
        
        if (userId && messages.length > 0) {
            const foundSenderInfo = messages.find(msg => msg.senderInfo?.userID === userId)?.senderInfo; 
            const foundSystemInfo = messages.find(msg => msg.senderInfo?.userID !== userId)?.senderInfo;
            if (foundSystemInfo) {
                setInforSystem(foundSystemInfo);
            }
            if (foundSenderInfo) {
                setSenderInfo(foundSenderInfo);
            }
        }
    }, [userId, messages]);

    const handleSendPress = async () => {
        if (!input.trim()) return;
       const textInputMessage = input.trim();
        const tempId = `temp_${Date.now()}`;
               const safeSenderInfo = senderInfo ?? {
                   userID: "unknown",
                   name: "Bạn",
                   avatar: null,
                   role: "",
                   muted: false,
               };
               try {
                   const serverMsg = await apiSendMessageText(chatId, textInputMessage);
                   if (!serverMsg) throw new Error("No data from API");
       
                   const finalMsg: ItemMessage = {
                       _id: serverMsg._id,
                       chatID: serverMsg.chatID,
                       type: serverMsg.type,
                       content: serverMsg.content,
                       filename: serverMsg.filename,
                       status: serverMsg.status,
                       isDeleted: serverMsg.isDeleted,
                       senderInfo: safeSenderInfo,
                       pinnedInfo: serverMsg.pinnedInfo,
                       replyTo: serverMsg.replyTo,
                       createdAt: serverMsg.createdAt,
                       updatedAt: serverMsg.updatedAt,
                   };
                   // Replace temp message with final server message (or append if not found)
                   setMessages(prev => {
                       // guard and normalize prev
                       const normalized = prev.filter(Boolean);
                       if (normalized.some(m => m._id === finalMsg._id)) return prev;
                       if (normalized.some(m => m._id === tempId)) {
                           return prev.map(m => (m && m._id === tempId) ? finalMsg : m);
                       }
                       return [...prev, finalMsg];
                   });
                const newMessage = await createNewChatPrivateAI(chatId, textInputMessage,selectedFaq);
                if (newMessage === null){
                    console.warn("Failed to create AI chat message");
                    return;
                }
                const SysMsg: ItemMessage = {
                       _id: newMessage._id,
                       chatID: newMessage.chatID,
                       type: newMessage.type,
                       content: newMessage.content,
                       filename: newMessage.filename,
                       status: newMessage.status,
                       isDeleted: newMessage.isDeleted,
                       senderInfo: inforSystem ? inforSystem : {
                           userID: "system",
                           name: "Hệ thống AI",
                           avatar: null,
                           role: "",
                           muted: false,
                        },
                       pinnedInfo: newMessage.pinnedInfo,
                       replyTo: newMessage.replyTo,
                       createdAt: newMessage.createdAt,
                       updatedAt: newMessage.updatedAt,
                   };
                   // Replace temp message with final server message (or append if not found)
                   setMessages(prev => {
                       // guard and normalize prev
                       const normalized = prev.filter(Boolean);
                       if (normalized.some(m => m._id === SysMsg._id)) return prev;
                       if (normalized.some(m => m._id === tempId)) {
                           return prev.map(m => (m && m._id === tempId) ? SysMsg : m);
                       }
                       return [...prev, SysMsg];
                   });

                } catch (error) {
                     console.error("Error sending message:", error);
                } finally {
                    // Xoá input sau khi gửi
                    setInput('');
                }
  };



    return { 
        loading,
        error, 
        faqSections, 
        messages,
        chatInfo,
        loadingInitial,
        loadingMore,
        hasMore,
        senderInfo,
        inforSystem,
        userId,
        input,


        setInput,
        selectedFaq,
        setSelectedFaq,


        fetchFaqSections,
        loadMoreMessages,
        handleSendPress
        };
}