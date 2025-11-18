import { Ionicons } from "@expo/vector-icons";
import React,{useEffect,useState} from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useProfile } from "@/src/services/useapi/profile/UseProfile";
import SelectStudentModal from "../modals/SelectStudentModal"; // Giả sử đường dẫn này là đúng
type props = {
  navigation: any;
  name: string;
  setStudentId: (id: string) => void;
};

export default function TopNavigations({ navigation, name, setStudentId }: props) {
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
          setOpenStudentModal(false);
      };
  
  return (
    <View style={styles.container}>
      {/* Nút Back */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#e5f0f0ff" />
      </TouchableOpacity>

      {/* Tiêu đề */}
      <Text style={styles.title}>{name}</Text>

      {isParent && (
        <TouchableOpacity
            style={styles.iconButton}
            onPress={handleOpenStudentModal}
        >
            {/* 3. Đổi màu icon cho hợp với nền */}
            <Ionicons name="people-circle-outline" size={28} color="#e5f0f0ff" />
        </TouchableOpacity>
    )}
    {/* Modal nằm ngoài View là đúng */}
            <SelectStudentModal
                visible={openStudentModal}
                onClose={() => setOpenStudentModal(false)}
                students={students} // Truyền danh sách học sinh
                onSelectStudent={handleSelectStudent} // Truyền hàm xử lý
            />

      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6e2febff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#a088ff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#e5f0f0ff",
    textAlign: "center",
  },
  button: {
    position: "absolute",
    left: 14,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
        position: "absolute", // Định vị tuyệt đối
        right: 12,            // Căn lề phải
        padding: 4,           // Tăng vùng nhấn
        justifyContent: "center",
        alignItems: "center",
    },
});
