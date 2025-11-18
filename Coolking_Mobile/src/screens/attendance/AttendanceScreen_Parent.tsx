import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    SectionList,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "@/src/components/navigations/BottomNavigations";
import TopNavigations_Attendance from "@/src/components/navigations/TopNavigations_Attendance";
import { useAttendance_Parent } from "@/src/services/useapi/attendance/UseAttendance_Parent";


interface CourseSection { 
    subject_info: SubjectInfo; 
    statistics: Statistics; 
    attendance_details: AttendanceDetail[]; 
}
interface SubjectInfo { 
    course_section_id: string; 
    faculty_name: string; 
    subject_name: string; 
    session: string; 
}
interface Statistics { 
    absent: number; 
    attendance_rate: 
    string; late: number; 
    present: number; 
    total_sessions: number; 
}

interface AttendanceDetail { 
    date: string; 
    description: string; 
    end_lesson: number; 
    start_lesson: number; 
    status: string; 
}

const CourseSectionCard = ({ item }: { item: CourseSection }) => {
    const { subject_info, statistics } = item;
    const rate = parseFloat(statistics.attendance_rate);

    const getRateColor = () => {
        if (rate >= 80) return '#27ae60';
        if (rate >= 50) return '#f39c12';
        return '#c0392b';
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.subjectName}>{subject_info.subject_name}</Text>
                <View style={[styles.rateBadge, { backgroundColor: getRateColor() }]}>
                    <Text style={styles.rateText}>{statistics.attendance_rate}</Text>
                </View>
            </View>
            <View style={styles.statsContainer}>
                <Text style={styles.statText}>Có mặt: <Text style={styles.bold}>{statistics.present}</Text></Text>
                <Text style={styles.statText}>Vắng: <Text style={styles.bold}>{statistics.absent}</Text></Text>
                <Text style={styles.statText}>Trễ: <Text style={styles.bold}>{statistics.late}</Text></Text>
            </View>
        </View>
    );
};

// --- Màn hình chính ---
export default function AttendanceScreen_Parent() {
    const navigation = useNavigation<any>();
    const [studentId, setStudentId] = useState<string | null>(null);
    const { attendanceDetails, loading, error, page, setPage, totalPages, fetchAttendanceDetails, pageSize } = useAttendance_Parent(studentId);

    const handleFetchAttendance = (id: string) => {
        fetchAttendanceDetails(id, page, pageSize);
    }
    const handlePageChange = (newPage: number) => {
        if (totalPages !== null && newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };
    const handlePrev = () => handlePageChange(page - 1);
    const handleNext = () => handlePageChange(page + 1);
    const hookGoToPage = (pageNumber: number) => handlePageChange(pageNumber);
    const isPrevDisabled = page === 1;
    const isNextDisabled = page === totalPages;
    const visiblePages = Array.from({ length: totalPages ?? 0 }, (_, i) => i + 1);


    // xu ly du lieu
    const sections = useMemo(() => {
        if (!attendanceDetails?.data?.course_sections) {
            console.log("No course sections found");
            return [];
        }
        
        const grouped = attendanceDetails.data.course_sections.reduce((acc, course) => {
            const session = course.subject_info.session;
            if (!acc[session]) acc[session] = [];
            acc[session].push(course);
            return acc;
        }, {} as Record<string, CourseSection[]>);
        
        return Object.keys(grouped).map(session => ({ 
            title: session, 
            data: grouped[session] 
        }));
    }, [attendanceDetails?.data]);

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.infoText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }
    // if (error || children.length === 0) {
    //     return (
    //         <SafeAreaProvider>
    //             <SafeAreaView style={styles.safeArea}>
    //                 <TopNavigations_Attendance />
    //                 <View style={styles.centeredContainer}>
    //                     <Text style={styles.infoText}>Không thể tải dữ liệu.</Text>
    //                 </View>
    //                 <View style={styles.bottomWrapper}><BottomNavigation navigation={navigation} /></View>
    //             </SafeAreaView>
    //         </SafeAreaProvider>
    //     );
    // }

    const renderPagination = () => {
        if (!totalPages || totalPages < 1) return null;
        return (
            <View style={styles.pagination}>
                <TouchableOpacity onPress={handlePrev} style={[styles.pageBtn, isPrevDisabled && styles.disabledBtn]} disabled={isPrevDisabled}>
                    <Text style={styles.navBtnText}>Lùi</Text>
                </TouchableOpacity>
                <View style={styles.pageNumbersContainer}>
                    {visiblePages.map((num) => (
                        <TouchableOpacity key={num} onPress={() => hookGoToPage(num)} style={[styles.pageNumber, num === page && styles.activePage]}>
                            <Text style={[styles.pageNumberText, num === page && styles.activeText]}>{num}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity onPress={handleNext} style={[styles.pageBtn, isNextDisabled && styles.disabledBtn]} disabled={isNextDisabled}>
                    <Text style={styles.navBtnText}>Tiến</Text>
                </TouchableOpacity>
            </View>
        );
    };
    
    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
                <TopNavigations_Attendance 
                    setStudentId={setStudentId} 
                    handleFetchAttendance={handleFetchAttendance}
                />
                {studentId ? (
                    <>
                        {/* Change condition to check for course sections */}
                        {attendanceDetails?.data?.course_sections ? (
                            <SectionList
                                sections={sections}
                                keyExtractor={(item) => item.subject_info.course_section_id}
                                renderItem={({ item }) => <CourseSectionCard item={item} />}
                                renderSectionHeader={({ section: { title } }) => (
                                    <Text style={styles.sectionHeader}>{title}</Text>
                                )}
                                contentContainerStyle={styles.listContainer}
                                ListHeaderComponent={
                                    <Text style={styles.studentNameHeader}>
                                        Bảng chuyên cần của: {attendanceDetails.data.student_name}
                                    </Text>
                                }
                                ListFooterComponent={renderPagination}
                            />
                        ) : (
                            <View style={styles.centeredContainer}>
                                <Text style={styles.infoText}>
                                    {loading ? "Đang tải dữ liệu..." : "Không có dữ liệu chuyên cần."}
                                </Text>
                            </View>
                        )}
                    </>) : (
                    <View style={styles.contentContainer}>
                        {/* Nếu là phụ huynh mà không có học sinh nào */}
                        <Text style={styles.centeredText}>
                            Vui lòng chọn học sinh để xem điểm danh.
                        </Text>
                    </View>
                )}
                <View style={styles.bottomWrapper}>
                    <BottomNavigation navigation={navigation} />
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f0f0' },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    infoText: { fontSize: 16, color: '#666', marginTop: 10 },
    contentContainer: {
    flex: 1, // 1. Chiếm hết không gian còn lại
    justifyContent: 'center', // 2. Căn giữa theo chiều dọc
    alignItems: 'center', // 3. Căn giữa theo chiều ngang
    padding: 20,
  },
  // Style cho text
  centeredText: {
    textAlign: 'center',
    fontSize: 25,
    color: '#6c0909ff',
    lineHeight: 24,
  },

    studentSelector: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 10,
        padding: 4,
        marginTop: 10,
    },
    studentTab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    activeTab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#007AFF' },
    studentTabText: { fontSize: 16, fontWeight: '600', color: '#333' },
    activeTabText: { fontSize: 16, fontWeight: '600', color: '#fff' },
    listContainer: {
        paddingHorizontal: 16,
      
        paddingBottom: 150, 
    },
    studentNameHeader: { fontSize: 24, fontWeight: 'bold', color: '#1a252f', paddingVertical: 20 },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#34495e', backgroundColor: '#f0f0f0', paddingTop: 20, paddingBottom: 10 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 18, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    subjectName: { flex: 1, fontSize: 17, fontWeight: '600', color: '#2c3e50', marginRight: 10 },
    rateBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
    rateText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    statsContainer: { flexDirection: 'row', justifyContent: 'flex-start', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    statText: { fontSize: 14, color: '#7f8c8d', marginRight: 20 },
    bold: { fontWeight: 'bold', color: '#34495e' },
    pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
    pageBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#eef2f5' },
    disabledBtn: { opacity: 0.5 },
    navBtnText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
    pageNumbersContainer: { flexDirection: 'row' },
    pageNumber: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
    activePage: { backgroundColor: '#007AFF', shadowColor: "#007AFF", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 6 },
    pageNumberText: { fontSize: 16, color: '#333', fontWeight: '600' },
    activeText: { color: '#fff' },
    bottomWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    }
});