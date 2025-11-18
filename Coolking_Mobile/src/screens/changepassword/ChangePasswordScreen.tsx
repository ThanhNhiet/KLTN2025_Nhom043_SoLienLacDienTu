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

  const onChangePassword = async () => {
    if ( !nextPwd || !confirm)
      return Alert.alert("Thiếu thông tin", "Điền đủ các trường.");
    if (nextPwd.length < 6)
      return Alert.alert("Yêu cầu", "Mật khẩu mới tối thiểu 6 ký tự.");
    if (nextPwd !== confirm)
      return Alert.alert("Lỗi", "Xác nhận mật khẩu không khớp.");
    const inputType = identifyInputType(value);
    let data = null;
    if (inputType === 'EMAIL') {
      data = await changePassword(value, resetToken, nextPwd);
    } else if (inputType === 'PHONE') {
      data = await changePasswordPhone(value, resetToken, nextPwd);
    }
      if (!data || !data.success) {
        return Alert.alert("Lỗi",data?.message || "Đổi mật khẩu thất bại.");
      } else {
        Alert.alert("Thành công", data.message || "Đổi mật khẩu thành công!");
        navigation.navigate("LoginScreen");
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
  title: { fontSize: 22, fontWeight: "700", marginBottom: 24, textAlign: "center" },
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
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
