import React, { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Image,
    Dimensions,
    Alert, // MỚI: Thêm Alert để báo lỗi download
    Linking, // MỚI: Thêm Linking để mở link
    Platform
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import TopNavigations_Detail from "@/src/components/navigations/TopNavigations";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { useMessageDetail } from "@/src/services/useapi/chat/UseMessageDetail";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Mime from "react-native-mime-types";
import * as IntentLauncher from "expo-intent-launcher";


// Lấy chiều rộng màn hình để chia cột cho lưới ảnh
const { width } = Dimensions.get('window');
const imageSize = (width - 40) / 3; 

enum MediaTab {
    Photos = 'photos',
    Files = 'files',
    Links = 'links', // MỚI: Thêm tab Links
}
type ImageItemType = {
    id: string;
    messageID: string;
    uri: string;
}
type FileItemType = {
    id: string;
    messageID: string;
    url: string;
    name: string;
}
type LinkItemType = {
    id: string;
    url: string;
}

type ChatInfoType = {
    id: string;
    name: string;
    avatar: string;
    memberCount: number;
}



export default function MessageDetailScreen() {
    // Provide a generic to useNavigation so TypeScript knows navigate can accept route names and params
    const navigation = useNavigation<any>();
    const [activeTab, setActiveTab] = useState<MediaTab>(MediaTab.Photos);
    const [downloadingId, setDownloadingId] = useState<string | null>(null); // MỚI: State để theo dõi file đang tải
    const [studentId, setStudentId] = useState<string>("");
    const router = useRoute();
    const { chatID } = router.params as { chatID: string };


    const {
        images,
        files,
        links,
        chatInfo,
        loading,
        error,
        openFile
    } = useMessageDetail(chatID);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }
    
    // CẬP NHẬT: Xử lý lỗi
    if (error) {
         return (
            <SafeAreaProvider>
                <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <TopNavigations_Detail navigation={navigation} name="Thông tin hội thoại"  setStudentId={setStudentId} />
                    <Text style={{color: 'red', marginTop: 20}}>Lỗi khi tải thông tin chi tiết.</Text>
                </SafeAreaView>
            </SafeAreaProvider>
         )
    }

    
    // CẬP NHẬT: Hàm xử lý tải file
    const handleDownload = async (item: FileItemType) => {
  if (!item?.url) {
    Alert.alert("Lỗi", "Không tìm thấy đường dẫn tải file.");
    return;
  }

  try {
    // Lấy tên file: ưu tiên item.name, fallback từ URL
    const filenameFromUrl = item.url.split("/").pop() || "file";
    const fileName = item.name || filenameFromUrl;
    const fileUri = FileSystem.documentDirectory + fileName;

    // 👇 Tải file về bộ nhớ app
    const downloadRes = await FileSystem.downloadAsync(item.url, fileUri);

    if (downloadRes.status !== 200) {
      console.log("Download response:", downloadRes);
      Alert.alert("Lỗi", "Tải file thất bại. Vui lòng thử lại.");
      return;
    }

    // iOS / Android: mở menu share / lưu / mở bằng app khác
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(downloadRes.uri);
    } else {
      // Fallback: chỉ thông báo đường dẫn file
      Alert.alert("Hoàn tất", `File đã được lưu tại: ${downloadRes.uri}`);
    }
  } catch (error) {
    console.error("Error downloading file:", error);
    Alert.alert("Lỗi", "Có lỗi xảy ra khi tải file. Vui lòng thử lại.");
  }
};

    // MỚI: Hàm xử lý mở link
    const handleOpenLink = async (url: string) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Lỗi", `Không thể mở đường dẫn: ${url}`);
        }
    };
    const openGoogleDocs = (fileUrl: string) => {
            const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
            Linking.openURL(googleDocsUrl);
        };


    // Render 1 ô ảnh trong lưới
    const renderImageItem = ({ item}: { item: ImageItemType }) => (
        <TouchableOpacity style={styles.imageItemContainer} onPress={() => navigation.navigate("FullImageScreen", { uri: item.uri })}>
            <Image source={{ uri: item.uri }} style={styles.imageItem} />
        </TouchableOpacity>
    );

    
    const getExtFromUrl = (url: string): string => {
        try {
            const clean = decodeURIComponent(url.split('?')[0]);
            const filename = clean.split('/').pop() || '';
            const m = filename.match(/\.([A-Za-z0-9]+)$/);
            return (m?.[1] || '').toLowerCase();
        } catch {
            return '';
        }
    }
    const getFileIconByExt= (ext: string): string => {
        switch (ext) {
            case 'pdf': return 'file-pdf-o';
            case 'doc':
            case 'docx': return 'file-word-o';
            case 'xls':
            case 'xlsx': return 'file-excel-o';
            case 'ppt':
            case 'pptx': return 'file-powerpoint-o';
            case 'zip':
            case 'rar':
            case '7z': return 'file-archive-o';
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif': return 'file-image-o';
            case 'mp4':
            case 'mov':
            case 'avi': return 'file-video-o';
            case 'mp3':
            case 'wav': return 'file-audio-o';
            case 'txt':
            case 'md':
            case 'csv': return 'file-text-o';
            case 'json':
            case 'xml': return 'file-code-o';
            default: return 'file-o';
        }
    }
    const getFileIconFromUrl = (url: string): string => {
        return getFileIconByExt(getExtFromUrl(url));
    }


    // CẬP NHẬT: Render 1 hàng file (thêm size và xử lý download)
    const renderFileItem = ({ item }: { item: FileItemType }) => (
        <TouchableOpacity style={styles.fileItemContainer} onPress={() => openGoogleDocs(item.url)}>
            <FontAwesome name={getFileIconFromUrl(item.url) as any} size={32} color="#555" style={styles.fileIcon} />
            <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
            </View>
            {/* Hiển thị loading khi đang tải; chỉ disable các nút khác, không tất cả */}
            <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => handleDownload(item)}
          disabled={downloadingId !== null && downloadingId !== item.id}
        >
            {downloadingId === item.id ? (
                <ActivityIndicator size="small" color="#007AFF" />
            ) : (
                <FontAwesome name="download" size={20} color="#007AFF" />
            )}
        </TouchableOpacity>
        </TouchableOpacity>
    );

    // MỚI: Render 1 hàng link
    const renderLinkItem = ({ item }: { item: LinkItemType }) => (
        <TouchableOpacity style={styles.linkItemContainer} onPress={() => handleOpenLink(item.url)}>
             <FontAwesome name="link" size={24} color="#555" style={styles.linkIcon} />
             <Text style={styles.linkUrl} numberOfLines={2}>{item.url}</Text>
        </TouchableOpacity>
    );


    // Render phần Header thông tin nhóm
    const renderChatHeader = () => (
        <View style={styles.chatInfoHeader}>
            {chatInfo?.avatar ? (
                <Image source={{ uri: chatInfo.avatar }} style={styles.chatAvatar} />
            ) : (
                <View style={[styles.chatAvatar, styles.defaultAvatar]}>
                    <FontAwesome name="users" size={30} color="#555" />
                </View>
            )}
            <View style={styles.chatInfoText}>
                <Text style={styles.chatName}>{chatInfo?.name}</Text>
                <Text style={styles.memberCount}>{chatInfo?.memberCount} thành viên</Text>
            </View>
        </View>
    );

    // MỚI: Tách phần render nội dung tab ra cho rõ ràng
    const renderMediaContent = () => {
        switch (activeTab) {
            case MediaTab.Photos:
                return (
                    <FlatList
                        key="photos-grid"
                        data={images}
                        renderItem={renderImageItem}
                        keyExtractor={item => item.id}
                        numColumns={3}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={<Text style={styles.emptyText}>Chưa có ảnh nào</Text>}
                    />
                );
            case MediaTab.Files:
                return (
                    <FlatList
                        key="files-list"
                        data={files}
                        renderItem={renderFileItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={<Text style={styles.emptyText}>Chưa có file nào</Text>}
                    />
                );
            case MediaTab.Links:
                 return (
                    <FlatList
                        key="links-list"
                        data={links}
                        renderItem={renderLinkItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={<Text style={styles.emptyText}>Chưa có link nào</Text>}
                    />
                );
            default:
                return null;
        }
    }


    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <TopNavigations_Detail navigation={navigation} name="Thông tin hội thoại"  setStudentId={setStudentId} />

                {/* Phần 1: Thông tin chung của Chat */}
                {renderChatHeader()}

                {/* Phần 2: Quản lý Media (Ảnh/File/Link) */}
                <View style={styles.mediaManagerContainer}>
                    {/* Thanh chọn Tab */}
                    <View style={styles.tabContainer}>
                        {/* Tab Ảnh */}
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === MediaTab.Photos && styles.activeTab]}
                            onPress={() => setActiveTab(MediaTab.Photos)}
                        >
                            <Text style={[styles.tabText, activeTab === MediaTab.Photos && styles.activeTabText]}>
                                Ảnh ({images.length})
                            </Text>
                        </TouchableOpacity>
                        
                        {/* Tab Files */}
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === MediaTab.Files && styles.activeTab]}
                            onPress={() => setActiveTab(MediaTab.Files)}
                        >
                            <Text style={[styles.tabText, activeTab === MediaTab.Files && styles.activeTabText]}>
                                Files ({files.length})
                            </Text>
                        </TouchableOpacity>

                        {/* MỚI: Tab Links */}
                         <TouchableOpacity
                            style={[styles.tabButton, activeTab === MediaTab.Links && styles.activeTab]}
                            onPress={() => setActiveTab(MediaTab.Links)}
                        >
                            <Text style={[styles.tabText, activeTab === MediaTab.Links && styles.activeTabText]}>
                                Links ({links.length})
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* CẬP NHẬT: Nội dung tương ứng với Tab */}
                    {renderMediaContent()}
                </View>

            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
    },
    // ---- Phần 1: Thông tin Chat ----
    chatInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 15,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    chatAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
    },
    defaultAvatar: {
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatInfoText: {
        flex: 1,
    },
    chatName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    memberCount: {
        fontSize: 14,
        color: '#888',
    },

    // ---- Phần 2: Quản lý Media ----
    mediaManagerContainer: {
        flex: 1, 
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    tabButton: {
        paddingVertical: 14,
        flex: 1,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 3,
        borderColor: '#007AFF',
    },
    tabText: {
        fontSize: 16,
        color: '#555',
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 10,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#888',
    },
    // Giao diện Lưới Ảnh
    imageItemContainer: {
        margin: 5,
    },
    imageItem: {
        width: imageSize,
        height: imageSize,
        borderRadius: 8,
        backgroundColor: '#eee'
    },
    // Giao diện Danh sách File
    fileItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
    },
    fileIcon: {
        marginRight: 15,
        width: 32, // Đảm bảo icon chiếm không gian cố định
        textAlign: 'center',
    },
    fileInfo: {
        flex: 1,
        marginRight: 10, // Thêm khoảng cách với nút download
    },
    fileName: {
        fontSize: 16,
        fontWeight: '500',
    },
    fileSize: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    downloadButton: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        width: 40, // Đảm bảo nút download có kích thước cố định
        height: 40,
    },
    // MỚI: Giao diện Danh sách Link
    linkItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
    },
    linkIcon: {
        marginRight: 15,
    },
    linkUrl: {
        flex: 1,
        fontSize: 14,
        color: '#007AFF',
        textDecorationLine: 'underline'
    }
});