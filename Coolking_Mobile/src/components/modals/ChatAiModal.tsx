import React, { useState,useEffect,useCallback,useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
    Image,
 ActivityIndicator,
 NativeSyntheticEvent,
 NativeScrollEvent
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useMessageAi } from '@/src/services/useapi/chat/UseMessageAi';

// --- (Interfaces giữ nguyên) ---
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
type ChatAiModalProps = {
  visible: boolean;
  onClose: () => void;
    chatId: string;
};

const ChatAiModal = ({ visible, onClose, chatId }: ChatAiModalProps) => {
  const flatListRef = useRef<FlatList<ItemMessage>>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  
  // --- 1. State chỉ lưu 1 FAQ (hoặc null) ---
 
  
  const { loading,
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
        selectedFaq,



        setInput,
        setSelectedFaq,

        fetchFaqSections,
        loadMoreMessages, 
        handleSendPress,
    } = useMessageAi(chatId);

     const lastLoadTime = useRef(0);
    const loadingTriggered = useRef(false);
    const previousScrollY = useRef(0);
    const isFirstLoad = useRef(true);
    
    // FIX: Đơn giản hóa logic load more
    const handleLoadMore = useCallback(() => {
        const now = Date.now();
        
        // Kiểm tra tất cả điều kiện
        if (loadingMore || !hasMore || loadingTriggered.current) {
            return;
        }
        
        // Kiểm tra timing
        if (now - lastLoadTime.current < 1500) {
            return;
        }
        
        loadingTriggered.current = true;
        lastLoadTime.current = now;
        console.log("✅ Loading more messages...");
        
        loadMoreMessages();
        
        // Reset flag sau 2 giây
        setTimeout(() => {
            loadingTriggered.current = false;
        }, 2000);
    }, [loadingMore, hasMore, loadMoreMessages]);
    
    // FIX: Cải thiện scroll detection
    const handleOnScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        
        // Kiểm tra đã đến đáy hay chưa
        const isAtBottomNow = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
        setIsAtBottom(isAtBottomNow);
        
        // Chỉ load more khi scroll lên gần top
        const currentScrollY = contentOffset.y;
        const isScrollingUp = currentScrollY < previousScrollY.current;
        previousScrollY.current = currentScrollY;
        
        // Load khi gần top
        const isNearTop = currentScrollY < 50 && contentSize.height > layoutMeasurement.height;
        
        if (isScrollingUp && isNearTop && hasMore && !loadingMore && !loadingTriggered.current) {
            console.log("📍 Near top - triggering load more");
            handleLoadMore();
        }
    }, [hasMore, loadingMore, handleLoadMore]);
    
    // Scroll to end khi load xong
    useEffect(() => {
        if (isFirstLoad.current && messages.length > 0 && !loading) {
            const timer = setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
                isFirstLoad.current = false;
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [messages.length, loading]);

  // --- 4. Hàm xử lý khi nhấn FAQ (Đã cập nhật) ---
  const handleFaqPress = (faqText: string) => {
    setSelectedFaq(prevSelected => {
      return prevSelected === faqText ? null : faqText;
    });
  };

  // --- (renderMessage giữ nguyên) ---
  const renderLoadingFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 10 }}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  const renderMessage = ({ item }: { item: ItemMessage }) => {
  const isUser = item.senderInfo.userID === userId; 

  if (isUser) {
    return (
      <View style={[styles.userMessageWrapper]}>
        {/* Cụm Tên + Bong bóp chat */}
        <View style={styles.userMessageContentWrapper}>
          {/* Tên người gửi */}
          <Text style={styles.userSenderName}>{item.senderInfo.name}</Text>
          
          {/* Bong bóp chat */}
          <View style={[styles.msgBox, styles.userMsg]}>
            <Text style={styles.userText}>{item.content}</Text>
          </View>
        </View>

        {/* Avatar bên phải */}
        <Image
          source={{ uri: item.senderInfo.avatar || 'https://via.placeholder.com/40' }}
          style={styles.userAvatar}
        />
      </View>
    );
  }

  // AI message (giữ nguyên)
  return (
    <View style={styles.aiMessageWrapper}>
      <Image
        source={{ uri: item.senderInfo.avatar || 'https://via.placeholder.com/40' }}
        style={styles.avatar}
      />
      
      <View style={styles.messageContentWrapper}>
        <Text style={styles.senderName}>{item.senderInfo.name}</Text>
        <View style={[styles.msgBox, styles.aiMsg]}>
          <Text style={styles.aiText}>{item.content}</Text>
        </View>
      </View>
    </View>
  );
};

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          
          {/* Header (giữ nguyên) */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Trợ lý AI</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Đóng</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
          >
           <FlatList
                                           ref={flatListRef}
                                           data={messages}
                                           keyExtractor={(item, index) => `${item._id}-${index}`}
                                           renderItem={({ item }) => (
                                                renderMessage({ item })
                                               
                                           )}
                                           onScroll={handleOnScroll}
                                           scrollEventThrottle={1000}
                                           scrollEnabled={true}
                                           nestedScrollEnabled={true}
                                           style={styles.messageList}
                                           contentContainerStyle={{
                                               paddingVertical: 10,
                                               paddingHorizontal: 10,
                                               flexGrow: 1,
                                               justifyContent: 'flex-end'
                                           }}
                                           ListHeaderComponent={() => {
                                               if (!loadingMore) return null;
                                               return (
                                                   <View style={styles.loadingMoreContainer}>
                                                       <ActivityIndicator size="small" color="#007AFF" />
                                                   </View>
                                               );
                                           }}
                                           maintainVisibleContentPosition={{
                                               minIndexForVisible: 0,
                                               autoscrollToTopThreshold: 50
                                           }}
                                           onContentSizeChange={() => {
                                               if (!isFirstLoad.current && isAtBottom) {
                                                   flatListRef.current?.scrollToEnd({ animated: true });
                                               }
                                           }}
                                       />

            {/* --- 5. KHUNG FAQ (Cập nhật logic `isSelected`) --- */}
            <View style={styles.faqContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {faqSections.map((faq, index) => {
                  // Kiểm tra xem chip này có đang được chọn không
                  const isSelected = selectedFaq === faq; // <-- Chỉ so sánh bằng
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.faqChip, 
                        isSelected && styles.faqChipSelected
                      ]}
                      onPress={() => handleFaqPress(faq)}
                    >
                      {isSelected && <Text style={styles.faqCheck}>✅ </Text>}
                      <Text style={[
                        styles.faqChipText,
                        isSelected && styles.faqChipTextSelected
                      ]}>
                        {faq}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Input Container (giữ nguyên) */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Hoặc nhập câu hỏi..."
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendPress}>
                <Text style={styles.sendText}>Gửi</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

// --- (Styles giữ nguyên) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  closeButton: { padding: 5 },
  closeText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  keyboardView: { flex: 1 },
  list: { flex: 1, paddingHorizontal: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E5E5EA', backgroundColor: '#FFFFFF' },
  input: { flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, marginRight: 8 },
  sendBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendText: { color: '#fff', fontWeight: 'bold' },
  faqContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    paddingLeft: 10,
  },
  faqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  faqChipText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '500',
  },
  faqChipSelected: {
    backgroundColor: '#E0EFFF',
    borderColor: '#007AFF',
  },
  faqChipTextSelected: {
    color: '#0056b3',
    fontWeight: '600',
  },
  faqCheck: {
    fontSize: 10,
  },
  aiMessageWrapper: {
        flexDirection: 'row',     // Xếp Avatar và nội dung theo hàng ngang
        alignSelf: 'flex-start',  // Căn toàn bộ sang trái
        marginBottom: 10,         // Giữ khoảng cách với tin nhắn dưới
        maxWidth: '85%',          // Giới hạn chiều rộng
    },
    loadingMoreContainer: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageList: {
        flex: 1,
    },
    
    // 2. Style cho Avatar
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,         // Bo tròn
        marginRight: 8,           // Khoảng cách với bong bóng chat
        alignSelf: 'flex-end',    // Căn avatar xuống dưới (đẹp hơn khi tên dài)
    },

    // 3. Wrapper cho Tên + Bong bóng chat
    messageContentWrapper: {
        flexDirection: 'column',  // Xếp Tên ở trên, bong bóng ở dưới
    },

    // 4. Style cho Tên người gửi (AI)
    senderName: {
        fontSize: 13,
        color: '#666',
        marginLeft: 12,           // Căn lề cho giống với bong bóng chat
        marginBottom: 3,          // Khoảng cách từ Tên xuống bong bóng
        fontWeight: '500',
    },

    // --- STYLES CŨ CỦA BẠN (Giữ nguyên) ---
    msgBox: {
        padding: 12,
        borderRadius: 18,
        // (Không set 'marginBottom' ở đây nữa, mà set ở 'aiMessageWrapper')
    },
    userMsg: {
        backgroundColor: '#007AFF',
        alignSelf: 'flex-end',
        marginBottom: 10, // User thì vẫn cần margin ở đây
    },
    aiMsg: {
        backgroundColor: '#E5E5EA',
        alignSelf: 'flex-start', // Căn bong bóng sang trái (trong 'messageContentWrapper')
    },
    userText: { 
        color: '#fff', 
        fontSize: 16 
    },
    aiText: { 
        color: '#000', 
        fontSize: 16 
    },
    userMessageWrapper: {
      flexDirection: 'row',
      alignSelf: 'flex-end',
      marginBottom: 10,
      maxWidth: '85%',
      alignItems: 'flex-end',
    },

    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginLeft: 8,
      marginRight: 8,
    },

    userMessageContentWrapper: {
      flexDirection: 'column',
      alignItems: 'flex-end',
    },

    userSenderName: {
      fontSize: 13,
      color: '#666',
      marginRight: 12,
      marginBottom: 3,
      fontWeight: '500',
    },
});

export default ChatAiModal;