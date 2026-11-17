/** 权限匹配：未声明要求视为公开，空集合视为拒绝，支持全局通配与前缀通配 */
export function hasPermission(permissions: string[] | undefined, required?: string): boolean {
  if (!required) return true;
  if (!permissions || permissions.length === 0) return false;
  return permissions.some((grant) => {
    if (grant === '*') return true;
    if (grant === required) return true;
    if (grant.endsWith(':*') && required.startsWith(grant.slice(0, -1))) return true;
    return false;
  });
}

/** 任一命中即通过 */
export function hasAnyPermission(permissions: string[] | undefined, required: Array<string | undefined>): boolean {
  return required.some((code) => hasPermission(permissions, code));
}

/** 权限码转可读文案，供 403 页面展示 */
export function describePermission(code?: string): string {
  return code ? code.split(':').join(' · ') : '未声明';
}

/** 判断当前权限集合是否拥有某业务域下的任意页面权限 */
export function hasDomainAccess(permissions: string[] | undefined, domainKey: string): boolean {
  return hasPermission(permissions, `${domainKey}:*`) || (permissions ?? []).some((code) => code.startsWith(`${domainKey}:`));
}
