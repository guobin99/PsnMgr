import { lazy, type ComponentType } from 'react';

/**
 * 业务真实页面注册表：路径 -> 懒加载组件。
 * 未注册的路径在路由中回退到通用 ModulePage 占位组件。
 */
const registry: Record<string, ComponentType> = {
  '/system/operator': lazy(() => import('@/pages/system/OperatorPage')),
  '/system/role': lazy(() => import('@/pages/system/RolePage')),
  '/system/permission': lazy(() => import('@/pages/system/PermissionPage')),
  '/system/dept-right': lazy(() => import('@/pages/system/DeptRightPage')),
  '/system/device-right': lazy(() => import('@/pages/system/DeviceRightPage')),
  '/system/subsystem-right': lazy(() => import('@/pages/system/SubsystemRightPage')),
  '/system/cashier-auth': lazy(() => import('@/pages/system/CashierAuthPage')),

  // 系统配置
  '/system/param': lazy(() => import('@/pages/system/ParamPage')),
  '/system/dict': lazy(() => import('@/pages/system/DictPage')),
  '/system/integration': lazy(() => import('@/pages/system/IntegrationPage')),
  '/system/maintain': lazy(() => import('@/pages/system/MaintainPage')),
  '/system/blacklist': lazy(() => import('@/pages/system/BlacklistPage')),

  // 安全审计
  '/system/log/system': lazy(() => import('@/pages/system/SystemLogPage')),
  '/system/log/login': lazy(() => import('@/pages/system/LoginLogPage')),
  '/system/log/oper': lazy(() => import('@/pages/system/OperLogPage')),
  '/system/log/sync': lazy(() => import('@/pages/system/SyncLogPage')),

  // 卡务中心-人员与组织
  '/card/person': lazy(() => import('@/pages/card/PersonPage')),
  '/card/dept': lazy(() => import('@/pages/card/DeptPage')),
  '/card/code': lazy(() => import('@/pages/card/CodePage')),
  '/card/face': lazy(() => import('@/pages/card/FacePage')),
  '/card/import': lazy(() => import('@/pages/card/ImportPage')),

  // 卡务中心-账户与卡
  '/card/account': lazy(() => import('@/pages/card/AccountInfoPage')),
  '/card/account-type': lazy(() => import('@/pages/card/AccountTypePage')),
  '/card/account-open': lazy(() => import('@/pages/card/AccountOpenPage')),
  '/card/freeze': lazy(() => import('@/pages/card/FreezePage')),
  '/card/card-change': lazy(() => import('@/pages/card/CardChangePage')),
  '/card/card-loss': lazy(() => import('@/pages/card/CardLossPage')),
  '/card/card-import': lazy(() => import('@/pages/card/IdCardImportPage')),
  '/card/personal': lazy(() => import('@/pages/card/PersonalAccountPage')),
};

/** 查找路径对应的真实页面；未注册返回 null，由调用方回退占位组件 */
export function resolvePage(path?: string): ComponentType | null {
  if (!path) return null;
  return registry[path] ?? null;
}
