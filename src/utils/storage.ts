/** 本地存储键：统一 psnmgr 前缀 */
export const STORAGE_KEYS = {
  token: 'psnmgr.auth.token',
  user: 'psnmgr.auth.user',
  collapsed: 'psnmgr.layout.collapsed',
  theme: 'psnmgr.layout.theme',
  loginUserName: 'psnmgr.login.userName',
} as const;

/** 安全读取：存储不可用或解析失败时返回空值，不抛出 */
export function readStorage<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function readText(key: string): string | undefined {
  try {
    return window.localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 隐私模式等场景下静默失败 */
  }
}

export function writeText(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 同上 */
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* 同上 */
  }
}
