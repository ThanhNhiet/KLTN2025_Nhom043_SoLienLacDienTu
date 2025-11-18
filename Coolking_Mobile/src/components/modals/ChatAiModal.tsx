import React, { useState } from 'react';
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
    // Giả sử 'userId' là ID của người dùng hiện tại
    const isUser = item.senderInfo.userID === userId; 

    // --- 1. Tin nhắn của USER (bạn) ---
    // (Giữ nguyên, không có avatar, căn phải)
    if (isUser) {
      return (
        <View style={[styles.msgBox, styles.userMsg]}>
          <Text style={styles.userText}>{item.content}</Text>
        </View>
      );
    }

    // --- 2. Tin nhắn của AI / NGƯỜI KHÁC ---
    // (Thêm avatar và tên, căn trái)
    return (
      <View style={styles.aiMessageWrapper}>
        
        {/* Avatar */}
        <Image
          source={{ uri: item.senderInfo.avatar || 'https://via.placeholder.com/40' }} // Cần 1 ảnh dự phòng
          style={styles.avatar}
        />
        
        {/* Cụm Tên + Bong bóng chat */}
        <View style={styles.messageContentWrapper}>
          
          {/* Tên người gửi */}
          <Text style={styles.senderName}>{item.senderInfo.name}</Text>
          
          {/* Bong bóng chat */}
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
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
          >
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item._id}
              style={styles.list}
              contentContainerStyle={{ paddingBottom: 20 }}
              onEndReached={loadMoreMessages} 
              
              // 2. Ngưỡng kích hoạt (cách đỉnh 50%)
              onEndReachedThreshold={0.5} 
              
              // 3. Hiển thị spinner ở ĐỈNH (vì list 'inverted')
              ListFooterComponent={renderLoadingFooter}
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
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    color: '#000',
  },
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
});

export default ChatAiModal;