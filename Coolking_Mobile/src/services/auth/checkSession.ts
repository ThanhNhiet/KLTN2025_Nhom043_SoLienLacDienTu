import AsyncStorage from "@react-native-async-storage/async-storage";
import {deleteRefreshToken, getRefreshToken, saveRefreshToken} from "@/src/utils/TokenManager";
import axios from "axios";
import { getUserInfoFromToken } from "@/src/utils/DecodeToken";

const REFRESH_ENDPOINT = "/api/public/refresh-token";

/**
 * Kiểm tra và refresh token tự động khi app mở
 * @returns true nếu refresh thành công (còn phiên), false nếu hết hạn
 */
export const checkAndRefreshSession = async (): Promise<boolean> => {
  try {
    const base = await AsyncStorage.getItem("url");
    const refreshToken = await getRefreshToken();

    if (!base || !refreshToken) return false;

    // Gọi API refresh (dùng axios thường, không qua interceptor)
    const res = await axios.post(`${base}${REFRESH_ENDPOINT}`, {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const newAccessToken = res?.data?.access_token;
    const newRefreshToken = res?.data?.refresh_token;

    if (!newAccessToken) return false;

    // ✅ Lưu token mới
    await AsyncStorage.setItem("token", newAccessToken);
    const userInfo = getUserInfoFromToken(newAccessToken);
    if (!userInfo) {
      console.warn("⚠️ Không thể giải mã token mới");
      return false;
    }
      await AsyncStorage.setItem('role', userInfo.roles);
      await AsyncStorage.setItem('userId', userInfo.userId);
    await deleteRefreshToken();
    if (newRefreshToken) await saveRefreshToken(newRefreshToken);
    return true;
  } catch (error) {
    console.warn("⚠️ Refresh token hết hạn hoặc lỗi:", error);

    // ❌ Xóa token hết hạn
    await AsyncStorage.removeItem("token");
    await deleteRefreshToken();
    return false;
  }
};
