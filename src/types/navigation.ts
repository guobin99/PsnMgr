import type { ReactNode } from 'react';

/** 导航树节点：工作台、业务域、分组、叶子共用同一结构 */
export interface NavNode {
  /** 全树唯一键；分组键以 -group 结尾，叶子键由路径派生 */
  key: string;
  label: string;
  /** 仅叶子节点有值，分组与业务域不可跳转 */
  path?: string;
  /** 业务域图标，由总装文件统一注入 */
  icon?: ReactNode;
  /** 叶子为页面级权限码，业务域为域级权限码，分组不设权限码 */
  permission?: string;
  /** 功能说明，用于占位页与菜单提示 */
  description?: string;
  children?: NavNode[];
}

/** 分域种子：叶子用元组书写，键由路径派生，避免手工维护出重复键 */
export type LeafSeed = readonly [label: string, path: string, permission: string, description?: string];

export interface GroupSeed {
  /** 分组键，形如 card-account-group */
  key: string;
  label: string;
  items: LeafSeed[];
}

export interface DomainSeed {
  key: string;
  label: string;
  permission: string;
  description: string;
  groups: GroupSeed[];
}

export interface CrumbItem {
  key: string;
  label: string;
  path?: string;
}

export interface DomainMeta {
  key: string;
  label: string;
  icon?: ReactNode;
  permission?: string;
  description?: string;
  entryPath: string;
}

export interface ModulePageMeta {
  path: string;
  title: string;
  domain: string;
  group: string;
  description: string;
  primaryAction: string;
  /** 页面级查看权限 */
  permission: string;
  /** 由查看权限派生的编辑类操作权限 */
  editPermission: string;
}

export interface MenuSearchEntry {
  path: string;
  title: string;
  domain: string;
  trail: string;
  depth: number;
}

export interface PageTab {
  key: string;
  path: string;
  title: string;
  closable: boolean;
}

export interface SessionUser {
  userId: string;
  userName: string;
  displayName: string;
  roleNo: string;
  roleName: string;
  deptName: string;
  permissions: string[];
}

export interface RoleDefinition {
  roleNo: string;
  roleName: string;
  deptName: string;
  permissions: string[];
}

export interface DemoAccount {
  userName: string;
  displayName: string;
  roleNo: string;
}
