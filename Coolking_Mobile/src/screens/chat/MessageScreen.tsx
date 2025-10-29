import React, { useState, useRef, useEffect,useMemo} from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ActivityIndicator,
    Alert,
    Modal,
    TouchableWithoutFeedback,
    Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation, useRoute} from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import TopNavigations_Message from '@/src/components/navigations/TopNavigations_Message';
import { useMessages } from '@/src/services/useapi/chat/UseMessage';
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from 'expo-image-picker';
import { set } from 'date-fns';



// --- Interfaces (không đổi) ---
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


const PinnedMessageItem = ({message, onCloseModal, onGoToMessage}: { message: ItemMessage; onCloseModal: () => void; onGoToMessage: () => void; }) => {
  const handleGoToMessage = () => {

    onCloseModal();
    onGoToMessage();
  };

  // Sanitize & chuẩn hoá chuỗi hiển thị
  const createdAt = String(message?.createdAt ?? "");
  const messageTime = createdAt.split(" ")[1]?.substring(0, 5) ?? "";
  const pinnerName = String(message?.pinnedInfo?.pinnedByinfo?.userName ?? "Unknown");
  
  let pinnedTime = "";
  const pinnedDate = String(message?.pinnedInfo?.pinnedDate ?? "");
  if (pinnedDate) {
    const timePart = pinnedDate.split(" ")[1];
    if (timePart) pinnedTime = timePart.substring(0, 5);
  }

  // Nội dung dòng giữa
  const fileName = String(message?.filename ?? "Tệp đính kèm");
  const contentText =
    message?.type === "image"
      ? "📷 Hình ảnh"
      : message?.type === "file"
      ? `📄 ${fileName}`
      : String(message?.content ?? "");

  // Avatar nguồn
  const avatarUri =
    message?.senderInfo?.avatar && typeof message.senderInfo.avatar === "string"
      ? { uri: message.senderInfo.avatar }
      : { uri: "https://example.com/default-avatar.png" };

  const senderName = String(message?.senderInfo?.name ?? "Unknown");

  // Format the pinned text message
  const getPinnedByText = () => {
    const base = `Ghim bởi ${pinnerName}`;
    return pinnedTime ? `${base} lúc ${pinnedTime}` : base;
  };

  return (
    <TouchableOpacity style={styles.pinnedItemContainer} onPress={handleGoToMessage}>
      <View style={styles.pinnedItemHeader}>
        <Image source={avatarUri} style={styles.pinnedAvatar} />
        <Text style={styles.pinnedSenderName}>{senderName}</Text>
        <Text style={styles.pinnedTimestamp}>{messageTime}</Text>
      </View>

      <Text style={styles.pinnedContent} numberOfLines={2}>
        {contentText}
      </Text>

      {!!message?.pinnedInfo && (
        <Text style={styles.pinnedByText}>
          {getPinnedByText()}
        </Text>
      )}
    </TouchableOpacity>
  );
};


// --- MessageBubble Component ---
const MessageBubble = ({
    message,
    userId,
    onShowActions,
    navigation

}: {
    message: ItemMessage;
    userId: string | null;
    onShowActions: (messageToShowActions: ItemMessage) => void; 
    navigation: any;
}) => {
    const isSent = message.senderInfo?.userID === userId;
    const time = message.createdAt.split(' ')[1]?.substring(0, 5) || '';
    const avatarSource = message.senderInfo?.avatar
        ? { uri: message.senderInfo.avatar }
        : { uri: "https://example.com/default-avatar.png" }; 

    const handleLongPress = () => {
        onShowActions(message);
    };
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
    const openGoogleDocs = (fileUrl: string) => {
        const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
        Linking.openURL(googleDocsUrl);
    };
    const openLinks = (linkUrl: string) => {
        Linking.openURL(linkUrl);
    };
    const getExtFromUrl = (url: string): string => {
  try {
    const clean = decodeURIComponent(url.split('?')[0]);
    const filename = clean.split('/').pop() || '';
    // ưu tiên đuôi cuối cùng (.xlsx), bỏ qua kiểu .tar.gz -> lấy "gz" (tuỳ nhu cầu)
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


    return (
        // Wrap bubble in TouchableOpacity for long press
        <TouchableOpacity onLongPress={handleLongPress} activeOpacity={0.8}>
            <View style={[styles.messageRow, isSent ? styles.sentRow : styles.receivedRow]}>
                {!isSent && <Image source={avatarSource} style={styles.avatar} />}
                <View style={styles.contentAndMetaContainer}>
                    <View style={styles.nameAndPinContainer}>
                         {/* --- PIN INDICATOR --- */}
                        {message.pinnedInfo && (
                            <Ionicons name="pin" size={12} color="#6B7280" style={styles.pinIcon} />
                        )}
                        <Text style={[styles.senderName, isSent ? styles.sentName : styles.receivedName]} numberOfLines={1}>
                            {message.senderInfo?.name ?? 'Unknown'} {/* Add fallback */}
                        </Text>
                    </View>

                    {/* --- REPLY PREVIEW (If this message is a reply) --- */}
                    {message.replyTo && (
                        <View style={[styles.replyPreviewBubble, isSent ? styles.sentReplyPreview : styles.receivedReplyPreview]}>
                            <Text style={styles.replyPreviewSender} numberOfLines={1}>
                                {message.replyTo.senderInfo?.userName ?? 'Unknown'}
                            </Text>
                            <Text style={styles.replyPreviewContent} numberOfLines={1}>
                                {message.replyTo.type === 'image' ? '📷 Image' : message.replyTo.content}
                            </Text>
                        </View>
                    )}

                    {/* Bubble and Timestamp */}
                    <View style={[ styles.messageContainer, isSent ? styles.sentContainer : styles.receivedContainer ]}>
                        <View style={[styles.bubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
                           {/* Content rendering */}
                            {message.type === 'text' ? (
                            <Text style={isSent ? styles.sentText : styles.receivedText}>{message.content}</Text>
                        ) : message.type === 'image' ? (
                            handleArr(message.content).map((uri, index) => (
                            <TouchableOpacity onPress={() => navigation.navigate("FullImageScreen", { uri: uri })} key={index}>
                                <Image source={{ uri: uri }} style={styles.imageMessage} resizeMode="contain" />
                            </TouchableOpacity>))
                        ) : message.type === 'file' ? (
                            handleFileNameArr(message.filename).map((fileName, index) => (
                              <TouchableOpacity key={index} onPress={() => openGoogleDocs(handleArr(message.content)[index])}>  
                               <FontAwesome name={getFileIconFromUrl(handleArr(message.content)[index]) as any} size={32} color="#555" style={styles.fileIcon} />
                                    <Text style={styles.fileMessage} key={index}>{fileName}</Text>
                                </TouchableOpacity>))
                        ) : message.type === 'link' ? (
                            handleArr(message.content).map((link, index) => (
                            <TouchableOpacity onPress={() => openLinks(link)} key={index}>
                                <Text style={styles.linkMessage} >{link}</Text>
                            </TouchableOpacity>))
                        )
                        : (
                            <Text style={styles.unsupportedText}>[Tin nhắn không được hỗ trợ]</Text>
                        )}
                        </View>
                        <Text style={[styles.timestamp, isSent ? styles.sentTimestamp : styles.receivedTimestamp]}>
                            {time}
                        </Text>
                    </View>
                </View>
                {isSent && <Image source={avatarSource} style={styles.avatar} />}
            </View>
        </TouchableOpacity>
    );
};

// --- Reply Bar Component ---
const ReplyBar = ({ message, onCancel }: { message: ItemMessage; onCancel: () => void }) => {
    return (
        <View style={styles.replyBarContainer}>
            <View style={styles.replyBarContent}>
                 <Ionicons name="arrow-undo" size={16} color="#6B7280" style={styles.replyIcon} />
                 <View style={styles.replyTextContainer}>
                    <Text style={styles.replyBarSender} numberOfLines={1}>
                        Reply to {message.senderInfo?.name ?? 'Unknown'}
                    </Text>
                    <Text style={styles.replyBarMessage} numberOfLines={1}>
                        {message.type === 'image' ? '📷 Image' : message.content}
                    </Text>
                 </View>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.cancelReplyButton}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
        </View>
    );
};

// --- Interface for Modal Actions ---
interface ActionItem {
    text: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color?: string;
}


// --- Màn hình chính ---
export default function MessageScreen() {
   
    // State cho Modal hành động tin nhắn
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ItemMessage | null>(null);
    const [pinnedModalVisible, setPinnedModalVisible] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { chat } = route.params as { chat: { _id: string, name: string, avatar: string } };
    // Sử dụng hook
    const { 
      // States
        loading,
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

        // Functions
        loadMoreMessages ,
        sendMessageText,
        handleSendMessageText,
        handleSendReply,
        handleSendMessageImage,

        // Setters
        setNewMessage,
        setMessages, 
        setReplyingTo,
        setFile,
        setImage,
        setFileName,
        setImageName

    } = useMessages(chat._id);

   

    const scrollToMessage = (messageId: string) => {
        if (!flatListRef.current || !messages || messages.length === 0) {
            console.warn("FlatList ref or messages not available for scrolling.");
            return;
        }
        const messageIndex = messages.findIndex(msg => msg._id === messageId);

        if (messageIndex !== -1) {
            console.log(`Scrolling to message ID ${messageId} at index ${messageIndex}`);
            flatListRef.current.scrollToIndex({
                animated: true,
                index: messageIndex,
            });
        } else {
            console.warn(`Message with ID ${messageId} not found in the currently loaded messages.`);
        }
    };



   const pickMultipleFiles = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({
        multiple: true, // Allow multiple files
        copyToCacheDirectory: true, // Recommended
      });
      console.log("Multi-file pick result:", result);
      if (result.canceled) {
        console.log('User cancelled file picker');
        return;
      }
      if (result.assets && result.assets.length > 0) {
        console.log("Selected Files:", result.assets);
        setFile(result.assets);
        setFileName(result.assets.map(asset => asset.name)); 
      }
    } catch (err) {
      console.error("Error picking files:", err);
    }
  };
const pickMultipleImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsMultipleSelection: true, 
      quality: 0.8,
    });

    if (!result.canceled) {
       if (result.assets && result.assets.length > 0) {
          console.log("Selected URIs:", result.assets);
          setImage(result.assets); // Lưu mảng các assets
          setImageName(result.assets.map(asset => asset.uri)); // Hiển thị ảnh đầu tiên làm preview (ví dụ)
       }
    }
  };

  const handleSendMessage = async() => {
    if (image != null) {
        try {
            await handleSendMessageImage(chat._id, image);
        } catch (error) {
            console.error("Error sending image message:", error);
        }
    } else if (file != null) {
        try {
            // await sendMessageFile(chat._id, file);
            setFile(null);
            setFileName(null);
        } catch (error) {
            console.error("Error sending file message:", error);
        }
    } else if (newMessage.trim().length > 0) {

        await handleSendMessageText(chat._id, newMessage.trim());
    }
  };


    


   // --- Start Reply Handler ---
    const handleStartReply = (messageToReply: ItemMessage) => {
        setReplyingTo(messageToReply);
        // Optionally focus the TextInput here
    };

    // --- Cancel Reply Handler ---
    const handleCancelReply = () => {
        setReplyingTo(null);
    };

    // --- Modal Handlers ---
    const handleShowActions = (message: ItemMessage) => {
        setSelectedMessage(message);
        setModalVisible(true);
    };
    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedMessage(null);
    };
    // --- THÊM: Hàm mở/đóng Modal tin nhắn ghim ---
    const handleOpenPinnedModal = () => setPinnedModalVisible(true);
    const handleClosePinnedModal = () => setPinnedModalVisible(false);
    const handleStartReplyFromModal = () => {
        if (selectedMessage) handleStartReply(selectedMessage);
    };
    const handlePinMessage = () => {
        if (selectedMessage) console.log("Pin/Unpin message:", selectedMessage._id, "(Not implemented)");
        // TODO: Gọi API pin/unpin
    };
    const handleDeleteMessage = () => {
        if (selectedMessage) console.log("Delete message:", selectedMessage._id, "(Not implemented)");
         // TODO: Gọi API xóa
    }

    // --- Định nghĩa hành động cho Modal ---
    const modalActions: ActionItem[] = selectedMessage ? [
        { text: "Reply", icon: "arrow-undo-outline" as const, onPress: handleStartReplyFromModal },
        { text: selectedMessage.pinnedInfo ? "Unpin" : "Pin", icon: "pin-outline" as const, onPress: handlePinMessage },
        { text: "Delete", icon: "trash-outline" as const, onPress: handleDeleteMessage, color: '#E53E3E' }, 
    ] : [];

    
   

    // Component hiển thị loading khi tải thêm tin nhắn cũ
    const renderListHeader = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#8A8A8E" />
            </View>
        );
    };
    if (userId === null) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={styles.safeArea}>
                     <View style={styles.centeredContainer}>
                         <ActivityIndicator size="large" color="#007AFF" />
                     </View>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }
    // --- RENDER MESSAGE BUBBLE ---
     const renderMessageItem = ({ item }: { item: ItemMessage }) => (
        <MessageBubble
            message={item}
            userId={userId} // Pass userId as prop
            onShowActions={handleShowActions} // Đổi tên prop
            navigation={navigation}
        />
    );

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.safeArea}>
                <TopNavigations_Message 
                        navigation={navigation} 
                        chatPartner={{chatID: chat._id, name: chat.name, avatar: chat.avatar, isOnline: true /* Lấy trạng thái online thực tế */ }} 
                        onShowPinned={handleOpenPinnedModal} // Truyền hàm mở modal
                        hasPinnedMessages={pinnedMessages.length > 0}
                        />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Điều chỉnh nếu cần
                >
                    {/* Chỉ báo loading ban đầu */}
                    {loading && messages.length === 0 && (
                        <View style={styles.centeredContainer}>
                           <ActivityIndicator size="large" color="#007AFF" />
                        </View>
                    )}

                    {/* Hiển thị lỗi ban đầu */}
                    {error && messages.length === 0 && (
                         <View style={styles.centeredContainer}>
                           <Text style={styles.errorText}>{error}</Text>
                           {/* Có thể thêm nút Thử lại */}
                        </View>
                    )}

                    {/* Chỉ hiển thị danh sách khi không loading ban đầu HOẶC đã có sẵn tin nhắn */}
                    {(!loading || messages.length > 0) && (
                       <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessageItem}
                            keyExtractor={(item,index) => `${item._id}-${index}`}
                            style={styles.messageList}
                            contentContainerStyle={styles.listContentContainer}
                            onEndReached={loadMoreMessages}
                            onEndReachedThreshold={0.5}
                            ListHeaderComponent={renderListHeader} 
                            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                        />
                    )}
                  {/* --- Input Container with Reply Bar --- */}
                    <View style={styles.inputAreaWrapper}>
                        {replyingTo && (
                            <ReplyBar message={replyingTo} onCancel={handleCancelReply} />
                        )}  
                        {/* Hiển thị preview file/ảnh đã chọn */}
                        {(image || file) && (
                            <View style={styles.attachmentPreviewContainer}>
                                {/* TODO: Render danh sách ảnh/file nhỏ ở đây */}
                                <Text style={styles.attachmentText}>
                                     {image ? `${image.length} ảnh` : ''}
                                     {file ? `${file.length} tệp` : ''} đã chọn
                                </Text>
                                <TouchableOpacity onPress={() => { setImage(null); setFile(null); setImageName(null); setFileName(null); }} style={styles.cancelAttachmentButton}>
                                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        )}
                    {/* Khu vực nhập liệu */}
                    <View style={styles.inputContainer}>
                            <TextInput
                                    style={styles.textInput}
                                    placeholder="Nhập tin nhắn..."
                                    placeholderTextColor="#98A2B3"
                                    value={newMessage}
                                    onChangeText={setNewMessage}
                                    multiline
                            />
                            {newMessage.trim().length > 0 || image != null ? (
                                <View style={styles.attachmentContainer}>
                                    <TouchableOpacity style={styles.sendButton} onPress={() => handleSendMessage()}>
                                        <Ionicons name="paper-plane" size={22} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    {(image != null || file != null) && (
                                    <TouchableOpacity style={styles.closeButton} onPress={() => { setImage(null); setFile(null); setImageName(null); setFileName(null); }}>
                                        <Ionicons name="close-circle" size={22} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    )}
                                </View>
                            )  : (
                                <View style={styles.actionButtonsContainer}>
                                    <TouchableOpacity style={styles.actionButton}>
                                        <Ionicons name="happy-outline" size={24} color="#667085" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionButton} onPress={pickMultipleImages}>
                                        <Ionicons name="image-outline" size={24} color="#667085" />
                                    </TouchableOpacity>
                                        <TouchableOpacity style={styles.actionButton} onPress={pickMultipleFiles}>
                                            <Ionicons name="attach-outline" size={24} color="#667085" />
                                        </TouchableOpacity>
                                    {/* Thêm các nút khác nếu cần */}
                                </View>
                            )}
                    </View>
                  </View>
                </KeyboardAvoidingView>
                {/* --- Render Modal Hành Động --- */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={handleCloseModal}
                >
                    <TouchableWithoutFeedback onPress={handleCloseModal}>
                        <View style={styles.modalBackdrop} />
                    </TouchableWithoutFeedback>
                    <View style={styles.modalContent}>
                        {modalActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.modalActionButton}
                                onPress={() => { action.onPress(); handleCloseModal(); }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={action.icon} size={22} color={action.color || '#333'} style={styles.modalActionIcon} />
                                <Text style={[styles.modalActionText, { color: action.color || '#333' }]}>
                                    {action.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Modal>
                {/* --- THÊM: Modal Danh Sách Tin Nhắn Ghim --- */}
                <Modal
                    animationType="slide" // Hoặc "fade"
                    transparent={false} // Không trong suốt để che nội dung bên dưới
                    visible={pinnedModalVisible}
                    onRequestClose={handleClosePinnedModal}
                >
                    <SafeAreaView style={styles.pinnedModalContainer}>
                        {/* Header của Modal Pinned */}
                        <View style={styles.pinnedModalHeader}>
                            <TouchableOpacity onPress={handleClosePinnedModal} style={styles.pinnedCloseButton}>
                                <Ionicons name="close" size={28} color="#007AFF" />
                            </TouchableOpacity>
                            <Text style={styles.pinnedModalTitle}>Tin Nhắn Đã Ghim ({pinnedMessages.length})</Text>
                            <View style={{ width: 40 }} /> {/* Placeholder để căn giữa title */}
                        </View>

                        {/* Danh sách tin nhắn ghim */}
                        {pinnedMessages.length > 0 ? (
                            <FlatList
                                data={pinnedMessages}
                                renderItem={({ item }) => <PinnedMessageItem message={item} onCloseModal={handleClosePinnedModal} onGoToMessage={() => scrollToMessage(item._id)} />}
                                keyExtractor={item => item._id}
                                contentContainerStyle={styles.pinnedListContent}
                            />
                        ) : (
                            <View style={styles.centeredContainer}>
                                <Text style={styles.infoText}>Chưa có tin nhắn nào được ghim.</Text>
                            </View>
                        )}
                    </SafeAreaView>
                </Modal>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, backgroundColor: '#F9FAFB' }, // Màu nền khu vực chat
    messageList: { flex: 1 },
    listContentContainer: { // Style cho nội dung bên trong FlatList
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: 'red', fontSize: 16, padding: 20, textAlign: 'center' },
    loadingMoreContainer: { paddingVertical: 15, alignItems: 'center' },

    messageRow: { flexDirection: 'row', marginVertical: 8, alignItems: 'flex-end' },
    sentRow: { justifyContent: 'flex-end', paddingLeft: Dimensions.get('window').width * 0.15 },
    receivedRow: { justifyContent: 'flex-start', paddingRight: Dimensions.get('window').width * 0.15 },
    avatar: { width: 32, height: 32, borderRadius: 16, marginHorizontal: 8, marginBottom: 5 },
    contentAndMetaContainer: { maxWidth: '75%' },
    nameAndPinContainer: { // Container for Name and Pin Icon
        flexDirection: 'row',
        alignItems: 'center',
    },
    pinIcon: {
        marginRight: 4,
    },
    replyPreviewBubble: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)', // Slightly darker background
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderLeftWidth: 3,
        marginBottom: 4, // Space between reply and main bubble
        borderRadius: 8,
        maxWidth: '90%', // Limit width
    },
    sentReplyPreview: {
        borderLeftColor: '#007AFF', // Blue indicator for sent
        alignSelf: 'flex-end',
    },
    receivedReplyPreview: {
        borderLeftColor: '#8A8A8E', // Gray indicator for received
        alignSelf: 'flex-start',
    },
    replyPreviewSender: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    replyPreviewContent: {
        fontSize: 13,
        color: '#555',
    },


    // --- Input Area Wrapper (Includes Reply Bar + Input Container) ---
    inputAreaWrapper: {
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        backgroundColor: '#FFFFFF',
    },
    // --- Reply Bar Styles ---
    replyBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 8, // Add padding top
        paddingBottom: 4, // Small padding bottom
        backgroundColor: '#F2F2F7', // Slightly different background
        borderBottomWidth: 1, // Separator line
        borderBottomColor: '#E5E5EA',
    },
    replyIcon: {
        marginRight: 8,
    },
    replyBarContent: {
        flex: 1,
        flexDirection: 'row', // Align icon and text horizontally
        alignItems: 'center',
        paddingRight: 10, // Space before cancel button
    },
    replyTextContainer: {
        flex: 1, // Take remaining space
    },
    replyBarSender: {
        fontSize: 13,
        fontWeight: '600',
        color: '#007AFF',
    },
    replyBarMessage: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    cancelReplyButton: {
        padding: 5, // Make it easier to press
    },
    senderName: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    sentName: { textAlign: 'right', marginRight: 5 },
    receivedName: { textAlign: 'left', marginLeft: 5 },
    messageContainer: {},
    sentContainer: { alignItems: 'flex-end' },
    receivedContainer: { alignItems: 'flex-start' },
    bubble: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, minWidth: 40 },
    sentBubble: { backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
    receivedBubble: { backgroundColor: '#E5E5EA', borderBottomLeftRadius: 4 },
    sentText: { color: '#FFFFFF', fontSize: 15 },
    receivedText: { color: '#1C1C1E', fontSize: 15 },
    imageMessage: { width: Dimensions.get('window').width * 0.6, height: 200, borderRadius: 10 },
    fileMessage: { color: '#1C1C1E', fontSize: 15, textDecorationLine: 'underline' },
    unsupportedText: { color: '#8A8A8E', fontSize: 14, fontStyle: 'italic' },
    timestamp: { fontSize: 11, color: '#8A8A8E', marginTop: 5 },
    sentTimestamp: { marginRight: 5 },
    receivedTimestamp: { marginLeft: 5 },
     fileIcon: {
        marginRight: 15,
    },
    linkMessage: { color: '#0645AD', fontSize: 15, textDecorationLine: 'underline' },
    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E5E5EA', backgroundColor: '#FFFFFF' },
    textInput: { flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, marginRight: 8 },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
    closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    actionButtonsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    attachmentContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    actionButton: { padding: 8 },
    // --- Attachment Preview ---
    attachmentPreviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F2F2F7',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    attachmentText: {
        flex: 1,
        fontSize: 14,
        color: '#6B7280',
    },
    cancelAttachmentButton: {
        paddingLeft: 10, // Thêm padding để dễ bấm hơn
    },
    // --- Modal Styles ---
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
    modalContent: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 15, borderTopRightRadius: 15, paddingVertical: 10, paddingHorizontal: 15, paddingBottom: 30, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 10 },
    modalActionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
    modalActionIcon: { marginRight: 15, width: 25, textAlign: 'center' },
    modalActionText: { fontSize: 17, fontWeight: '500' },
    // --- THÊM: Styles cho Pinned Messages Modal ---
    pinnedModalContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB', // Nền giống màn hình chat
    },
    pinnedModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        backgroundColor: '#FFFFFF', // Nền header trắng
    },
    pinnedCloseButton: {
        padding: 5, // Tăng vùng chạm
    },
    pinnedModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    pinnedListContent: {
        padding: 16,
    },
    pinnedItemContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    pinnedItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    pinnedAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 10,
    },
    pinnedSenderName: {
        flex: 1, // Để tên co giãn
        fontSize: 15,
        fontWeight: '600',
        color: '#1C1C1E',
        marginRight: 8,
    },
    pinnedTimestamp: {
        fontSize: 13,
        color: '#8A8A8E',
    },
    pinnedContent: {
        fontSize: 15,
        color: '#3C3C43',
        marginBottom: 8,
    },
    pinnedByText: {
        fontSize: 12,
        color: '#AEAEB2',
        marginTop: 4,
        textAlign: 'right',
    },
    infoText: { // Dùng lại style này cho modal rỗng
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },

});