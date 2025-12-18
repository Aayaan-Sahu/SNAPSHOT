import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEV_IP = '192.168.68.58';
const BASE_URL = `http://${DEV_IP}:8080`;
const AUTH_TOKEN_KEY = 'auth_token';

let webTokenCache: string | null = null;

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webTokenCache;
  }
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webTokenCache = value;
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webTokenCache = null;
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function setAuthToken(token: string): Promise<void> {
  await secureSet(AUTH_TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  return await secureGet(AUTH_TOKEN_KEY);
}

export async function deleteAuthToken(): Promise<void> {
  await secureDelete(AUTH_TOKEN_KEY);
}

export const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAuthToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API] Injected token -> ${config.method?.toUpperCase()} ${config.url}`);
    } else {
      console.log(`[API] No token -> ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401) {
      console.warn('[API] 401 Unauthorized (token missing/expired/invalid');
    }
    return Promise.reject(error);
  }
)