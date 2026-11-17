import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import ForbiddenPage from '@/pages/ForbiddenPage';
import { usePermission } from '@/hooks/usePermission';

interface PermissionGateProps {
  permission?: string;
  children: ReactNode;
}

/** 页面级权限守卫：直连越权时在路由出口内渲染 403，保留主框架与页签 */
export default function PermissionGate({ permission, children }: PermissionGateProps) {
  const location = useLocation();
  const { has } = usePermission();
  if (!has(permission)) {
    return <ForbiddenPage required={permission} from={location.pathname} />;
  }
  return <>{children}</>;
}
