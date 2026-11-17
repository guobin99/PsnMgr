import type { DomainSeed } from '@/types/navigation';

/** 报表中心：2 个分组、9 个页面 */
export const reportDomain: DomainSeed = {
  key: 'report',
  label: '报表中心',
  permission: 'report:view',
  description: '跨业务域综合运营报表与报表工具',
  groups: [
    {
      key: 'report-overview-group',
      label: '综合运营',
      items: [
        ['运营总览', '/report/overview', 'report:overview'],
        ['财务综合报表', '/report/finance', 'report:finance'],
        ['消费综合报表', '/report/consume', 'report:consume'],
        ['考勤综合报表', '/report/attendance', 'report:attendance'],
        ['门禁综合报表', '/report/access', 'report:access'],
        ['订餐综合报表', '/report/meal', 'report:meal'],
      ],
    },
    {
      key: 'report-tool-group',
      label: '报表工具',
      items: [
        ['报表模板', '/report/template', 'report:template'],
        ['常用报表', '/report/favorite', 'report:favorite'],
        ['导出任务', '/report/export-task', 'report:exportTask'],
      ],
    },
  ],
};

/** 系统管理：3 个分组、16 个页面 */
export const systemDomain: DomainSeed = {
  key: 'system',
  label: '系统管理',
  permission: 'system:view',
  description: '操作员与权限分配、系统参数与集成配置、安全审计日志',
  groups: [
    {
      key: 'system-org-group',
      label: '组织与权限',
      items: [
        ['操作员管理', '/system/operator', 'system:operator:view'],
        ['角色管理', '/system/role', 'system:role:view'],
        ['菜单与操作权限', '/system/permission', 'system:permission:view'],
        ['部门数据权限', '/system/dept-right', 'system:deptRight:view'],
        ['设备权限', '/system/device-right', 'system:deviceRight:view'],
        ['子系统权限', '/system/subsystem-right', 'system:subsystemRight:view'],
        ['出纳授权管理', '/system/cashier-auth', 'system:cashierAuth:view'],
      ],
    },
    {
      key: 'system-config-group',
      label: '系统配置',
      items: [
        ['系统参数', '/system/param', 'system:param:view'],
        ['数据字典', '/system/dict', 'system:dict:view'],
        ['接口与集成', '/system/integration', 'system:integration:view'],
        ['数据维护', '/system/maintain', 'system:maintain:view'],
        ['黑名单管理', '/system/blacklist', 'system:blacklist:view'],
      ],
    },
    {
      key: 'system-audit-group',
      label: '安全审计',
      items: [
        ['系统日志', '/system/log/system', 'system:log:system'],
        ['登录日志', '/system/log/login', 'system:log:login'],
        ['操作审计', '/system/log/oper', 'system:log:oper'],
        ['同步日志', '/system/log/sync', 'system:log:sync'],
      ],
    },
  ],
};
