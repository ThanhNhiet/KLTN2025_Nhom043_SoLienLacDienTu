import { useState, useEffect, useCallback,useMemo,useRef} from "react";
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
    deleteMessage
    
} from "../../api/chat/MessageApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { set } from "date-fns";
import {API_URL} from "@env";
import { io } from 'socket.io-client';
let socket: any = null;
try {
    if (API_URL) {
        socket = io(API_URL, { transports: ['websocket'] });
    } else {
        socket = io('https://e-contact-book-coolking-kvt4.onrender.com', { transports: ['websocket'] });
    }
} catch (e) {
    // If socket initialization fails, keep socket as null and log the error
    console.warn('Socket initialization failed:', e);
    socket = null;
}






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

type File = { uri: string; name?: string; mimeType?: string; }

interface MessagesApiResponse { messages: ItemMessage[]; hasMore: boolean; pages: any[]; total: number; page: number; pageSize: number; }

// --- Custom Hook ---
export const useMessages = (chatId: string) => {
    const [messages, setMessages] = useState<ItemMessage[]>([]);
    const [pinnedMessages, setPinnedMessages] = useState<ItemMessage[]>([]);
    const  [pinnedIDs, setPinnedIDs] = useState<string[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [replyingTo, setReplyingTo] = useState<ItemMessage | null>(null);
    const [deletingMessage, setDeletingMessage] = useState<ItemMessage | null>(null);
    const [pinnedTo, setPinnedTo] = useState<ItemMessage | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 15;
    const [loadingInitial, setLoadingInitial] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [senderInfo, setSenderInfo] = useState<ItemSenderInfo | null>(null);
    const [file, setFile] = useState<File[] | null>(null);
    const [image, setImage] = useState<File[] | null>(null);
    const [fileName, setFileName] = useState<string[] | null>(null);
    const [imageName, setImageName] = useState<string[] | null>(null);
    const [chatInfo, setChatInfo] = useState<ChatInfoType>({ id: "", name: "", avatar: "", memberCount: 0 });

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

        setMessages((prevMessages) => {
            let updatedMessages;
            if (requestedPage === 1) {
                updatedMessages = response.messages;
            } else {
                const existingIds = new Set(prevMessages.map(m => m?._id));
                const uniqueNewMessages = response.messages.filter(m => !existingIds.has(m._id));
                updatedMessages = [...uniqueNewMessages, ...prevMessages];
            }
           
            return updatedMessages;
        });

        const { total, page: responsePage, pageSize: responsePageSize } = response;
        const calculatedHasMore = (responsePage * responsePageSize) < total;
        setHasMore(calculatedHasMore);
        

    } catch (err) {
        console.error("Error fetching messages:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch messages");
    } finally {
        setLoadingInitial(false);
        setLoadingMore(false);
    }
}, []); // FIX: Remove dependencies to prevent re-creation

const loadMoreMessages = useCallback(() => {
    if (loadingMore || !hasMore) {
      
        return;
    }
   
    setPage((prevPage) => prevPage + 1);
}, [loadingMore, hasMore]);

// FIX: Track previous page to avoid double fetches
const previousPageRef = useRef<number>(1);
const fetchInProgressRef = useRef(false);

useEffect(() => {
    if (chatId) {
        setMessages([]);
        setPage(1);
        setHasMore(true);
        setError(null);
        previousPageRef.current = 1;
        fetchInProgressRef.current = false;
        fetchMessages(chatId, 1, pageSize);
    } 
}, [chatId]);

// FIX: Only fetch when page actually changes
useEffect(() => {
    if (page > 1 && page !== previousPageRef.current && chatId && !fetchInProgressRef.current) {
       
        fetchInProgressRef.current = true;
        fetchMessages(chatId, page, pageSize);
        previousPageRef.current = page;
        
        // Reset flag after fetch completes
        setTimeout(() => {
            fetchInProgressRef.current = false;
        }, 500);
    }
}, [page, chatId, pageSize, fetchMessages]);

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

            if (foundSenderInfo) {
                setSenderInfo(foundSenderInfo);
            }
        }
    }, [userId, messages]);

        // receive_message listener scoped to current chatId
        useEffect(() => {
            if (!socket) return;
            const onReceive = ({ chat_id, newMessage }: { chat_id: string; newMessage: ItemMessage }) => {
                if (!newMessage) return;
                // Only handle messages for this chat
                if (chat_id && chat_id !== chatId) return;
                setMessages(prev => {
                    // guard against undefined elements in prev
                    if (prev.some(m => m?._id === newMessage._id)) return prev;
                    return [...prev, newMessage]; // oldest -> newest ordering
                });
                // schedule local notification (if appropriate)
               // showLocalNotification(newMessage);
            };
            const onReceivePin = ({ chat_id, newMessage }: { chat_id: string; newMessage: ItemMessage }) => {
                if (!newMessage) return;
                if (chat_id && chat_id !== chatId) return;
                setMessages((prev) => {
                    const exists = prev.some(msg => msg?._id === newMessage._id);
                    if (exists) {
                        return prev.map(msg => (msg && msg._id === newMessage._id) ? newMessage : msg);
                    }
                    return [ ...prev, newMessage];
                });
                setPinnedMessages((prev) => {
                    const exists = prev.some(msg => msg?._id === newMessage._id);
                    if (exists) return prev;
                    return [...prev, newMessage];
                });
                setPinnedIDs((prev) => prev.includes(newMessage._id) ? prev : [...prev, newMessage._id]);

                // also notify for pinned message if from others
               // showLocalNotification(newMessage);
            };
            const onReceiveUnpin = ({ chat_id, unpinnedMessage_id }: { chat_id: string; unpinnedMessage_id: string }) => {
                if (!unpinnedMessage_id) return;
                // Only handle messages for this chat
                if (chat_id && chat_id !== chatId) return;
                
                setPinnedMessages((prev) => prev.filter(msg => msg && msg._id !== unpinnedMessage_id));
                setPinnedIDs((prev) => prev.filter(id => id !== unpinnedMessage_id));
            };
            const onReceiveDelete = ({ chat_id, message_id }: { chat_id: string; message_id: string }) => {
                if (!message_id) return;
                // Only handle messages for this chat
                if (chat_id && chat_id !== chatId) return;
                setMessages((prev) => prev.map(msg => (msg && msg._id === message_id) ? { ...msg, isDeleted: true } : msg));
            };

            socket.on('receive_message', onReceive);
            socket.on('pin_message', onReceivePin);
            socket.on('unpin_message', onReceiveUnpin);
            socket.on ('del_message',onReceiveDelete);
            return () => {
                socket.off('receive_message', onReceive);
                socket.off('pin_message', onReceivePin);
                socket.off('unpin_message', onReceiveUnpin);
                socket.off('del_message', onReceiveDelete);
            };
        }, [socket, chatId]);
        
        // join/register when socket is connected and we have userId + chatId
        useEffect(() => {
            if (!socket) return;
            if (!userId || !chatId) return;

            const joinRoom = () => {
                if (!socket.connected) return;
                try {
                    socket.emit('register', userId);
                    socket.emit('join_chat', chatId);
                } catch (e) {
                    console.warn('Socket join error:', e);
                }
            };

            if (socket.connected) {
                joinRoom();
                return () => {
                    try { socket.emit('leave_chat', chatId); } catch (_) {}
                };
            } else {
                const onConnect = () => joinRoom();
                socket.on('connect', onConnect);
                return () => {
                    socket.off('connect', onConnect);
                    try { socket.emit('leave_chat', chatId); } catch (_) {}
                };
            }
        }, [socket, userId, chatId]);
 
    const fetchPinnedMessages = useCallback( async (chatId: string) => {
        try {

            const data  = await getPinnedMessage(chatId);
            if (data == null) {
                throw new Error("No data received");
            }
            const pinnIDs = data.map((msg: ItemMessage) => msg._id);
            setPinnedIDs(pinnIDs);
        } catch (error) {
            console.error("Error fetching pinned messages:", error);
            throw error;
        }
    }, []);
    useEffect(() => {
        if (chatId) {
            fetchPinnedMessages(chatId);
        }   
    }, [chatId, fetchPinnedMessages]);

     // --- Lọc danh sách tin nhắn đã ghim ---
        const pinned = useMemo(() => {
            return messages
                .filter(msg => msg && pinnedIDs.includes(msg._id))
                 .sort((a, b) => {
                     const dateA = a?.pinnedInfo ? new Date(a.pinnedInfo.pinnedDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')) : new Date(0); // Chuyển DD/MM/YYYY -> MM/DD/YYYY
                     const dateB = b?.pinnedInfo ? new Date(b.pinnedInfo.pinnedDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')) : new Date(0);
                      // Sắp xếp mới nhất lên đầu
                      return dateB.getTime() - dateA.getTime();
                });
        }, [messages]); 

        useEffect(() => {
            setPinnedMessages(pinned);
        }, [pinned]);
 
    // Hàm xử lý gửi tin nhắn văn bản
    const handleSendMessageText = async (chatID: string, content: string) => {
        if (content.trim() === '') return;
        // optimistic message (temp)
        const tempId = `temp_${Date.now()}`;
        const safeSenderInfo = senderInfo ?? {
            userID: "unknown",
            name: "Bạn",
            avatar: null,
            role: "",
            muted: false,
        };
        try {
            const serverMsg = await apiSendMessageText(chatID, content);
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

            // emit to server/other clients
            try {
                socket.emit('send_message', { chat_id: chatID, newMessage: finalMsg });
                 setNewMessage('');
            } catch (emitErr) {
                console.warn("Socket emit failed:", emitErr);
            }
        } catch (err) {
            console.error("Send message failed:", err);
            // mark temp message as failed
            setMessages(prev => prev.map(m => (m && m._id === tempId) ? { ...m, status: "failed" } : m));
        }
    };



    // Hàm xử lý gửi tin nhắn hình ảnh
    const handleSendMessageImage = async (chatID: string, imagesArr: File[]) => {
        if (!imagesArr || imagesArr.length === 0) return;

        const tempId = `temp_img_${Date.now()}`;
        const safeSenderInfo = senderInfo ?? {
            userID: "unknown",
            name: "Bạn",
            avatar: null,
            role: "",
            muted: false,
        };

        try {
            const serverMsg = await apiSendMessageImage(chatID, imagesArr);
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
                const normalized = prev.filter(Boolean);
                if (normalized.some(m => m._id === finalMsg._id)) return prev;
                if (normalized.some(m => m._id === tempId)) {
                    return prev.map(m => (m && m._id === tempId) ? finalMsg : m);
                }
                return [...prev, finalMsg];
            });
            // emit to server/other clients
            try {
                socket.emit('send_message', { chat_id: chatID, newMessage: finalMsg });
                setImage(null);
                setImageName(null);
            } catch (emitErr) {
                console.warn("Socket emit failed:", emitErr);
            }
        } catch (err) {
            console.error("Error sending image message:", err);
            setMessages(prev => prev.map(m => (m && m._id === tempId) ? { ...m, status: "failed" } : m));
        }
    };

    // Hàm xử lý gửi tin nhắn hình ảnh
    const handleSendMessageFile = async (chatID: string, filesArr: File[]) => {
        if (!filesArr || filesArr.length === 0) return;

        const tempId = `temp_file_${Date.now()}`;
        const safeSenderInfo = senderInfo ?? {
            userID: "unknown",
            name: "Bạn",
            avatar: null,
            role: "",
            muted: false,
            joninDate: null,
            lastReadAt: null,
        };
        try {
            const serverMsg = await apiSendMessageFile(chatID, filesArr);
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
                const normalized = prev.filter(Boolean);
                if (normalized.some(m => m._id === finalMsg._id)) return prev;
                if (normalized.some(m => m._id === tempId)) {
                    return prev.map(m => (m && m._id === tempId) ? finalMsg : m);
                }
                return [...prev, finalMsg];
            });

            // emit to server/other clients
            try {
                socket.emit('send_message', { chat_id: chatID, newMessage: finalMsg });
                setFile(null);
                setFileName(null);
            } catch (emitErr) {
                console.warn("Socket emit failed:", emitErr);
            }
        } catch (err) {
            console.error("Error sending image message:", err);
            setMessages(prev => prev.map(m => (m && m._id === tempId) ? { ...m, status: "failed" } : m));
        }
    };

     const handleSendReplyText = async (chatID:string ,content:string,message:ItemMessage) => {
        if (content.trim() === '' || !senderInfo) return; 
        // Build API payload (simple shape) and a typed reply object for local state
        const apiReplyPayload = {
            messageID: message._id,
            senderID: message.senderInfo.userID,
            content: message.content,
            type: message.type,
        };
        const replyToTyped: ItemReplyInfo = {
            messageID: message._id,
            senderInfo: {
                userID: message.senderInfo.userID,
                userName: message.senderInfo.name,
                avatar: message.senderInfo.avatar,
                role: message.senderInfo.role,
                muted: message.senderInfo.muted,
                joninDate: message.senderInfo.joninDate,
                lastReadAt: message.senderInfo.lastReadAt,
            },
            content: message.content,
            type: message.type,
        };
        const tempId = `temp_file_${Date.now()}`;
        const safeSenderInfo = senderInfo ?? {
            userID: "unknown",
            name: "Bạn",
            avatar: null,
            role: "",
            muted: false,
            joninDate: null,
            lastReadAt: null,
        };
        try {
            const serverMsg = await apiReplayToMessageText(chatID, content, apiReplyPayload);
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
                replyTo: replyToTyped,
                createdAt: serverMsg.createdAt,
                updatedAt: serverMsg.updatedAt,
            };
            // Insert or replace message in state (similar to other send handlers)
            setMessages(prev => {
                const normalized = prev.filter(Boolean);
                if (normalized.some(m => m._id === finalMsg._id)) return prev;
                if (normalized.some(m => m._id === tempId)) {
                    return prev.map(m => (m && m._id === tempId) ? finalMsg : m);
                }
                return [...prev, finalMsg];
            });
            setNewMessage('');
            try {
                socket.emit('send_message', { chat_id: chatID, newMessage: finalMsg });
                setReplyingTo(null);
            } catch (emitErr) {
                console.warn("Socket emit failed:", emitErr);
            }
        } catch (err) {
            console.error("Send message failed:", err);
            // mark temp message as failed if needed
            setMessages(prev => prev.map(m => (m && m._id === tempId) ? { ...m, status: "failed" } : m));
        }
    };

    const handleSendReplyFile = async (chatID:string ,files:File[],message:ItemMessage) => {
        if (files.length === 0 || !senderInfo) return; 
        // Build API payload (simple shape) and a typed reply object for local state
        const apiReplyPayload = {
            messageID: message._id,
            senderID: message.senderInfo.userID,
            content: message.content,
            type: message.type,
        };
        const replyToTyped: ItemReplyInfo = {
            messageID: message._id,
            senderInfo: {
                userID: message.senderInfo.userID,
                userName: message.senderInfo.name,
                avatar: message.senderInfo.avatar,
                role: message.senderInfo.role,
                muted: message.senderInfo.muted,
                joninDate: message.senderInfo.joninDate,
                lastReadAt: message.senderInfo.lastReadAt,
            },
            content: message.content,
            type: message.type,
        };
        const tempId = `temp_file_${Date.now()}`;
        const safeSenderInfo = senderInfo ?? {
            userID: "unknown",
            name: "Bạn",
            avatar: null,
            role: "",
            muted: false,
            joninDate: null,
            lastReadAt: null,
        };
        try {
            const serverMsg = await apiReplayToMessageFile(chatID, files, apiReplyPayload);
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
                replyTo: replyToTyped,
                createdAt: serverMsg.createdAt,
                updatedAt: serverMsg.updatedAt,
            };
            // Insert or replace message in state (similar to other send handlers)
            setMessages(prev => {
                const normalized = prev.filter(Boolean);
                if (normalized.some(m => m._id === finalMsg._id)) return prev;
                if (normalized.some(m => m._id === tempId)) {
                    return prev.map(m => (m && m._id === tempId) ? finalMsg : m);
                }
                return [...prev, finalMsg];
            });
            try {
                socket.emit('send_message', { chat_id: chatID, newMessage: finalMsg });
                setReplyingTo(null);
            } catch (emitErr) {
                console.warn("Socket emit failed:", emitErr);
            }
        } catch (err) {
            console.error("Send message failed:", err);
            // mark temp message as failed if needed
            setMessages(prev => prev.map(m => (m && m._id === tempId) ? { ...m, status: "failed" } : m));
        }
    };

    const handleSendReplyImage = async (chatID:string ,images:File[],message:ItemMessage) => {
        if (images.length === 0 || !senderInfo) return; 
        // Build API payload (simple shape) and a typed reply object for local state
        const apiReplyPayload = {
            messageID: message._id,
            senderID: message.senderInfo.userID,
            content: message.content,
            type: message.type,
        };
        const replyToTyped: ItemReplyInfo = {
            messageID: message._id,
            senderInfo: {
                userID: message.senderInfo.userID,
                userName: message.senderInfo.name,
                avatar: message.senderInfo.avatar,
                role: message.senderInfo.role,
                muted: message.senderInfo.muted,
                joninDate: message.senderInfo.joninDate,
                lastReadAt: message.senderInfo.lastReadAt,
            },
            content: message.content,
            type: message.type,
        };
        const tempId = `temp_file_${Date.now()}`;
        const safeSenderInfo = senderInfo ?? {
            userID: "unknown",
            name: "Bạn",
            avatar: null,
            role: "",
            muted: false,
            joninDate: null,
            lastReadAt: null,
        };
        try {
            const serverMsg = await apiReplayToMessageImage(chatID, images, apiReplyPayload);
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
                replyTo: replyToTyped,
                createdAt: serverMsg.createdAt,
                updatedAt: serverMsg.updatedAt,
            };
            // Insert or replace message in state (similar to other send handlers)
            setMessages(prev => {
                const normalized = prev.filter(Boolean);
                if (normalized.some(m => m._id === finalMsg._id)) return prev;
                if (normalized.some(m => m._id === tempId)) {
                    return prev.map(m => (m && m._id === tempId) ? finalMsg : m);
                }
                return [...prev, finalMsg];
            });
            try {
                socket.emit('send_message', { chat_id: chatID, newMessage: finalMsg });
                setReplyingTo(null);
            } catch (emitErr) {
                console.warn("Socket emit failed:", emitErr);
            }
        } catch (err) {
            console.error("Send message failed:", err);
            // mark temp message as failed if needed
            setMessages(prev => prev.map(m => (m && m._id === tempId) ? { ...m, status: "failed" } : m));
        }
    };

   const  handlePinMessage = async (message : ItemMessage,userID: string) => {
        try {
            const newMessage = await pinMessage(message._id, userID);
            if (newMessage == null) {
                throw new Error("No data received");
            }
            const safeSenderInfo = senderInfo ?? {
                userID: "unknown",
                name: "Bạn",
                avatar: null,
                role: "",
                muted: false,
                joninDate: '',
                lastReadAt: ''
            };
            const pinnedInfo: ItemPinnedInfo = {
                messageID: newMessage._id,
                pinnedByinfo: {
                    userID: userID,
                    userName: safeSenderInfo.name,
                    avatar: safeSenderInfo.avatar,
                    role: safeSenderInfo.role,
                    muted: safeSenderInfo.muted,
                    joninDate: safeSenderInfo.joninDate || null,
                    lastReadAt: safeSenderInfo.lastReadAt || null,
                },
                pinnedDate: newMessage?.pinnedInfo ? newMessage.pinnedInfo.pinnedDate : null
            };
            const finalMsg: ItemMessage = {
                _id: newMessage._id,
                chatID: newMessage.chatID,
                type: newMessage.type,
                content: newMessage.content,
                filename: newMessage.filename,
                status: newMessage.status,
                isDeleted: newMessage.isDeleted,
                senderInfo: safeSenderInfo,
                pinnedInfo: pinnedInfo,
                replyTo: newMessage.replyTo,
                createdAt: newMessage.createdAt,
                updatedAt: newMessage.updatedAt,
            };

            setMessages((prev) => {
                const exists = prev.some(msg => msg?._id === finalMsg._id);
                if (exists) {
                    return prev.map(msg => (msg && msg._id === finalMsg._id) ? finalMsg : msg);
                }
                return [ ...prev, finalMsg];
            });
            setPinnedMessages((prev) => {
                const exists = prev.some(msg => msg?._id === finalMsg._id);
                if (exists) {
                    return prev; // Không thêm nếu đã tồn tại
                }
                return [...prev, finalMsg]; // Thêm tin nhắn mới vào cuối danh sách
            });
            setPinnedIDs((prev) => {
                if (prev.includes(finalMsg._id)) {
                    return prev; 
                }
                return [...prev, finalMsg._id];
            });
            try {
                socket.emit('pin_message', { chat_id: chatId, pinnedMessage: finalMsg });
            } catch (error) {
                console.error("Error emitting pin_message:", error);
            }
        } catch (error) {
            console.error("Error pinning message:", error);
            throw error;
        }

    };
    const handleUnpinMessage = async (messageID: string) => {
        try {
            const unpinnedMessage = await unpinMessage(messageID);
            if (unpinnedMessage == null) {
                throw new Error("No data received");
            }
            setPinnedMessages((prev) => prev.filter(msg => msg && msg._id !== messageID));
            setPinnedIDs((prev) => prev.filter(id => id !== messageID));
            setMessages((prev) => {
                return prev.map(msg => (msg && msg._id === messageID) ? { ...msg, pinnedInfo: null } : msg);
            });
            try {
                socket.emit('unpin_message', { chat_id: chatId, unpinnedMessageID: messageID });
            } catch (error) {
                console.error("Error emitting unpin_message:", error);
            }
        } catch (error) {
            console.error("Error unpinning message:", error);
            throw error;
        }
    };

    const handleDeleteMessage = async (deletingMessage: ItemMessage | null) => {
        try {
            if (!deletingMessage) {
                throw new Error("No message selected for deletion");
            }
            const messageID = deletingMessage._id;
            const deletedMessage = await deleteMessage(messageID);
            if (deletedMessage == null) {
                throw new Error("No data received");
            }
            if (deletedMessage.pinnedInfo) {
                const unpinnedMessage = await unpinMessage(messageID);
                if (unpinnedMessage == null) {
                    throw new Error("No data received for unpinning");
                }
                setPinnedIDs((prev) => {
                return prev.filter(id => id !== messageID);
            });
             setPinnedMessages((prev) => {
                return prev.filter(msg => msg._id !== messageID);
            });
            try {
                socket.emit('unpin_message', { chat_id: chatId, unpinnedMessageID: messageID });
            } catch (error) {
                console.error("Error emitting unpin_message:", error);
            }
        }
        setMessages((prev) => {
            return prev.map(msg => (msg && msg._id === messageID) ? { ...msg, isDeleted: true } : msg);
                });
            try {
                socket.emit('delete_message', { chat_id: chatId, message_id: messageID });
            } catch (error) {
                console.error("Error emitting delete_message:", error);
            }
        } catch (error) {
            console.error("Error deleting message:", error);
            throw error;
        }
    }



    return { 
        
        // States
        loading: loadingInitial, 
        loadingMore, 
        hasMore, 
        error, 


        messages,
        userId,
        senderInfo,
        newMessage,
        replyingTo,
        file,
        image,
        fileName,
        imageName,
        pinnedMessages,
        pinnedTo,
        chatInfo,

        // Functions
        //load more
        loadMoreMessages ,
        // send message handlers
        handleSendMessageText,
        handleSendMessageImage,
        handleSendMessageFile,
        // pin message handlers
        handlePinMessage,
        // unpin message handlers
        handleUnpinMessage,
        // reply message handlers
        handleSendReplyImage,
        handleSendReplyFile,
        handleSendReplyText,
        // delete message handler
        handleDeleteMessage,

        // Setters
        setNewMessage,
        setMessages, 
        setReplyingTo,
        setFile,
        setImage,
        setFileName,
        setImageName,
        setPinnedTo,
       
       
    };
}