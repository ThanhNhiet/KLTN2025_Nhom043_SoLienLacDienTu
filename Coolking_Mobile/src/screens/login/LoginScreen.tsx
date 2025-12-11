import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  StatusBar, Platform, TextInput
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useLogin_out } from "@/src/services/useapi/Login/UseLogin_Forgot";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
 
  const [showPassword, setShowPassword] = useState(false);
  const { username, setUsername, password, setPassword, login } = useLogin_out();


  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Platform.OS === "android" ? "#f5f5f5" : "transparent"}
          translucent={false}
          animated
        />

        <Text style={styles.title}>Đăng nhập</Text>

        {/* Username */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tài khoản</Text>
          <TextInput
            placeholder="Nhập tài khoản"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            placeholderTextColor="#999"
            underlineColorAndroid="transparent"
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[styles.input, { flex: 1, borderBottomWidth: 0 }]}
              placeholderTextColor="#999"
              underlineColorAndroid="transparent"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="gray" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions under password */}
        <View style={styles.rowRight}>
          <TouchableOpacity onPress={() => navigation.navigate("ForgotPasswordScreen")}>
            <Text style={styles.linkText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        {/* Button Login */}
        <TouchableOpacity style={styles.loginButton} onPress={login}>
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontFamily: 'BeVietnam-Bold',fontSize: 28,  marginBottom: 40, textAlign: "center", color: "#333" },
  inputContainer: { marginBottom: 18 },
  label: { fontFamily: 'BeVietnam-Regular', fontSize: 16, fontWeight: "500", marginBottom: 6, color: "#444" },
  input: {
    height: 45,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
    paddingHorizontal: 8,
    backgroundColor: "transparent",
    fontFamily: 'BeVietnam-Regular',

  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingRight: 8,
  },
 rowRight: {
  flexDirection: "row",
  justifyContent: "flex-end",
  marginTop: 8,
},
  linkText: { fontFamily: 'BeVietnam-Regular', color: "#007AFF", fontSize: 14, fontWeight: "600" },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  loginButtonText: { fontFamily: 'BeVietnam-Bold', color: "#fff", fontSize: 18 },
});
