import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { readText, STORAGE_KEYS } from '@/utils/storage';

/** 全局未授权事件：任一接口 401 时派发一次，由会话上下文统一清理 */
export const UNAUTHORIZED_EVENT = 'psnmgr:unauthorized';

const SUCCESS_CODES: Array<string | number> = [0, 200, '0', '200', 'SUCCESS', 'OK'];

export class ApiError extends Error {
  code?: string | number;

  status?: number;

  /** 网络层异常（超时、断网、服务未启动），演示登录回退据此判定 */
  network: boolean;

  constructor(message: string, options: { code?: string | number; status?: number; network?: boolean } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = options.code;
    this.status = options.status;
    this.network = options.network ?? false;
  }
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = readText(STORAGE_KEYS.token);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function normalizeError(error: unknown): ApiError {
  const axiosError = error as AxiosError<{ message?: string }>;
  if (!axiosError.response) {
    return new ApiError('网络异常或服务不可用，请稍后重试', { network: true });
  }
  const status = axiosError.response.status;
  if (status === 502 || status === 503 || status === 504) {
    return new ApiError('服务未启动或暂不可用，请稍后重试', { status, network: true });
  }
  if (status === 401) {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    return new ApiError('登录状态已失效，请重新登录', { status, network: false });
  }
  if (status === 403) {
    return new ApiError('无权限访问该资源', { status, network: false });
  }
  return new ApiError(axiosError.response.data?.message ?? '服务返回异常，请稍后重试', { status, network: false });
}

client.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeError(error)),
);

interface ResponseBody<T> {
  code?: string | number;
  message?: string;
  data?: T;
}

/** 统一返回体解包：只依 code 判定成功，异常统一抛出 ApiError */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await client.request<ResponseBody<T> | T>(config);
  const body = response.data;
  if (body && typeof body === 'object' && 'code' in (body as ResponseBody<T>)) {
    const envelope = body as ResponseBody<T>;
    if (!SUCCESS_CODES.includes(envelope.code as string | number)) {
      throw new ApiError(envelope.message ?? '服务返回异常，请稍后重试', { code: envelope.code, status: response.status });
    }
    return envelope.data as T;
  }
  return body as T;
}

export default client;
