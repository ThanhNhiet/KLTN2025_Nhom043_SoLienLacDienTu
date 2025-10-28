import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import TopNavigations_Chat from '@/src/components/navigations/TopNavigations_Chat';
import { useChat } from '@/src/services/useapi/chat/UseChat';

// --- Interfaces không đổi ---
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
type ChatItemProps = {
    item: ChatItemType;
    onPress: () => void;
};

// --- Component ChatItem (không đổi logic, chỉ áp dụng style mới) ---
const ChatItem = ({ item, onPress }: ChatItemProps) => {

    const formatTimeUTC = (dateString: string) => {
        // Tách chuỗi đầu vào thành các phần ngày và giờ
        const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
        if (!parts) {
            return "Invalid Date"; // Trả về nếu định dạng sai
        }
        
        // Tạo đối tượng Date từ các phần đã tách (tháng trong JS bắt đầu từ 0)
        // parts[0] là toàn bộ chuỗi, parts[1] là ngày, [2] là tháng, [3] là năm, ...
        const date = new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]), Number(parts[4]), Number(parts[5]), Number(parts[6]));

        const today = new Date();

        // So sánh ngày, tháng, năm của 2 ngày
        const isToday = date.getDate() === today.getDate() &&
                        date.getMonth() === today.getMonth() &&
                        date.getFullYear() === today.getFullYear();

        if (isToday) {
            // Nếu là hôm nay, chỉ hiển thị giờ và phút
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        } else {
            // Nếu không phải hôm nay, hiển thị ngày/tháng
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // +1 vì tháng bắt đầu từ 0
            return `${day}/${month}`;
        }
    };

    return (
        <TouchableOpacity style={styles.itemContainer} onPress={onPress} activeOpacity={0.7}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.contentContainer}>
                <View style={styles.textContainer}>
                    <Text style={[styles.userName, item.lastMessage && !item.unread && styles.userNameUnread]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text
                        style={[styles.lastMessage, item.lastMessage && !item.unread && styles.lastMessageUnread]}
                        numberOfLines={1}
                    >
                        {item.lastMessage?.content ?? "Chưa có tin nhắn"}
                    </Text>
                </View>
                <View style={styles.metaContainer}>
                    <Text style={styles.time}>{item.lastMessage ? formatTimeUTC(item.lastMessage.createdAt) : ""}</Text>
                    {item.lastMessage && !item.unread && (
                        <View style={styles.unreadBadge}>
                            {/* Bạn có thể thay isUnread bằng item.unreadCount nếu có */}
                            <Text style={styles.unreadText}>1</Text> 
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default function ChatScreen() {
    const navigation = useNavigation<any>();
    // THAY ĐỔI: Thêm hàm `refetch` từ custom hook (giả sử hook có hỗ trợ)
    const { chats, loading, error, refetch } = useChat();
    const [refreshing, setRefreshing] = useState(false);

    // THAY ĐỔI: Thêm hàm onRefresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refetch(); // Gọi hàm fetch lại dữ liệu
        } catch (e) {
            console.error("Failed to refresh chats:", e);
        }
        setRefreshing(false);
    }, [refetch]);


    const handlePressChat = (chat: ChatItemType) => {
        navigation.navigate("MessageScreen", { chat });
    };

    const renderChatItem = ({ item }: { item: ChatItemType }) => (
        <ChatItem item={item} onPress={() => handlePressChat(item)} />
    );

    const renderList = () => {
        if (loading && chats.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            );
        }

        if (error && chats.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    {/* (Gợi ý) Bạn có thể thêm Icon ở đây */}
                    <Text style={styles.errorText}>Đã có lỗi xảy ra</Text>
                    <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (!loading && chats.length === 0) {
            return (
                <View style={styles.centerContainer}>
                     {/* (Gợi ý) Bạn có thể thêm Icon ở đây */}
                    <Text style={styles.emptyText}>Hộp thư của bạn trống</Text>
                    <Text style={styles.emptySubText}>Bắt đầu cuộc trò chuyện mới ngay!</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={chats}
                renderItem={renderChatItem}
                keyExtractor={(item) => item._id}
                style={styles.list}
                contentContainerStyle={{ paddingBottom: 20 }} // Thêm padding dưới
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#007AFF"]} // (Tùy chọn) Màu của spinner
                    />
                }
            />
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.safeArea}>
                <TopNavigations_Chat navigation={navigation} name='Tin nhắn' onRefresh={onRefresh} />
                {renderList()}
            </SafeAreaView>
        </SafeAreaProvider>
    );
};


// ========= STYLESHEET ĐÃ ĐƯỢC TINH CHỈNH =========
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    list: {
        flex: 1,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginVertical: 6, // THAY ĐỔI: Giảm khoảng cách dọc một chút
        borderRadius: 12,
        padding: 16, // THAY ĐỔI: Tăng padding bên trong thẻ
        // TINH CHỈNH: Shadow mềm mại và hiện đại hơn
        shadowColor: "#475569",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 16, // THAY ĐỔI: Tăng khoảng cách
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
        marginRight: 12, // THAY ĐỔI: Tăng khoảng cách
        justifyContent: 'center',
    },
    userName: {
        fontSize: 17, // THAY ĐỔI: Tăng kích thước font
        fontWeight: '600',
        color: '#1F2937',
    },
    userNameUnread: {
        fontWeight: '700',
    },
    lastMessage: {
        fontSize: 15, // THAY ĐỔI: Tăng kích thước font
        color: '#6B7280',
        marginTop: 5,
    },
    lastMessageUnread: {
        color: '#111827', // THAY ĐỔI: Đậm hơn
        fontWeight: '600',
    },
    metaContainer: {
        alignItems: 'flex-end',
        justifyContent: 'space-between', // THAY ĐỔI: Căn đều thời gian và badge
        paddingVertical: 2,
    },
    time: {
        fontSize: 13, // THAY ĐỔI: Tăng kích thước font
        color: '#9CA3AF',
    },
    unreadBadge: {
        backgroundColor: '#007AFF', // THAY ĐỔI: Dùng màu xanh dương khác
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        borderWidth: 2, // THÊM: Viền trắng để nổi bật hơn
        borderColor: '#FFFFFF',
    },
    unreadText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        backgroundColor: '#007AFF',
        borderRadius: 10,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
    }
});