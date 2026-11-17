import type { SessionUser } from '@/types/navigation';
import { buildDemoUser, DEMO_PASSWORD, findDemoAccount } from '@/config/roles';
import { ApiError, request } from './http';

export interface LoginResult {
  token: string;
  user: SessionUser;
}

interface LoginPayload {
  userName: string;
  password: string;
}

const demoEnabled = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

function demoLogin({ userName, password }: LoginPayload): LoginResult {
  const account = findDemoAccount(userName);
  if (!account || password !== DEMO_PASSWORD) {
    throw new ApiError('账号或密码错误，请重试');
  }
  const user = buildDemoUser(account);
  if (!user) {
    throw new ApiError('演示账号对应的角色未配置');
  }
  return { token: `demo-token.${account.userName}.${Date.now()}`, user };
}

/** 登录：后端不可达时按演示开关回退到本地演示角色 */
export async function login(payload: LoginPayload): Promise<LoginResult> {
  try {
    return await request<LoginResult>({ url: '/auth/login', method: 'post', data: payload });
  } catch (error) {
    if (demoEnabled && error instanceof ApiError && error.network) {
      return demoLogin(payload);
    }
    throw error;
  }
}

export async function fetchProfile(): Promise<SessionUser> {
  return request<SessionUser>({ url: '/auth/profile', method: 'post' });
}

export async function logout(): Promise<void> {
  try {
    await request<void>({ url: '/auth/logout', method: 'post' });
  } catch {
    /* 退出接口失败不阻塞本地会话清理 */
  }
}
