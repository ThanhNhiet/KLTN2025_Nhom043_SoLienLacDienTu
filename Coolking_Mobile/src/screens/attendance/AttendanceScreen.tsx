import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "@/src/components/navigations/BottomNavigations";
import TopNavigations_Attendance from "@/src/components/navigations/TopNavigations_Attendance";
import { useAttendance } from "@/src/services/useapi/attendance/UseAttendance";

// Interface và Component con không đổi
interface CourseSection {
  course_section_id: string;
  subject_id: string;
  subjectName: string;
  className: string;
  facultyName: string;
  sessionName: string;
  lecturerName: string;
  createdAt: string;
}

const CourseCard = ({ item }: { item: CourseSection }) => {
  const navigation = useNavigation<any>();
  const handlePress = () => {
    navigation.navigate("AttendanceDetailScreen", { 
      courseSectionId: item.course_section_id,
      subjectId: item.subject_id,
      subjectName: item.subjectName,
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.courseInfo}>
        <Text style={styles.subjectName}>{item.subjectName}</Text>
        <Text style={styles.detailsText}>Giảng viên: {item.lecturerName}</Text>
        <Text style={styles.detailsText}>Lớp: {item.className}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
};


export default function AttendanceScreen() {
  const navigation = useNavigation<any>();
  const { courseSections, loading, error, totalPages, page, setPage } = useAttendance();
  const [studentId, setStudentId] = useState<string>("");

  const handleFetchAttendance = (newStudentId: string) => {
    setStudentId(newStudentId);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages[totalPages.length - 1]) {
      setPage(newPage);
    }
  };

  const handlePrev = () => { if (page !== 1) {handlePageChange(page - 1)} };
  const handleNext = () => { if (page !== totalPages[totalPages.length - 1]) {handlePageChange(page + 1)} };
  const hookGoToPage = (pageNumber: number) => handlePageChange(pageNumber);

  const isPrevDisabled = page === 1;
  const isNextDisabled = page === totalPages[totalPages.length - 1];
  const visiblePages = Array.from({ length: totalPages[totalPages.length - 1] }, (_, i) => i + 1);

  const groupedCourses = useMemo(() => {
    if (!courseSections) return {};
    return courseSections.reduce((acc, course) => {
      const key = String(course.sessionName);
      if (!acc[key]) acc[key] = [];
      (acc[key] as CourseSection[]).push(course as CourseSection);
      return acc;
    }, {} as Record<string, CourseSection[]>);
  }, [courseSections]);

  const sessions = Object.keys(groupedCourses);


  if (loading) { // Chỉ hiển thị loading toàn màn hình cho lần tải đầu tiên
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error && courseSections.length === 0) { // Chỉ hiển thị lỗi toàn màn hình khi không có dữ liệu
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Có lỗi xảy ra khi tải dữ liệu.</Text>
      </View>
    );
  }

  // Component render phân trang
  const renderPagination = () => {
    if (totalPages.length <= 1) return null;

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          onPress={handlePrev}
          style={[styles.pageBtn, isPrevDisabled && styles.disabledBtn]}
          disabled={isPrevDisabled}
        >
          <Text style={styles.navBtnText}>Lùi</Text>
        </TouchableOpacity>
        <View style={styles.pageNumbersContainer}>
          {visiblePages.map((num) => (
            <TouchableOpacity
              key={num}
              onPress={() => hookGoToPage(num)}
              style={[styles.pageNumber, num === page && styles.activePage]}
            >
              <Text style={[styles.pageNumberText, num === page && styles.activeText]}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.pageBtn, isNextDisabled && styles.disabledBtn]}
          disabled={isNextDisabled}
        >
          <Text style={styles.navBtnText}>Tiến</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.topNavWrapper}>
          <TopNavigations_Attendance 
            setStudentId={setStudentId}
            handleFetchAttendance={handleFetchAttendance}
          />
        </View>
        <View style={{ flex: 1 }}>
          {sessions.length > 0 ? (
            <FlatList
              data={sessions}
              keyExtractor={(item) => item}
              renderItem={({ item: sessionName }) => (
                <View style={styles.sessionContainer}>
                  <Text style={styles.sessionTitle}>{sessionName}</Text>
                  {groupedCourses[sessionName].map((course) => (
                    <CourseCard key={course.course_section_id} item={course} />
                  ))}
                </View>
              )}
              contentContainerStyle={styles.listContentContainer}
              ListFooterComponent={renderPagination}
            />
          ) : (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>Không có lớp học phần nào.</Text>
            </View>
          )}
        </View>
        <View style={styles.bottomWrapper}>
          <BottomNavigation 
            navigation={navigation}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ========= STYLESHEET ĐÃ ĐƯỢC TINH CHỈNH =========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    overflow: 'hidden',
  },
  topNavWrapper: {
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    // THÊM: Tăng padding bottom để thanh phân trang không quá sát
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorText: { fontSize: 16, color: '#d9534f' },
  emptyText: { fontSize: 16, color: '#888' },
  sessionContainer: {
    // THÊM: Tăng khoảng cách giữa các khối học kỳ
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 22,
    fontWeight: '700', // TĂNG: Độ đậm
    color: '#1a252f', // THAY ĐỔI: Màu chữ đậm hơn
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20, // THÊM: Padding đồng nhất
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    // TINH CHỈNH: Shadow mềm mại và hiện đại hơn
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  courseInfo: {
    flex: 1,
    marginRight: 10,
  },
  subjectName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 22, // THÊM: Tăng chiều cao dòng cho dễ đọc
  },
  chevron: {
    fontSize: 24,
    color: '#c8d6e5', // THAY ĐỔI: Màu nhạt hơn
    fontWeight: 'bold',
  },
  bottomWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
  },

  // --- Styles mới và đã được làm lại cho Pagination ---
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between', // THAY ĐỔI: Đẩy nút tiến/lùi ra hai bên
    alignItems: 'center',
    paddingVertical: 24, // TĂNG: Thêm không gian
    paddingHorizontal: 16,
  },
  pageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#eef2f5',
  },
  disabledBtn: {
    opacity: 0.5, // Dùng opacity cho trạng thái disabled
  },
  navBtnText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  pageNumbersContainer: {
    flexDirection: 'row',
  },
  pageNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activePage: {
    backgroundColor: '#007AFF',
    shadowColor: "#007AFF", // Thêm hiệu ứng shadow cho đẹp
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  pageNumberText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  activeText: {
    color: '#fff',
  },
});