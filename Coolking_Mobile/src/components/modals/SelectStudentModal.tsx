import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Image,
    TouchableWithoutFeedback, // Thêm component này
} from 'react-native';

// Bạn nên định nghĩa kiểu dữ liệu cho student thay vì dùng 'any' nếu có thể
type Student = {
   // avatar: string;
    name: string;
    student_id: string;
    };

const SelectStudentModal = ({ visible, onClose, students, onSelectStudent}: { visible: boolean; onClose: () => void; students: Student[]; onSelectStudent: (student: Student) => void;}) => {

    // Tạo hàm render item riêng cho FlatList
    const renderStudentItem = ({ item, index }: { item: Student, index: number }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => {
                onSelectStudent(item);
                onClose();
            }}
        >
            {/* <Image
                source={{ uri: item.avatar || 'https://placehold.co/100x100/E2E8F0/333?text=No+Image' }}
                style={styles.avatar}
                // Thêm một màu nền dự phòng
                defaultSource={require('../../assets/images/logo.jpg')} // Bạn cần có 1 ảnh default
            /> */}
            <Text style={styles.itemName}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            {/* Lớp nền mờ, bấm vào sẽ đóng modal */}
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPressOut={onClose}
            >
                {/* Dùng TouchableWithoutFeedback để ngăn việc bấm vào content làm đóng modal */}
                <TouchableWithoutFeedback>
                    <View style={styles.modalContainer}>
                        <Text style={styles.title}>Chọn học sinh</Text>
                        
                        <FlatList
                            data={students}
                            renderItem={renderStudentItem}
                            // Sử dụng id của student làm key, nếu không có thì dùng index
                            keyExtractor={(item, index) => item.student_id || `student-${index}`}
                            style={styles.list}
                            // Thêm đường kẻ phân cách
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />

                        {/* Thêm nút đóng */}
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </Modal>
    );
};

// Sử dụng StyleSheet để quản lý CSS
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 12, // Bo góc mềm mại hơn
        padding: 20,
        width: '90%', // Rộng hơn một chút
        maxHeight: '70%', // Giới hạn chiều cao tối đa
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    list: {
        // FlatList sẽ tự động chiếm không gian
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 16,
        backgroundColor: '#eee', // Màu nền chờ khi ảnh đang tải
    },
    itemName: {
        fontSize: 16,
        color: '#333',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0', // Màu đường kẻ nhạt
    },
    closeButton: {
        marginTop: 16,
        backgroundColor: '#f1f1f1',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    }
});

export default SelectStudentModal;