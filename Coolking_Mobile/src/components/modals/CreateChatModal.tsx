import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Keyboard,
    TouchableWithoutFeedback,
    Platform,
    Alert // Import Alert for placeholder action
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '@/src/services/useapi/chat/UseChat';


// --- Kiểu dữ liệu người dùng tìm kiếm ---
type SearchResultUser = {
    id: string; // User ID
    name: string;
    avatar: string | null;
    type: string;
};


// --- Component hiển thị kết quả tìm kiếm ---
const UserResultItem = ({ user, onCreateChat}: { user: SearchResultUser, onCreateChat: (user: SearchResultUser) => void}) => {
    
    

    return (
        <View style={styles.resultItem}>
            <Image
                source={user.avatar ? { uri: user.avatar } : { uri: "https://example.com/default-avatar.png" }} // Ảnh mặc định
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userType}>{user.type}</Text>
            </View>
            {/* THAY ĐỔI: Nút bắt đầu chat */}
            <TouchableOpacity style={styles.actionButton} onPress={() => onCreateChat(user)}>
                 {/* Có thể dùng chatbubble-outline hoặc send-outline */}
                <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
};

// --- Props cho Modal ---
interface CreateChatModalProps {
    isVisible: boolean;
    onClose: () => void;
    navigation: any; // Thêm navigation nếu cần thiết
    onRefresh:()=> void; 
}

// --- Component Modal ---
export default function CreateChatModal({ isVisible, onClose, navigation ,onRefresh}: CreateChatModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResultUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { searchUsers, createPrivateChat,refetch} = useChat();

    // --- Hàm tìm kiếm người dùng (API call) ---
    const getsearchUsers = useCallback(async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        setError(null);
        
        try {
            const users = await searchUsers(query);
            setResults(users);
        } catch (err) {
            console.error("Search users error:", err);
            setError("Không thể tìm kiếm người dùng.");
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [searchUsers]);

    // --- Debounce search ---
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            getsearchUsers(searchQuery);
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, getsearchUsers]);


    // --- THAY ĐỔI: Hàm xử lý khi nhấn nút tạo chat ---
    const handleCreateChat = async (user: SearchResultUser) => {
        Alert.alert("Bắt đầu trò chuyện", `Tạo cuộc trò chuyện với ${user.name}?`, [
            {
                text: "Hủy",
                style: "cancel",
            },
            {
                text: "Xác nhận",
                onPress: async () => {
                    const chat = await createPrivateChat(user.id);
                    if (chat.success) {
                        Alert.alert("Thành công", chat.message || `Cuộc trò chuyện với ${user.name} đã được tạo.`);
                    }
                },
            },
        ]);
        await refetch();
        //await onRefresh(); // Cập nhật lại danh sách chat
        handleClose(); // Đóng modal sau khi chọn
    };

    // --- Hàm đóng modal ---
    const handleClose = () => {
        setSearchQuery(''); setResults([]); setError(null); setLoading(false);
        onClose();
    };

    // --- Render nội dung danh sách ---
    const renderContent = () => {
        if (loading) return <ActivityIndicator size="large" color="#007AFF" style={styles.indicator} />;
        if (error) return <Text style={styles.infoText}>{error}</Text>;
        if (searchQuery.trim() && results.length === 0 && !loading) return <Text style={styles.infoText}>Không tìm thấy người dùng nào.</Text>;
        if (!searchQuery.trim()) return <Text style={styles.infoText}>Nhập tên để tìm người trò chuyện.</Text>;
        return (
            <FlatList
                data={results}
                renderItem={({ item }) => <UserResultItem user={item} onCreateChat={handleCreateChat} />}
                keyExtractor={(item) => item.id}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={Keyboard.dismiss}
            />
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
                <TouchableWithoutFeedback onPress={handleClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>
                <View style={styles.modalWrapper}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            {/* THAY ĐỔI: Tiêu đề */}
                            <Text style={styles.modalTitle}>Tạo cuộc trò chuyện</Text>
                            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                <Ionicons name="close-circle" size={28} color="#AEAEB2" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Tìm kiếm người dùng..." // THAY ĐỔI: Placeholder
                                placeholderTextColor="#8E8E93"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus={true}
                                clearButtonMode="while-editing"
                            />
                        </View>

                        {/* Results Area */}
                        <View style={styles.resultsContainer}>
                            {renderContent()}
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        flex: 1,
    },
    modalWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        width: '90%',
        height: '70%',
        paddingTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
    },
    modalTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
    closeButton: { position: 'absolute', right: 16, top: -4, padding: 5 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10,
        marginHorizontal: 16, marginTop: 16, marginBottom: 8, paddingHorizontal: 10,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, color: '#1C1C1E' },
    resultsContainer: { flex: 1 },
    list: { flex: 1 },
    indicator: { marginTop: 30 },
    infoText: { marginTop: 30, fontSize: 16, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 20 },
    resultItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
    },
    avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
    userInfo: {
        flex: 1,
        marginRight: 10,
    },
    userName: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1C1C1E', marginRight: 10 },
    userType: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 2,
    },
    // THAY ĐỔI: Style cho nút action (có thể giữ tên cũ hoặc đổi)
    actionButton: { backgroundColor: '#007AFF', borderRadius: 18, padding: 8 },
});
