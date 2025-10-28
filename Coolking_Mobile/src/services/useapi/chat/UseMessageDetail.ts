import { 
    getImagesInChat,
    getFilesInChat,
    getLinksInChat
} from "../../api/chat/MessageDetailApi";
import { getChatById } from "../../api/chat/ChatApi";
import { useState, useEffect } from "react"; // Bỏ useCallback vì không cần thiết nữa

// (Giữ nguyên các type của bạn)
type ImageItemType = {
    id: string;
    uri: string;
}
type ChatInfoType = {
    id: string;
    name: string;
    avatar: string;
    memberCount: number;
}
type FileItemType = {
    id: string;
    url: string;
    name: string;
    size: number; // MỚI: Thêm size để dùng cho UI (nếu API trả về)
}
type LinkItemType = {
    id: string;
    url: string;
}

export const useMessageDetail = (chatId: string) => {
    const [images, setImages] = useState<ImageItemType[]>([]);
    const [files, setFiles] = useState<FileItemType[]>([]);
    const [links, setLinks] = useState<LinkItemType[]>([]);
    const [chatInfo, setChatInfo] = useState<ChatInfoType | null>(null);
    const [loading, setLoading] = useState(true); // Bắt đầu là true
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Định nghĩa một hàm async bên trong để fetch
        const fetchAllData = async () => {
            if (!chatId) { // Nếu không có chatId thì không làm gì cả
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            
            // CẬP NHẬT: Xóa data cũ ngay lập tức để tránh stale data
            setImages([]);
            setFiles([]);
            setLinks([]);
            setChatInfo(null);

            try {
                // TỐI ƯU: Chạy tất cả 4 API call song song
                const [
                    dataImages,
                    dataFiles,
                    dataLinks,
                    dataChat
                ] = await Promise.all([
                    getImagesInChat(chatId),
                    getFilesInChat(chatId),
                    getLinksInChat(chatId),
                    getChatById(chatId)
                ]);

                // Xử lý data images
                if (dataImages) {
                    const imageUrls = dataImages.map((item: any) => ({
                        id: item._id,
                        uri: item.content
                    }));
                    setImages(imageUrls);
                } else {
                    console.warn("No images data received");
                }
                
                // Xử lý data files
                if (dataFiles) {
                    const fileItems = dataFiles.map((item: any) => ({
                        id: item._id,
                        url: item.content,
                        name: item.filename,
                        size: item.size || 0 // Thêm size (an toàn)
                    }));
                    setFiles(fileItems);
                } else {
                    console.warn("No files data received");
                }
               
                // Xử lý data links
                if (dataLinks) {
                    const linkItems = dataLinks.map((item: any) => ({
                        id: item._id,
                        url: item.content
                    }));
                    setLinks(linkItems);
                } else {
                    console.warn("No links data received");
                }

                // Xử lý data chat info
                if (dataChat && dataChat.chat) {
                    const chatInfoData = {
                        id: dataChat.chat._id,
                        name: dataChat.chat.name,
                        avatar: dataChat.chat.avatar,
                        memberCount: dataChat.chat.members.length,
                    };
                    setChatInfo(chatInfoData);
                } else {
                    console.warn("No chat info data received");
                }

            } catch (err) {
                setError(err as Error);
            } finally {
                // SỬA LỖI: Luôn set loading = false sau khi hoàn tất
                setLoading(false);
            }
        };

        fetchAllData(); // Gọi hàm fetch

    }, [chatId]); // Chỉ phụ thuộc vào chatId

    return { 
        images,
        files,
        links,
        chatInfo,
        loading,
        error 
    };
}