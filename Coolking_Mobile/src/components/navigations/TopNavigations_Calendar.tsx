import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Modal, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SelectStudentModal from "../modals/SelectStudentModal"; // Giả sử đường dẫn này là đúng
import { useProfile } from "@/src/services/useapi/profile/UseProfile";
type CalendarFilter = "all" | "study" | "exam";

type Props = {
  onChangeFilter?: (f: CalendarFilter) => void;
  initialFilter?: CalendarFilter;
  setStudentID?: (studentId: string) => void;
  handleGoToday?: (studentId?: string) => void;
};
enum Role {
  STUDENT = "STUDENT",
  PARENT = "PARENT",
  TEACHER = "TEACHER",
}

export default function TopNavigations_Calendar({
  onChangeFilter,
  initialFilter = "all",
  setStudentID,
  handleGoToday
}: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<CalendarFilter>(initialFilter);
  const [slideAnim] = useState(new Animated.Value(-300)); // slide animation
  const [openStudentModal, setOpenStudentModal] = useState(false);

 const { students,role } = useProfile();
  

  const apply = (f: CalendarFilter) => {
    setFilter(f);
    onChangeFilter?.(f);
    closeModal();
  };

  const labelOf = (f: CalendarFilter) =>
    f === "all" ? "Tất cả" : f === "study" ? "Lịch học" : "Lịch thi";

  const handleOpenStudentModal = () => {
    setOpenStudentModal(true);
  };

  const handleSelectStudent = (student: any) => {

    // Extract ID - support both object and string formats
    const id = typeof student === "string" 
      ? student 
      : student?.student_id || student?.id;

    if (!id) {
      console.warn("[TopNav] No valid ID found in selected student");
      return;
    }

   
    setStudentID?.(id);
    setOpenStudentModal(false);
    handleGoToday?.(id);
  };

  const openModal = () => {
    setOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: -300, // Chiều rộng của sidePanel
      duration: 200,
      useNativeDriver: true,
    }).start(() => setOpen(false));
  };

  return (
    <>
      {/* Container cho thanh điều hướng trên cùng */}
      <View style={styles.container}>
        <Text style={styles.title}>Lịch học / Lịch thi</Text>

        {/* Nhóm các nút bên phải */}
        <View style={styles.buttonGroup}>
          {role === Role.PARENT && (
            <TouchableOpacity style={styles.studentBtn} onPress={handleOpenStudentModal}>
              <Ionicons name="people-circle-outline" size={28} color="#333" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.filterBtn} onPress={openModal}>
            <Ionicons name="calendar-outline" size={22} color="#333" />
            <Text style={styles.filterText}>{labelOf(filter)}</Text>
            <Ionicons name="chevron-down" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

     
      {/* Modal chọn học sinh */}
      <SelectStudentModal
        visible={openStudentModal}
        onClose={() => setOpenStudentModal(false)}
        students={students} // Truyền danh sách học sinh
        onSelectStudent={handleSelectStudent} // Truyền hàm xử lý (returns id or student object)
      />

      {/* Modal chọn bộ lọc (menu trượt bên trái) */}
      <Modal visible={open} transparent animationType="none" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Animated.View style={[styles.sidePanel, { transform: [{ translateX: slideAnim }] }]}>
            {/* Bọc nội dung modal trong SafeAreaView */}
            <SafeAreaView style={{ flex: 1 }}>
              {/* Header */}
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Chọn bộ lọc</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {/* Các tùy chọn lọc */}
              <OptionRow
                label="Tất cả"
                selected={filter === "all"}
                icon="grid-outline"
                onPress={() => apply("all")}
              />
              <Divider />
              <OptionRow
                label="Lịch học"
                selected={filter === "study"}
                icon="school-outline"
                onPress={() => apply("study")}
              />
              <Divider />
              <OptionRow
                label="Lịch thi"
                selected={filter === "exam"}
                icon="reader-outline"
                onPress={() => apply("exam")}
              />
            </SafeAreaView>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

/* ==== Component con: Hàng tùy chọn ==== */
function OptionRow({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const selectedColor = "#6e2febff"; // Màu tím chủ đạo
  const defaultColor = "#555";
  const iconColor = selected ? selectedColor : defaultColor;

  return (
    // Đã xóa SafeAreaView không cần thiết ở đây
    <TouchableOpacity style={rowStyles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={rowStyles.left}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text style={[rowStyles.text, selected && rowStyles.selectedText]}>{label}</Text>
      </View>
      <Ionicons
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={20}
        color={selected ? selectedColor : "#aaa"}
      />
    </TouchableOpacity>
  );
}

/* ==== Component con: Đường kẻ phân cách ==== */
function Divider() {
  return <View style={styles.divider} />;
}

/* ==== StyleSheet chính ==== */
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Đẩy tiêu đề và nhóm nút ra 2 bên
    paddingVertical: 12,
    paddingHorizontal: 16, // Thêm padding ngang
    backgroundColor: "#6e2febff", // Màu tím chủ đạo
    // Bỏ border dưới nếu không cần thiết, hoặc đổi màu
    // borderBottomWidth: 1,
    // borderBottomColor: "#eee",
  },
  title: {
    fontSize: 18, // Tăng kích thước chữ tiêu đề
    fontWeight: "600",
    color: "#FFFFFF", // Màu trắng cho dễ đọc trên nền tím
  },
  buttonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10, // Tạo khoảng cách giữa 2 nút
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  studentBtn: {
    // Xóa 'color' không hợp lệ
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
    padding: 4, // Điều chỉnh padding cho nút tròn hơn
    borderRadius: 10, // Bo tròn
  },
  filterText: {
    marginHorizontal: 6,
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  sidePanel: {
    width: "70%",
    maxWidth: 300, // Thêm chiều rộng tối đa
    height: "100%",
    backgroundColor: "#fff",
    // padding đã được xử lý bởi SafeAreaView và header
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
    // Bỏ bo góc để đẹp hơn khi trượt từ cạnh
    // borderTopRightRadius: 16,
    // borderBottomRightRadius: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16, // Thêm padding cho header
    paddingTop: 20, // Thêm padding top
  },
  sheetTitle: {
    fontSize: 18, // Tăng kích thước
    fontWeight: "700",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 6,
    marginHorizontal: 16, // Thêm margin ngang
  },
});

/* ==== StyleSheet cho OptionRow ==== */
const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14, // Tăng padding
    paddingHorizontal: 16, // Thêm padding ngang
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14, // Tăng khoảng cách
  },
  text: {
    fontSize: 15,
    color: "#333",
    // Xóa marginLeft vì đã có 'gap'
  },
  selectedText: {
    color: "#6e2febff", // Màu tím
    fontWeight: "700",
  },
});
