import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
        // Thêm style nền ở đây để phủ cả status bar
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Điểm danh</Text>

                {/* * 1. Di chuyển vào trong <View>
                  * 2. Dùng && cho gọn
                  * 3. Thêm style mới để định vị
                */}
                {isParent && (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={handleOpenStudentModal}
                    >
                        {/* 3. Đổi màu icon cho hợp với nền */}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: "#6e2febff", // Đưa màu nền ra đây
    },
    container: {
        position: "relative", // Cần thiết để `iconButton` chạy theo
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center", // Giữ nguyên để căn giữa title
        padding: 12,
        backgroundColor: "#6e2febff", // Vẫn giữ màu ở đây
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        color: "#e5f0f0ff",
    },
    // STYLE MỚI CHO ICON
    iconButton: {
        position: "absolute", // Định vị tuyệt đối
        right: 12,            // Căn lề phải
        padding: 4,           // Tăng vùng nhấn
        justifyContent: "center",
        alignItems: "center",
    },
});