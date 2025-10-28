import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Base API URL - có thể config từ environment
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Tạo axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 60000, // 60 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static removeTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Decode JWT to check expiration (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }
}

// Request interceptor - tự động thêm bearer token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenManager.getToken();
    
    // Kiểm tra current page path để xác định có cần token không
    const currentPath = window.location.pathname;
    const isAdminPage = currentPath.startsWith('/admin/');
    const isLecturerPage = currentPath.startsWith('/lecturer/');
    const isLogoutRequest = config.url === '/public/logout';
    const isProtectedAPI = config.url?.startsWith('/lecturers/') || config.url?.startsWith('/alerts/') || config.url?.startsWith('/staffs/');
    
    // Thêm token nếu đang ở trang admin/lecturer hoặc là logout request hoặc gọi API protected
    if (token && (isAdminPage || isLecturerPage || isLogoutRequest || isProtectedAPI)) {
      // Chỉ thêm token nếu chưa có Authorization header
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data,
    });
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý token refresh và errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = TokenManager.getRefreshToken();
        if (refreshToken) {
          // Gọi API refresh token
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          TokenManager.setToken(accessToken);
          if (newRefreshToken) {
            TokenManager.setRefreshToken(newRefreshToken);
          }
          
          // Retry request với token mới
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('[Token Refresh Error]', refreshError);
        // TokenManager.removeTokens();
        // window.location.href = '/login';
        // return Promise.reject(refreshError);
      }
    }
    
    console.error(`[API Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    
    return Promise.reject(error);
  }
);

export { TokenManager };
export default axiosInstance;