import AsyncStorage from '@react-native-async-storage/async-storage';
import {saveRefreshToken,deleteRefreshToken} from "@/src/utils/TokenManager";
import axiosInstance from "@/src/configs/axiosInstance";
import { Platform } from 'react-native';
import {getUserInfoFromToken} from "@/src/utils/DecodeToken";
import {API_URL} from "@env"; // Removed: .env files cannot be imported directly in TypeScript

// Dynamic URL based on platform
const getBaseUrl = () => {
    if (Platform.OS === 'web') {
        return 'http://localhost:3000';
    }
    return API_URL|| 'https://e-contact-book-coolking-kvt4.onrender.com';
};

// Set base URL to AsyncStorage for axiosInstance
const initializeBaseUrl = async () => {
    const baseUrl = getBaseUrl();
    //console.log("Base URL set to:", baseUrl);
    await AsyncStorage.setItem('url', baseUrl);
};

export const getlogin = async (username: string, password: string) => {
    try {
        // Ensure base URL is set
        await initializeBaseUrl();
        
        const response = await axiosInstance.post('/api/public/login', { 
            username, 
            password 
        });
        
        // Validate response structure
        if (!response.data) {
            throw new Error("Invalid response structure");
        }
        
        const { access_token, refresh_token } = response.data;

        
        // Validate tokens
        if (!access_token || !refresh_token) {
            throw new Error("Missing tokens in response");
        }
        // Store tokens
        await AsyncStorage.setItem('token', access_token);
        await saveRefreshToken(refresh_token);
        const userInfo = getUserInfoFromToken(access_token);
        if (!userInfo) {
            throw new Error("Invalid token");
        }
        await AsyncStorage.setItem('role', userInfo.roles);
        await AsyncStorage.setItem('userId', userInfo.userId);
        
        return response.data;
    } catch (error: any) {
        console.error("Login error:", error);
        
        // Enhanced error handling
        if (error.response) {
            // Server responded with error status
            const errorMessage = error.response.data?.message || 'Server error occurred';
            throw new Error(errorMessage);
        } else if (error.request) {
            // Network error
            throw new Error('Network error - please check your connection');
        } else {
            // Other errors
            throw error;
        }
    }
};
export const getcheckemail = async (email: string) => {
    try {
        const response = await axiosInstance.post(`/api/public/check-email/${email}`);
        return response.data;
    } catch (error) {
        console.error("Check email error:", error);
        throw error;
    }

}
export const getcheckPhoneNumber = async (number: string) => {
    try {
        const response = await axiosInstance.post(`/api/public/check-phone-number/${number}`);
        if (!response.data) {
            throw new Error("Invalid phone number response");
        }
        return response.data;
        
    } catch (error) {
        console.error("Check phone number error:", error);
        throw error;
    }
}
export const getVerifyOTPPhone = async (phoneNumber: string, otp: string) => {
    try {
        const response = await axiosInstance.post(`/api/public/verify-otp-phone`, { phoneNumber, otp });
        return response.data;
        
    } catch (error) {
        console.error("Verify OTP error:", error);
        throw error;
    }
}


export const  getVerifyOTP = async (email: string, otp: string) => {
    try {
        const response = await axiosInstance.post(`/api/public/verify-otp-email`, { email, otp });
        return response.data;
    } catch (error) {
        console.error("Verify OTP error:", error);
        throw error;
    }
}
export const getchangePassword = async (email: string, resetToken: string, newPassword: string) => {
    try {
        const response = await axiosInstance.post(`/api/public/change-password-by-email`, { email, resetToken, newPassword });
        return response.data;
    } catch (error) {
        console.error("Change password error:", error);
        throw error;
    }
}
export const getchangePasswordPhone = async (phoneNumber: string, resetToken: string, newPassword: string) => {
    try {
        const response = await axiosInstance.post(`/api/public/change-password-by-phone`, { phoneNumber, resetToken, newPassword }); 
        return response.data;
    } catch (error) {
        console.error("Change password error:", error);
        throw error;
    }
}
export const logout = async () => {
    
    const refresh_token = await AsyncStorage.getItem('refreshToken');
    if (!refresh_token) {
        throw new Error("No refresh token found");
    }
    try {
        const response = await axiosInstance.post(`/api/public/logout`, { refresh_token },
           { timeout: 10000 }
        );
        if (!response.data) {
            throw new Error("Invalid logout response");
        }
        return response.data;
    } catch (error) {
        console.error("Logout error:", error);
        throw error;
    } finally {
        await AsyncStorage.removeItem('token');
        await deleteRefreshToken();
        await AsyncStorage.removeItem('role');
        await AsyncStorage.removeItem('userId');
    }
}


