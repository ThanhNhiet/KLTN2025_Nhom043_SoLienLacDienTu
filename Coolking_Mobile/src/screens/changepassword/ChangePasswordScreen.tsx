import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation,useRoute } from "@react-navigation/native";
import { useLogin_out } from "@/src/services/useapi/Login/UseLogin_Forgot";

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { value, resetToken } = route.params as { value: string; resetToken: string };
  const { changePassword,changePasswordPhone, identifyInputType } = useLogin_out();
  const [nextPwd, setNextPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);

 const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Tối thiểu 8 ký tự');
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Ít nhất 1 chữ cái');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Ít nhất 1 chữ số');
  }
  
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Ít nhất 1 ký tự đặc biệt');
  }
  
  return { isValid: errors.length === 0, errors };
};

const onChangePassword = async () => {
  // Kiểm tra trường trống
  if (!nextPwd || !confirm) {
    return Alert.alert("Thiếu thông tin", "Điền đủ các trường.");
  }
  
  // Kiểm tra xác nhận mật khẩu khớp
  if (nextPwd !== confirm) {
    return Alert.alert("Lỗi", "Xác nhận mật khẩu không khớp.");
  }
  
  // Validate mật khẩu mới
  const validation = validatePassword(nextPwd);
  if (!validation.isValid) {
    return Alert.alert("Mật khẩu không hợp lệ", validation.errors.join("\n"));
  }
  
  const inputType = identifyInputType(value);
  let data = null;
  
  try {
    if (inputType === 'EMAIL') {
      data = await changePassword(value, resetToken, nextPwd);
    } else if (inputType === 'PHONE') {
      data = await changePasswordPhone(value, resetToken, nextPwd);
    } else {
      return Alert.alert("Lỗi", "Định dạng email hoặc số điện thoại không hợp lệ.");
    }
    
    if (!data || !data.success) {
      return Alert.alert("Lỗi", data?.message || "Đổi mật khẩu thất bại.");
    }
    
    Alert.alert("Thành công", data.message || "Đổi mật khẩu thành công!");
    navigation.navigate("LoginScreen");
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu:", error);
    Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại.");
  }
};

  const renderPwdRow = (
    label: string,
    value: string,
    setVal: (v: string) => void,
    secure: boolean,
    setSecure: (v: boolean) => void
  ) => (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          placeholder={label}
          value={value}
          onChangeText={setVal}
          secureTextEntry={!secure}
          style={[styles.input, { flex: 1, borderBottomWidth: 0 }]}
          placeholderTextColor="#999"
          underlineColorAndroid="transparent"
        />
        <TouchableOpacity onPress={() => setSecure(!secure)}>
          <Ionicons name={secure ? "eye-off" : "eye"} size={22} color="gray" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Nút Back */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={26} color="#007AFF" />
      </TouchableOpacity>

      <Text style={styles.title}>Đổi mật khẩu</Text>

      <View style={styles.divider} />
      {renderPwdRow("Mật khẩu mới", nextPwd, setNextPwd, show2, setShow2)}
      {renderPwdRow("Xác nhận mật khẩu mới", confirm, setConfirm, show3, setShow3)}

      <TouchableOpacity style={styles.button} onPress={onChangePassword}>
        <Text style={styles.buttonText}>Cập nhật</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  backButton: { marginBottom: 10, alignSelf: "flex-start" },
  title: {fontFamily: "BeVietnam-Bold", fontSize: 22, marginBottom: 24, textAlign: "center" },
  label: { fontSize: 15, fontWeight: "500", marginBottom: 6, color: "#444" },
  input: {
    height: 45,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
    paddingHorizontal: 8,
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingRight: 8,
  },
  divider: { height: 8 },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { fontFamily: "BeVietnam-Regular", color: "#fff", fontSize: 16, fontWeight: "700" },
});
