import type { DemoAccount, RoleDefinition, SessionUser } from '@/types/navigation';

/** 开发环境演示密码；生产构建关闭演示登录后不再使用 */
export const DEMO_PASSWORD = '123456';

/** 六个演示角色：正式环境由后端按 CS 权限表（ST_RoleRight / ST_RightInfo）下发 */
export const roles: RoleDefinition[] = [
  {
    roleNo: 'R_ADMIN',
    roleName: '系统管理员',
    deptName: '信息中心',
    permissions: ['*'],
  },
  {
    roleNo: 'R_CASHIER',
    roleName: '卡务出纳',
    deptName: '财务处',
    permissions: [
      'dashboard:view',
      'card:*',
      'consume:record:*',
      'consume:report:*',
      'consume:summary:*',
      'report:*',
      'system:log:*',
    ],
  },
  {
    roleNo: 'R_HR',
    roleName: '人事考勤',
    deptName: '人力资源部',
    permissions: [
      'dashboard:view',
      'attendance:*',
      'card:person:view',
      'card:dept:view',
      'card:face:view',
      'card:report:roster',
      'visitor:*',
      'report:overview',
      'report:attendance',
    ],
  },
  {
    roleNo: 'R_SECURITY',
    roleName: '门禁安保',
    deptName: '保卫处',
    permissions: [
      'dashboard:view',
      'access:*',
      'visitor:*',
      'card:person:view',
      'card:face:view',
      'report:overview',
      'report:access',
    ],
  },
  {
    roleNo: 'R_CANTEEN',
    roleName: '食堂消费',
    deptName: '后勤服务集团',
    permissions: [
      'dashboard:view',
      'consume:*',
      'meal:*',
      'card:person:view',
      'report:overview',
      'report:consume',
      'report:meal',
    ],
  },
  {
    roleNo: 'R_VIEWER',
    roleName: '运营查看',
    deptName: '校务办公室',
    permissions: ['dashboard:view', 'report:*'],
  },
];

export const demoAccounts: DemoAccount[] = [
  { userName: 'admin', displayName: '系统管理员', roleNo: 'R_ADMIN' },
  { userName: 'cashier', displayName: '出纳 - 张明', roleNo: 'R_CASHIER' },
  { userName: 'hr', displayName: '考勤 - 李慧', roleNo: 'R_HR' },
  { userName: 'security', displayName: '安保 - 王强', roleNo: 'R_SECURITY' },
  { userName: 'canteen', displayName: '食堂 - 赵磊', roleNo: 'R_CANTEEN' },
  { userName: 'viewer', displayName: '运营 - 陈婷', roleNo: 'R_VIEWER' },
];

export function findRole(roleNo: string): RoleDefinition | undefined {
  return roles.find((role) => role.roleNo === roleNo);
}

/** 演示态构造会话用户，字段结构与正式环境一致，切换正式环境无需改动前端 */
export function buildDemoUser(account: DemoAccount): SessionUser | undefined {
  const role = findRole(account.roleNo);
  if (!role) return undefined;
  return {
    userId: `U${account.userName.toUpperCase()}`,
    userName: account.userName,
    displayName: account.displayName,
    roleNo: role.roleNo,
    roleName: role.roleName,
    deptName: role.deptName,
    permissions: role.permissions,
  };
}

export function findDemoAccount(userName: string): DemoAccount | undefined {
  return demoAccounts.find((account) => account.userName === userName.trim().toLowerCase());
}
