import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // Đã thêm
import { useProfile } from "@/src/services/useapi/profile/UseProfile";
import SelectStudentModal from "../modals/SelectStudentModal"; // Giả sử đường dẫn này là đúng


export default function TopNavigations_Attendance({setStudentId,handleFetchAttendance}: {setStudentId: (id: string) => void,handleFetchAttendance: (id: string) => void}) {
    const { role, students } = useProfile();
    const isParent = role === "PARENT";
    const [openStudentModal, setOpenStudentModal] = useState(false);

    const handleOpenStudentModal = () => {
        setOpenStudentModal(true);
    };
    const handleSelectStudent = (student: any) => {
        const id = typeof student === "string" 
            ? student 
            : student?.student_id || student?.id;

        if (!id) {
            console.warn("[TopNav] No valid ID found in selected student");
            return;
        }
        setStudentId(id);
        handleFetchAttendance(id);
        setOpenStudentModal(false);
    };

    return (
        // Bọc trong SafeAreaView
        <SafeAreaView edges={["top"]} style={styles.safeAreaContainer}>
            <View style={styles.container}>
                
                <Text style={styles.title}>Điểm danh</Text>

                {isParent && (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={handleOpenStudentModal}
                    >
                        {/* Đảm bảo icon có màu dễ nhìn trên nền tím */}
                        <Ionicons name="people-circle-outline" size={28} color="#e5f0f0ff" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Modal nằm ngoài View là đúng */}
            <SelectStudentModal
                visible={openStudentModal}
                onClose={() => setOpenStudentModal(false)}
                students={students} // Truyền danh sách học sinh
                onSelectStudent={handleSelectStudent} // Truyền hàm xử lý
            /> 
        </SafeAreaView> // Đóng SafeAreaView
    );
}

const styles = StyleSheet.create({
    // 1. Thêm style cho SafeAreaView để quản lý màu nền Status Bar
    safeAreaContainer: {
        backgroundColor: "#6e2febff", // Màu nền của Navigation Bar
    },
    // 2. Chỉnh sửa container để nó chỉ là phần nội dung (height đã được quản lý một phần bởi SafeAreaView)
    container: {
        height: 56, // Chiều cao tiêu chuẩn cho Nav Bar nội dung
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#6e2febff",
        // Bỏ các thuộc tính shadow/borderBottom cũ để đơn giản hóa,
        // nếu muốn, có thể thêm lại vào safeAreaContainer
        // borderBottomWidth: StyleSheet.hairlineWidth,
        // borderBottomColor: "#a088ff",
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.15,
        // shadowRadius: 3,
        // elevation: 4, 
    },
    title: {
        fontSize: 18, // Tăng kích thước tiêu đề một chút
        fontWeight: "700", // Đậm hơn
        textAlign: "center",
        color: "#e5f0f0ff",
        // Đảm bảo title không bị icon bên cạnh đẩy ra khỏi trung tâm
        flex: 1, 
    },
    // STYLE CHO ICON
    iconButton: {
        position: "absolute",
        right: 12,
        padding: 8, // Tăng vùng nhấn
        zIndex: 10, // Đảm bảo nút nằm trên các thành phần khác nếu có
    },
});