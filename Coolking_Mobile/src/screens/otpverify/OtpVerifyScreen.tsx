import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation,useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useLogin_out } from "@/src/services/useapi/Login/UseLogin_Forgot";
export default function OtpVerifyScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { value } = route.params as { value: string };
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(180); // 3 phút
  const { 
    resetOTP, 
    verifyOTP,
    identifyInputType,
    resetOTPPhone,
    verifyOTPPhone
   } = useLogin_out();

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleVerify = async () => {
    if (timeLeft <= 0) return Alert.alert("Hết hạn", "Mã OTP đã hết hạn.");
    if (otp.length !== 6) return Alert.alert("Lỗi", "Vui lòng nhập đủ 6 số OTP.");
    // TODO: gọi API kiểm tra OTP
    const inputType = identifyInputType(value);
   
    if (inputType === 'EMAIL') {
    const  response = await verifyOTP(value, otp);
     if (!response || !response.success) {
      return Alert.alert("Lỗi", "OTP không đúng hoặc đã hết hạn.");
    } else {
      Alert.alert("Thành công", response.message);
      navigation.navigate("ChangePasswordScreen", { value: response?.email, resetToken: response?.resetToken });
    }
    } else if (inputType === 'PHONE') {
      const response = await verifyOTPPhone(value, otp);
      if (!response || !response.success) {
        return Alert.alert("Lỗi", "OTP không đúng hoặc đã hết hạn.");
      } else {
        Alert.alert("Thành công", response.message);
        navigation.navigate("ChangePasswordScreen", { value: response?.number, resetToken: response?.resetToken });
      }
    }
   
  };

  const handleResend = async () => {
    // Chặn nếu chưa hết giờ (phòng trường hợp dev quên disabled ở UI)
    if (timeLeft > 0) return;
    // TODO: gọi API gửi lại OTP
    const inputType = identifyInputType(value);
    let data = null;
    if (inputType === 'PHONE') {
      data = await resetOTPPhone(value);
    } else if (inputType === 'EMAIL') {
      data = await resetOTP(value);
    }
      if (!data || !data.success) {
        return Alert.alert("Lỗi", "Email không tồn tại trong hệ thống.");
      } else {
            setOtp("");
          setTimeLeft(180);
          Alert.alert("OTP mới", "Đã gửi lại mã OTP.");
        }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={26} color="#007AFF" />
      </TouchableOpacity>

      <Text style={styles.title}>Nhập mã OTP</Text>
      <Text style={styles.subtitle}>Chúng tôi đã gửi mã OTP đến email của bạn.</Text>

      <TextInput
        placeholder="Nhập OTP (6 số)"
        value={otp}
        onChangeText={setOtp}
        style={styles.input}
        keyboardType="numeric"
        maxLength={6}
        underlineColorAndroid="transparent"
        placeholderTextColor="#999"
      />

      <Text style={styles.timer}>
        {timeLeft > 0 ? `OTP sẽ hết hạn sau: ${formatTime(timeLeft)}` : "Mã OTP đã hết hạn"}
      </Text>

      <TouchableOpacity
        style={[styles.button, timeLeft <= 0 && { backgroundColor: "gray" }]}
        onPress={handleVerify}
        disabled={timeLeft <= 0}
      >
        <Text style={styles.buttonText}>Xác nhận</Text>
      </TouchableOpacity>

      {/* Gửi lại OTP: chỉ nhấn được khi timeLeft === 0 */}
      <TouchableOpacity
        style={[
          styles.resendButton,
          timeLeft > 0 && { opacity: 0.5 } // hiệu ứng mờ khi khóa
        ]}
        onPress={handleResend}
        disabled={timeLeft > 0}
      >
        <Text style={styles.resendText}>
          {timeLeft > 0 ? `Gửi lại OTP sau ${formatTime(timeLeft)}` : "Gửi lại OTP"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ...các style khác giữ nguyên
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  backButton: { marginBottom: 10, alignSelf: "flex-start" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#555", textAlign: "center", marginBottom: 24 },
  input: {
    height: 50,
    borderBottomWidth: 2,
    borderColor: "#007AFF",
    fontSize: 20,
    letterSpacing: 12,
    textAlign: "center",
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  timer: { fontSize: 16, textAlign: "center", marginBottom: 20, color: "red", fontWeight: "600" },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  resendButton: { marginTop: 18, alignItems: "center" },
  resendText: { color: "#007AFF", fontSize: 15, fontWeight: "600" },
});
