import { useAuth } from '@/store/auth';
import { hasAnyPermission, hasPermission } from '@/utils/permission';

/** 操作级权限判定：页面内按钮按「资源:edit」等派生权限控制显示 */
export function usePermission() {
  const { permissions, user } = useAuth();
  return {
    permissions,
    user,
    has: (code?: string) => hasPermission(permissions, code),
    hasAny: (codes: Array<string | undefined>) => hasAnyPermission(permissions, codes),
  };
}
