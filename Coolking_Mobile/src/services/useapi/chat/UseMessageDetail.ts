import { 
    getImagesInChat,
    getFilesInChat,
    getLinksInChat
} from "../../api/chat/MessageDetailApi";
import { getChatById } from "../../api/chat/ChatApi";
import { useState, useEffect,useRef } from "react"; // Bỏ useCallback vì không cần thiết nữa
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { Alert, Platform ,Linking} from "react-native";

// (Giữ nguyên các type của bạn)
type ImageItemType = {
    id: string;
    messageID: string;
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
    messageID: string;
    url: string;
    name: string;
    size: number; // MỚI: Thêm size để dùng cho UI (nếu API trả về)
}
type LinkItemType = {
    id: string;
    url: string;
}
const handleArr = (content?: string | null): string[] => {
        if (!content) return [];
        // Nếu là JSON hợp lệ (["a","b"] hoặc "a")
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
            if (typeof parsed === "string") return [parsed.trim()].filter(Boolean);
        } catch (_) { /* không phải JSON -> xử lý tiếp */ }

        // Bỏ dấu " bao ngoài (nếu có), tách theo dấu phẩy
        const s = String(content).trim().replace(/^"|"$/g, "");
        return s.split(",").map(x => x.trim()).filter(Boolean);
    }
const handleFileNameArr = (fileName?: string | null): string[] => {
        if (!fileName) return [];
        // Nếu là JSON hợp lệ (["a","b"] hoặc "a")
        try {
            const parsed = JSON.parse(fileName);
            if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
            if (typeof parsed === "string") return [parsed.trim()].filter(Boolean);
        } catch (_) { /* không phải JSON -> xử lý tiếp */ }

        // Bỏ dấu " bao ngoài (nếu có), tách theo dấu phẩy
        const s = String(fileName).trim().replace(/^"|"$/g, "");
        return s.split(",").map(x => x.trim()).filter(Boolean);
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

                // ✅ Xử lý data images (phiên bản chuẩn)
                if (Array.isArray(dataImages)) {
                    const imageUrls = dataImages.flatMap((item: any, i: number) => {
                        const urls = handleArr(item.content);
                        if (urls.length > 1) {
                        // Nhiều ảnh trong 1 message
                        return urls.map((url, index) => ({
                            id: `${item._id}-${index}-${i}`,
                            messageID: item._id,
                            uri: url,
                        }));
                        }

                        // Một ảnh
                        return {
                        id: `${item._id}-${i}`,
                        messageID: item._id,
                        uri: item.content,
                        };
                    });

                    setImages(imageUrls);
                    } else {
                    console.warn("⚠️ No images data received or dataImages is not an array");
                    setImages([]);
                }

                
                // Xử lý data files
               if (dataFiles && Array.isArray(dataFiles)) {
                    const fileItems = dataFiles.flatMap((item: any, i: number) => {
                        const urls = handleArr(item.content);
                        const names = handleFileNameArr(item.filename);

                        // Nếu có nhiều URL (nhiều file trong 1 message)
                        if (urls.length > 1) {
                        return urls.map((url, index) => ({
                            id: `${item._id}-${index}-${i}`,
                            messageID: item._id,
                            url: url,
                            name: names[index] || `file_${index + 1}`,
                            size: item.size || 0,
                        }));
                        }

                        // Nếu chỉ có 1 file
                        return {
                        id: `${item._id}-${i}`,
                        messageID: item._id,
                        url: item.content,
                        name: item.filename || "unknown",
                        size: item.size || 0,
                        };
                    });

                    setFiles(fileItems);
                    } else {
                        console.warn("⚠️ No files data received or dataFiles not an array");
                        setFiles([]);
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
                    setLinks([]);
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


  const openingRef = useRef(false);
  const openFile = async (uri: string, mimeType: string | false | null) => {
    if (openingRef.current) return; // prevent concurrent opens
    openingRef.current = true;
    try {
      const type = String(mimeType || "application/octet-stream");

      if (Platform.OS === "android") {
        // Support either file:// or content:// URIs
        let contentUri = uri;
        try {
          if (uri.startsWith("file://")) {
            contentUri = await FileSystem.getContentUriAsync(uri);
          }
        } catch (e) {
          // If conversion fails, keep original uri and continue
          console.warn("getContentUriAsync failed, will try with original uri:", e);
        }

        const FLAG_GRANT_READ = 1; // FLAG_GRANT_READ_URI_PERMISSION
        const FLAG_ACTIVITY_NEW_TASK = 0x10000000;
        const flags = FLAG_GRANT_READ | FLAG_ACTIVITY_NEW_TASK;

        // Try with specific MIME first, then fallback to "*/*"
        try {
          await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
            data: contentUri,
            flags,
            type,
          });
          return;
        } catch (e1) {
          console.warn("Open with specific MIME failed:", e1);
          try {
            await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
              data: contentUri,
              flags,
              type: "*/*",
            });
            return;
          } catch (e2) {
            console.warn("Open with '*/*' also failed:", e2);
            // Last resort: share if available, otherwise show path
            if (await Sharing.isAvailableAsync()) {
              try {
                await Sharing.shareAsync(uri, { mimeType: type });
                return;
              } catch (sErr) {
                console.warn("Sharing fallback failed:", sErr);
              }
            }
            Alert.alert("Đã tải", `Không thể mở tệp tự động. Tệp đã được lưu tại:\n\n${uri}`);
          }
        }
      } else {
        // iOS: try open URL first, then fallback to Sharing or alert
        try {
          await Linking.openURL(uri);
          return;
        } catch (eOpen) {
          console.warn("Linking.openURL failed:", eOpen);
          if (await Sharing.isAvailableAsync()) {
            try {
              await Sharing.shareAsync(uri, { mimeType: type, dialogTitle: "Mở/Chia sẻ tệp" });
              return;
            } catch (sErr) {
              console.warn("Sharing fallback failed:", sErr);
            }
          }
          Alert.alert("Đã tải", `Không thể mở tệp tự động. Tệp đã được lưu tại:\n\n${uri}`);
        }
      }
    } finally {
      // small delay to avoid immediate double-open from rapid UI taps
      setTimeout(() => {
        openingRef.current = false;
      }, 300);
    }
  };


    return { 
        images,
        files,
        links,
        chatInfo,
        loading,
        error ,
        openFile

    };
}