import AsyncStorage from '@react-native-async-storage/async-storage';
import {getlogin,getcheckemail,getVerifyOTP,getchangePassword,logout} from "@/src/services/api/Login/Login_ForgotApi";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import NetInfo from '@react-native-community/netinfo'; // Install if not already

export const useLogin_out = () => {
    const navigation = useNavigation<any>();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const login = async () => {
        setIsLoading(true);
        try {
            // Check network connectivity
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                throw new Error("No internet connection");
            }

            const data = await getlogin(username, password);
            if (!data){
                throw new Error("Invalid login response");
                return;
            }
            const token = data.access_token;
            const refreshToken = data.refresh_token;
            if (!token || !refreshToken) {
                throw new Error("Missing tokens in login response");
            } else {
                console.log("Login successful, tokens received");
                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('refreshToken', refreshToken);
                
                navigation.navigate("HomeScreen");
            }
        } catch (error: any) {
            console.error("Login error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }
    const checkemail = async () => {
        setIsLoading(true);
        try {
            // Check network connectivity
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                throw new Error("No internet connection");
            }
            const data = await getcheckemail(email);
            if (!data){
                throw new Error("Invalid email response"); 
                return;
            }
            
         return {
            "success": data.success,
            "message": data.message,
            "email": data.data.email
         };
        } catch (error: any) {
            console.error("Check email error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }
    const resetOTP = async (email: string) => {
        setIsLoading(true);
        try {
            // Check network connectivity
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                throw new Error("No internet connection");
            }
            const data = await getcheckemail(email);
            if (!data){
                throw new Error("Invalid email response"); 
                return;
            }
            
         return {
            "success": data.success,
            "message": data.message,
            "email": data.data.email
         };
        } catch (error: any) {
            console.error("Check email error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }
    const verifyOTP = async (email: string, otp: string) => {
        setIsLoading(true);
        try {
            // Check network connectivity
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                throw new Error("No internet connection");
            }
            const data = await getVerifyOTP(email, otp);
            if (!data){
                throw new Error("Invalid OTP response"); 
                return;
            }
            return {
            "success": data.success,
            "message": data.message,
            "email": data.data.email,
            "resetToken": data.data.resetToken
            }
        } catch (error: any) {
            console.error("Verify OTP error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }
    const changePassword = async (email: string, resetToken: string, newPassword: string) => {
        setIsLoading(true);
        try {
            // Check network connectivity
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                throw new Error("No internet connection");
            }
            const data = await getchangePassword(email, resetToken, newPassword);
            if (!data){
                throw new Error("Invalid change password response"); 
                return;
            }
            return {
            "success": data.success,
            "message": data.message
            }
        } catch (error: any) {
            console.error("Change password error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }

    const getlogout = async () => {
        setIsLoading(true);
        try {
            // Cố gắng gọi API (nếu offline vẫn chạy được vì logout() đã best-effort)
            const data = await logout();

            // Điều hướng về Login và xoá history
            navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }],
            });

            return { message: data.message };
        } catch (error: any) {
            console.error('Logout error:', error);
            // Dù lỗi — vẫn chắc chắn đã xoá token trong logout()
            navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }],
            });
            return { message: 'Đã đăng xuất (local)' };
        } finally {
            setIsLoading(false);
        }
    };




    return {
        username,
        setUsername,
        password,
        setPassword,
        email,
        setEmail,
        login,
        checkemail,
        resetOTP,
        verifyOTP,
        changePassword,
        getlogout,
        isLoading,
    }
};
