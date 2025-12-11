import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import TopNavigations_ProfileDetail from "@/src/components/navigations/TopNavigations_Profile_Screen";
import { useProfile } from "@/src/services/useapi/profile/UseProfile";
import UpdateProfileModal, { ProfileForm } from "@/src/components/modals/UpdateProfileModal";
import { set } from "date-fns";


const getGenderText = (gender: String) => (gender === "Nam" ? true : false);
export default function ProfileDetailScreen() {
  const navigation = useNavigation<any>();
  const {
    profile,
    labelMap,
    loading,
    error,
    getUpdateAvatar,
    avatarUrl,
    setAvatarUrl,
    profileParent,
    profileStudent,
    role,
    labelMapParent,
    labelMapStudent,
    getUpdateProfileData,
    fetchProfile,
  } = useProfile();

  const [fileAvatar, setFileAvatar] = React.useState<Object | null>(null);
  const [openModal, setOpenModal] = React.useState(false);
  const isStudent = role === "STUDENT";
  const initialValues: ProfileForm = {
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    gender: (getGenderText(profile?.gender as any)) || false,
    dob: profile?.dob || "",
  };
  

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0] || result;
      if (asset) {
        setFileAvatar(asset);
        setAvatarUrl(asset.uri);
      }
    } catch (err) {
      console.log("Lỗi chọn file:", err);
    }
  };

  const handleUpdateAvatar = async (file: any) => {
    if (!file) return;
    Alert.alert(
      "Cập nhật ảnh đại diện",
      "Bạn có chắc chắn muốn cập nhật ảnh đại diện không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          onPress: async () => {
            try {
              const data = await getUpdateAvatar(file);
              setAvatarUrl(data?.avatar);
              if (!data) {
                Alert.alert(
                  "Lỗi",
                  "Cập nhật ảnh đại diện thất bại. Vui lòng thử lại."
                );
              } else {
                // ✅ Fetch profile immediately to update avatar everywhere
                await fetchProfile();
                Alert.alert(
                  "Thành công",
                  data.message || "Cập nhật ảnh đại diện thành công."
                );
                setFileAvatar(null);
              }
            } catch (error) {
              Alert.alert(
                "Lỗi",
                "Cập nhật ảnh đại diện thất bại. Vui lòng thử lại."
              );
            }
          },
        },
      ]
    );
  };

  const handleSubmitProfile = async (values: ProfileForm) => {
    try {
      const data = await getUpdateProfileData(values);
      // ✅ Fetch profile to update UI immediately
      await fetchProfile();
      Alert.alert("Thành công", data?.message || "Cập nhật hồ sơ thành công!");
      setOpenModal(false);
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message || "Không thể cập nhật hồ sơ");
      throw e;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <TopNavigations_ProfileDetail
          navigation={navigation}
          name="Thông tin chi tiết"
        />

        <View style={styles.contentContainer} />
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
          </View>
        ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Avatar + nút chỉnh */}
          <View style={styles.avatarWrap}>
            <Image
              source={{
                uri: avatarUrl || "https://i.pravatar.cc/200?img=14",
              }}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.avatarEditBtn}
              onPress={pickFile}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Nút cập nhật ảnh đại diện */}
          {fileAvatar && (
            <TouchableOpacity
              style={styles.buttonAvatar}
              onPress={() => handleUpdateAvatar(fileAvatar)}
            >
              <Text style={styles.buttonText}>Cập nhật ảnh đại diện</Text>
            </TouchableOpacity>
          )}

          {/* Tên + vai trò */}
          <View style={styles.headerBlock}>
            <Text style={styles.displayName}>
              {profile?.full_name || profile?.name || "Người dùng"}
            </Text>
            <View style={styles.roleChip}>
              <Ionicons name="shield-checkmark" size={14} color="#007AFF" />
              <Text style={styles.roleChipText}>
                {role?.toUpperCase() || "USER"}
              </Text>
            </View>
          </View>

          {/* Thông tin tài khoản */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin tài khoản</Text>
            {Object.entries(profile || {}).map(([key, value]) => (
              <View key={key} style={styles.infoRow}>
                <Text style={styles.label}>{labelMap[key] || key}</Text>
                <Text style={styles.value} numberOfLines={1}>
                  {String(value ?? "")}
                </Text>
              </View>
            ))}
          </View>

          {/* Thông tin phụ huynh / học sinh */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isStudent ? "Thông tin phụ huynh" : "Thông tin học sinh"}
            </Text>

            {/* 1. Chọn đúng mảng */}
            {((isStudent ? profileParent : profileStudent) || [])
              
              /* 2. Lặp qua mảng (mỗi 'item' là một object, ví dụ: { name: 'An' }) */
              .map((item, index) => (
                
                /* Dùng React.Fragment để nhóm các hàng của 1 người */
                /* Lưu ý: Nếu 'item' có 'id' duy nhất, hãy dùng key={item.id} */
                <React.Fragment key={index}> 
                
                  {/* 3. Lặp qua các thuộc tính (key, value) của 'item' đó */}
                  {Object.entries(item || {}).map(([key, value]) => (
                    <View key={key} style={styles.infoRow}>
                      <Text style={styles.label}>
                        {isStudent
                          ? labelMapParent[key] || key
                          : labelMapStudent[key] || key}
                      </Text>
                      <Text style={styles.value} numberOfLines={1}>
                        {String(value ?? "")}
                      </Text>
                    </View>
                  ))}

                  {/* (TÙY CHỌN) Thêm vạch ngăn cách giữa các phần tử.
                    Dòng này kiểm tra để không thêm vạch kẻ sau phần tử cuối cùng.
                  */}
                  {index < (isStudent ? profileParent : profileStudent).length - 1 && (
                    <View style={styles.separator} />
                  )}

                </React.Fragment>
              ))}
          </View>
          {/* Nút chỉnh sửa hồ sơ */}
          <TouchableOpacity
              style={{ alignSelf: "center", marginTop: 8, marginBottom: 4 }}
              onPress={() => setOpenModal(true)}>
              <Text style={{ color: "#4A90E2", fontWeight: "800" }}>Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
          <UpdateProfileModal
              visible={openModal}
              onClose={() => setOpenModal(false)}
              initialValues={initialValues}
              onSubmit={handleSubmitProfile}
          />
        </ScrollView>)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F6FB",
  },
  contentContainer: {
    height: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  loadingContainer: {
    flex: 1, // Chiếm hết phần không gian còn lại
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F6FB", // Đồng bộ màu nền
  },

  /* ===== Avatar ===== */
  avatarWrap: {
    alignSelf: "center",
    marginTop: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 3,
    borderColor: "#4A90E2",
    backgroundColor: "#eaeaea",
  },
  avatarEditBtn: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  /* Nút cập nhật avatar */
  buttonAvatar: {
    backgroundColor: "#4A90E2",
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 24,
    alignSelf: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14.5,
    letterSpacing: 0.2,
  },

  /* ===== Header tên + role ===== */
  headerBlock: {
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  displayName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 8,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#E8F1FE",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#C7DBF9",
  },
  roleChipText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#1f2937",
    textTransform: "uppercase",
  },

  /* ===== Card ===== */
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
    paddingVertical: 2,
  },
  separator: {
  height: 1,
  backgroundColor: '#e0e0e0', // Màu xám nhạt
  marginVertical: 10,       // Khoảng cách trên và dưới
 },

  /* ===== Info rows ===== */
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  label: {
    flex: 1,
    fontSize: 14.5,
    color: "#334155",
    fontWeight: "800",
    paddingRight: 8,
  },
  value: {
    flex: 1.2,
    textAlign: "right",
    fontSize: 14.5,
    color: "#111827",
    fontWeight: "600",
  },
});
