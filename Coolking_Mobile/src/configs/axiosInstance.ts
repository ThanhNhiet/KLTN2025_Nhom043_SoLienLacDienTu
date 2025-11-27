import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { deleteRefreshToken, getRefreshToken, saveRefreshToken } from '@/src/utils/TokenManager';

const axiosInstance = axios.create({ timeout: 30000 });

// ====== CONFIG ======
const AUTH_ENDPOINT = '/api/public/login';
const REFRESH_ENDPOINT = '/api/public/refresh-token';
const LOGOUT_ENDPOINT = '/api/public/logout';

// ====== Refresh Queue ======
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v?: unknown) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token as unknown);
  });
  failedQueue = [];
};

// ====== Helpers ======
const isAbsoluteUrl = (url?: string) => !!url && (/^https?:\/\//i.test(url) || url.startsWith('//'));

const shouldSkipAuthHeader = (url?: string) => {
  if (!url) return false;
  return (
    url.includes(AUTH_ENDPOINT) ||
    url.includes(REFRESH_ENDPOINT) ||
    url.includes(LOGOUT_ENDPOINT)
  );
};

const setAuthHeader = (config: AxiosRequestConfig, token: string) => {
  config.headers = {
    ...(config.headers || {}),
    Authorization: `Bearer ${token}`,
  };
};

const getBase = async () => {
  const base = await AsyncStorage.getItem('url');
  return base || 'https://e-contact-book-coolking-kvt4.onrender.com';
};

// ====== Request Interceptor ======
axiosInstance.interceptors.request.use(
  async (config) => {
    const base = await getBase();
    if (base && !isAbsoluteUrl(config.url)) {
      config.baseURL = base;
    }
    if (!shouldSkipAuthHeader(config.url)) {
      const token = await AsyncStorage.getItem('token');
      if (token) setAuthHeader(config, token);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ====== Response Interceptor ======
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config || {};

    // Timeout
    if ((error as any).code === 'ECONNABORTED' && (error.message || '').includes('timeout')) {
      return Promise.reject({
        message: 'error network',
        code: 'NETWORK_TIMEOUT',
        originalError: error,
      });
    }

    const isAuthReq = originalRequest?.url?.includes(AUTH_ENDPOINT);
    const isRefreshReq = originalRequest?.url?.includes(REFRESH_ENDPOINT);
    const isLogoutReq = originalRequest?.url?.includes(LOGOUT_ENDPOINT);
    if (isAuthReq || isRefreshReq || isLogoutReq) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // Một số API trả 401 hoặc 403 khi access token hết hạn
    const shouldAttemptRefresh =
      (status === 401 || status === 403) && !originalRequest._retry;

    if (shouldAttemptRefresh) {
      // Nếu đang refresh: xếp vào hàng đợi, CHÚ Ý dùng token trả về
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken: any) => {
          // set lại baseURL & header trước khi retry
          return (async () => {
            const base = await getBase();
            if (base && !isAbsoluteUrl(originalRequest.url)) {
              originalRequest.baseURL = base;
            }
            if (newToken) {
              setAuthHeader(originalRequest, String(newToken));
            }
            return axiosInstance(originalRequest);
          })();
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const [refreshToken, base] = await Promise.all([
          getRefreshToken(),
          getBase(),
        ]);

        if (!refreshToken) throw new Error('No refresh token available');
        if (!base) throw new Error('No base URL configured');

        // DÙNG axios gốc để tránh interceptor
        const tokenResponse = await axios.post(`${base}${REFRESH_ENDPOINT}`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = (tokenResponse as any)?.data?.access_token;
        const newRefreshToken = (tokenResponse as any)?.data?.refresh_token;

        if (!newAccessToken) throw new Error('No access token received');

        // Lưu token mới trước khi đánh thức queue
        await AsyncStorage.setItem('token', newAccessToken);
        await deleteRefreshToken();
        if (newRefreshToken) await saveRefreshToken(newRefreshToken);

        // Đánh thức queue -> truyền token mới
        processQueue(null, newAccessToken);

        // Set lại header + baseURL cho request gốc rồi retry
        if (base && !isAbsoluteUrl(originalRequest.url)) {
          originalRequest.baseURL = base;
        }
        setAuthHeader(originalRequest, newAccessToken);

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.warn('Refresh token failed:', refreshError);

        await AsyncStorage.removeItem('token');
        await deleteRefreshToken();

        processQueue(refreshError, null);
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
