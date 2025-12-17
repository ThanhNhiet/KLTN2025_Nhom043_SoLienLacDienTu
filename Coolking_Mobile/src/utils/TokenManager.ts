import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'refreshToken'; // Dùng hằng số để tránh gõ sai

const NOTI_TOGGLE_KEY = "settingspushnotificationsenabled";

// --- Hàm lưu refresh token ---
export async function saveRefreshToken(refreshToken: string) {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    console.log('✅ Refresh token đã được lưu an toàn.');
  } catch (error) {
    console.error('Lỗi khi lưu refresh token:', error);
  }
}

// --- Hàm đọc refresh token ---
export async function getRefreshToken() {
  try {
    const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    return token; // Sẽ trả về null nếu không tìm thấy
  } catch (error) {
    console.error('Lỗi khi đọc refresh token:', error);
    return null;
  }
}

// --- Hàm xóa refresh token (khi logout) ---
export async function deleteRefreshToken() {
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    console.log('✅ Refresh token đã được xóa.');
  } catch (error) {
    console.error('Lỗi khi xóa refresh token:', error);
  }
}

// --- Hàm lưu thông báo ---
export async function saveNotifile(save: boolean) {
  try {
    await SecureStore.setItemAsync(NOTI_TOGGLE_KEY, save ? "true" : "false");
    console.log('✅ Thông báo đã được lưu an toàn.');
  } catch (error) {
    console.error('Lỗi khi lưu thông báo:', error);
  }
}

// --- Hàm đọc thông báo ---
export async function getNotifile() {
  try {
    const token = await SecureStore.getItemAsync(NOTI_TOGGLE_KEY);
    return token; // Sẽ trả về null nếu không tìm thấy
  } catch (error) {
    console.error('Lỗi khi đọc thông báo:', error);
    return null;
  }
}

// --- Hàm xóa thông báo (khi logout) ---
export async function deleteNotifile() {
  try {
    await SecureStore.deleteItemAsync(NOTI_TOGGLE_KEY);
    console.log('✅ Thông báo đã được xóa.');
  } catch (error) {
    console.error('Lỗi khi xóa thông báo:', error);
  }
}