import type { ReactNode } from 'react';
import {
  BarChartOutlined,
  CoffeeOutlined,
  DashboardOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type {
  CrumbItem,
  DomainMeta,
  DomainSeed,
  MenuSearchEntry,
  ModulePageMeta,
  NavNode,
} from '@/types/navigation';
import { hasPermission } from '@/utils/permission';
import { cardDomain } from './menu/card';
import { consumeDomain } from './menu/consume';
import { accessDomain, attendanceDomain } from './menu/attendance-access';
import { mealDomain, utilityDomain, visitorDomain } from './menu/meal-visitor-utility';
import { reportDomain, systemDomain } from './menu/report-system';

/** 业务域图标：只在总装处注入，分域数据文件不关心 UI */
const domainIcons: Record<string, ReactNode> = {
  card: <IdcardOutlined />,
  consume: <ShoppingCartOutlined />,
  attendance: <ScheduleOutlined />,
  access: <SafetyCertificateOutlined />,
  meal: <CoffeeOutlined />,
  visitor: <TeamOutlined />,
  utility: <ThunderboltOutlined />,
  report: <BarChartOutlined />,
  system: <SettingOutlined />,
};

/** 叶子键由路径派生：/card/report/cashier 得到 card-report-cashier */
export function leafKeyOf(path: string): string {
  return path.replace(/^\//, '').replace(/\//g, '-');
}

function buildDomain(seed: DomainSeed): NavNode {
  return {
    key: seed.key,
    label: seed.label,
    icon: domainIcons[seed.key],
    permission: seed.permission,
    description: seed.description,
    children: seed.groups.map((group) => ({
      key: group.key,
      label: group.label,
      children: group.items.map(([label, path, permission, description]) => ({
        key: leafKeyOf(path),
        label,
        path,
        permission,
        description,
      })),
    })),
  };
}

/** 工作台为独立一级节点，是页签体系的兜底回退目标 */
export const dashboardNode: NavNode = {
  key: 'dashboard',
  label: '工作台',
  path: '/dashboard',
  icon: <DashboardOutlined />,
  permission: 'dashboard:view',
  description: '平台运行概览、待办与常用业务入口',
};

/** 导航树：菜单、路由、面包屑、页签、搜索与占位页的唯一数据源 */
export const navigation: NavNode[] = [
  dashboardNode,
  buildDomain(cardDomain),
  buildDomain(consumeDomain),
  buildDomain(attendanceDomain),
  buildDomain(accessDomain),
  buildDomain(mealDomain),
  buildDomain(visitorDomain),
  buildDomain(utilityDomain),
  buildDomain(reportDomain),
  buildDomain(systemDomain),
];

/** 深度优先展开整棵树 */
export function flattenMenu(nodes: NavNode[] = navigation): NavNode[] {
  return nodes.flatMap((node) => [node, ...flattenMenu(node.children ?? [])]);
}

/** 只展开无子节点的叶子 */
export function flattenLeaves(nodes: NavNode[] = navigation): NavNode[] {
  return nodes.flatMap((node) => (node.children?.length ? flattenLeaves(node.children) : [node]));
}

export function findNodeByPath(pathname: string): NavNode | undefined {
  return flattenLeaves().find((node) => node.path === pathname);
}

/** 从业务域到当前节点的完整链路；路径不属于导航树时返回空数组 */
export function getMenuTrail(pathname: string): NavNode[] {
  const walk = (nodes: NavNode[], trail: NavNode[]): NavNode[] | undefined => {
    for (const node of nodes) {
      const next = [...trail, node];
      if (node.path === pathname) return next;
      const matched = node.children ? walk(node.children, next) : undefined;
      if (matched) return matched;
    }
    return undefined;
  };
  return walk(navigation, []) ?? [];
}

/** 取链路首节点，即当前路径所属业务域 */
export function getDomainOf(pathname: string): NavNode | undefined {
  const domain = getMenuTrail(pathname)[0];
  return domain && domain.key !== 'dashboard' ? domain : undefined;
}

/** 面包屑：由导航树链路直接生成，末项为当前页面且不可点击 */
export function getBreadcrumbs(pathname: string): CrumbItem[] {
  const trail = getMenuTrail(pathname);
  return trail.map((node, index) => ({
    key: node.key,
    label: node.label,
    path: index === trail.length - 1 ? undefined : node.path,
  }));
}

/** 菜单展开态：链路去掉末节点 */
export function getOpenKeys(pathname: string): string[] {
  return getMenuTrail(pathname)
    .slice(0, -1)
    .map((node) => node.key);
}

/** 递归按权限过滤；子项全被过滤则父节点消失（域权限码不参与判定） */
export function filterMenuByPermission(nodes: NavNode[], permissions: string[]): NavNode[] {
  return nodes.reduce<NavNode[]>((visible, node) => {
    if (node.children?.length) {
      const children = filterMenuByPermission(node.children, permissions);
      if (children.length > 0) visible.push({ ...node, children });
      return visible;
    }
    if (hasPermission(permissions, node.permission)) visible.push(node);
    return visible;
  }, []);
}

function firstLeafPath(node: NavNode): string | undefined {
  if (node.path) return node.path;
  for (const child of node.children ?? []) {
    const path = firstLeafPath(child);
    if (path) return path;
  }
  return undefined;
}

/** 顶栏业务域切换：只列出过滤后仍有可见页面的域 */
export function buildDomainEntries(nodes: NavNode[] = navigation): DomainMeta[] {
  return nodes
    .filter((node) => node.key !== 'dashboard' && (node.children?.length ?? 0) > 0)
    .map((node) => ({
      key: node.key,
      label: node.label,
      icon: node.icon,
      permission: node.permission,
      description: node.description,
      entryPath: firstLeafPath(node) ?? '/dashboard',
    }));
}

const REPORT_WORDS = ['报表', '明细', '汇总', '记录', '日志', '流水', '查询', '总览', '统计'];

/** 占位页元信息：标题、域、分组、说明、主操作与派生权限 */
export function getModulePageMeta(pathname: string): ModulePageMeta | undefined {
  const trail = getMenuTrail(pathname);
  const current = trail[trail.length - 1];
  if (!current?.path || current.path === '/dashboard' || !current.permission) return undefined;
  const domain = trail[0]?.label ?? '业务管理';
  const group = trail.length >= 3 ? trail[1].label : '';
  const isReport = REPORT_WORDS.some((word) => current.label.includes(word));
  const permission = current.permission;
  return {
    path: pathname,
    title: current.label,
    domain,
    group,
    description:
      current.description ??
      `统一维护${group ? `「${group}」下的` : ''}${current.label}业务，提供条件查询、业务办理与结果导出入口，数据口径与 CS 客户端保持一致。`,
    primaryAction: isReport ? '导出数据' : `新增${current.label.replace(/管理$/, '')}`,
    permission,
    editPermission: permission.endsWith(':view') ? `${permission.slice(0, -':view'.length)}:edit` : `${permission}:export`,
  };
}

/** 全局搜索索引：路径、名称、所属业务域、层级链路 */
export function buildMenuSearchIndex(nodes: NavNode[] = navigation): MenuSearchEntry[] {
  return flattenLeaves(nodes)
    .filter((node) => Boolean(node.path))
    .map((node) => {
      const trail = getMenuTrail(node.path!);
      const labels = trail.map((item) => item.label);
      return {
        path: node.path!,
        title: node.label,
        domain: trail[0]?.label ?? '',
        trail: labels.join(' / '),
        depth: trail.length,
      };
    });
}
