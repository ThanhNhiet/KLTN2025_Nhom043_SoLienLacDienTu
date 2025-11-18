import React from "react";
import {
    View,
    StyleSheet,
    Text,
    FlatList,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import TopNavigations_AttendanceDetail from "@/src/components/navigations/TopNavigations";
import { useAttendanceDetail } from "@/src/services/useapi/attendance/UseAttendanceDetail";

// Helper function để lấy style và text cho từng trạng thái
const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
        case "PRESENT":
            return { text: "Có mặt", color: "#27ae60", backgroundColor: "#eaf7ee" };
        case "ABSENT":
            return { text: "Vắng", color: "#c0392b", backgroundColor: "#f9ebea" };
        case "LATE":
            return { text: "Trễ", color: "#f39c12", backgroundColor: "#fef5e7" };
        default:
            return { text: status, color: "#7f8c8d", backgroundColor: "#ecf0f1" };
    }
};

export default function AttendanceDetailScreen() {
    const navigation = useNavigation<any>();
    const [studentId, setStudentId] = React.useState<string | null>(null);
    const route = useRoute();
    const { courseSectionId, subjectId } = route.params as { courseSectionId: string; subjectId: string; };

    const { attendanceDetails, loading, error } = useAttendanceDetail(courseSectionId, subjectId);

    // Xử lý trạng thái đang tải
    if (loading) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    // Xử lý khi có lỗi hoặc không có dữ liệu
    if (error || !attendanceDetails) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={styles.centeredContainer}>
                    <TopNavigations_AttendanceDetail navigation={navigation} name="Chi tiết điểm danh" setStudentId={setStudentId} />
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={styles.errorText}>Không thể tải dữ liệu điểm danh.</Text>
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    const { subject_info, statistics, attendance_details } = attendanceDetails;

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.safeArea}>
                <TopNavigations_AttendanceDetail navigation={navigation} name="Chi tiết điểm danh" setStudentId={setStudentId} />
                
                <FlatList
                    data={attendance_details}
                    keyExtractor={(item, index) => `${item.date}-${index}`}
                    ListHeaderComponent={
                        <>
                            {/* Phần 1: Thông tin môn học */}
                            <View style={styles.subjectCard}>
                                <Text style={styles.subjectName}>{subject_info.subject_name}</Text>
                                <Text style={styles.facultyName}>{subject_info.faculty_name}</Text>
                            </View>

                            {/* Phần 2: Thống kê */}
                            <View style={styles.statsCard}>
                                <Text style={styles.sectionTitle}>Thống kê chuyên cần</Text>
                                <View style={styles.statsGrid}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{statistics.present}</Text>
                                        <Text style={styles.statLabel}>Có mặt</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{statistics.absent}</Text>
                                        <Text style={styles.statLabel}>Vắng</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{statistics.late}</Text>
                                        <Text style={styles.statLabel}>Trễ</Text>
                                    </View>
                                </View>
                                <View style={styles.rateContainer}>
                                    <Text style={styles.rateLabel}>Tỷ lệ chuyên cần:</Text>
                                    <Text style={styles.rateValue}>{statistics.attendance_rate}</Text>
                                </View>
                            </View>

                            {/* Phần 3: Tiêu đề danh sách */}
                            <Text style={styles.listHeader}>Lịch sử điểm danh</Text>
                        </>
                    }
                    renderItem={({ item }) => {
                        const statusInfo = getStatusStyle(item.status);
                        return (
                            <View style={styles.detailRow}>
                                <View>
                                    <Text style={styles.dateText}>{item.date}</Text>
                                    <Text style={styles.lessonText}>Tiết {item.start_lesson} - {item.end_lesson}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                                </View>
                            </View>
                        );
                    }}
                    contentContainerStyle={styles.container}
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F5F5F5",
    },
    container: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#F5F5F5",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#e74c3c',
    },
    subjectCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginTop: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    subjectName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
    },
    facultyName: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    statsCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495e',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    statLabel: {
        fontSize: 14,
        color: '#95a5a6',
        marginTop: 4,
    },
    rateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    rateLabel: {
        fontSize: 16,
        color: '#34495e',
        fontWeight: '500',
    },
    rateValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    listHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495e',
        marginBottom: 12,
        marginTop: 8,
    },
    detailRow: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    lessonText: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});