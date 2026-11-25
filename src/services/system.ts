import { request } from '@/services/http';
import type {
  CashierAuth,
  DepartmentTreeNode,
  Device,
  DeviceRightItem,
  MenuRight,
  MenuTreeNode,
  Operator,
  OperatorDetail,
  PagedResult,
  Role,
  RoleRightItem,
  SaveResult,
  Subsystem,
  SubsystemOption,
} from '@/types/system';

/* ---------------- 组织树 ---------------- */

export function fetchDepartmentTree(
  includeDisabled = false,
  countMode?: 'active',
): Promise<DepartmentTreeNode[]> {
  return request<DepartmentTreeNode[]>({
    url: '/system/departments/tree',
    method: 'get',
    params: { includeDisabled, countMode },
  });
}

/* ---------------- 操作员管理 ---------------- */

export interface OperatorQuery {
  keyword?: string;
  roleNo?: string;
  deptId?: number;
  userType?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function fetchOperators(query: OperatorQuery): Promise<PagedResult<Operator>> {
  return request<PagedResult<Operator>>({ url: '/system/operators', method: 'get', params: query });
}

export function fetchOperator(userNo: string): Promise<OperatorDetail> {
  return request<OperatorDetail>({ url: `/system/operators/${encodeURIComponent(userNo)}`, method: 'get' });
}

export function createOperator(data: object): Promise<{ userNo: string }> {
  return request<{ userNo: string }>({ url: '/system/operators', method: 'post', data });
}

export function updateOperator(userNo: string, data: object): Promise<{ userNo: string }> {
  return request<{ userNo: string }>({
    url: `/system/operators/${encodeURIComponent(userNo)}`,
    method: 'put',
    data,
  });
}

export function deleteOperator(userNo: string): Promise<{ userNo: string }> {
  return request<{ userNo: string }>({
    url: `/system/operators/${encodeURIComponent(userNo)}`,
    method: 'delete',
  });
}

export function restoreOperator(userNo: string): Promise<{ userNo: string }> {
  return request<{ userNo: string }>({
    url: `/system/operators/${encodeURIComponent(userNo)}/restore`,
    method: 'post',
  });
}

export function resetOperatorPassword(userNo: string): Promise<{ userNo: string; tempPassword: string }> {
  return request<{ userNo: string; tempPassword: string }>({
    url: `/system/operators/${encodeURIComponent(userNo)}/reset-password`,
    method: 'post',
  });
}

export function unlockOperator(userNo: string): Promise<{ userNo: string }> {
  return request<{ userNo: string }>({
    url: `/system/operators/${encodeURIComponent(userNo)}/unlock`,
    method: 'post',
  });
}

export function changeOperatorStatus(userNo: string, enabled: boolean): Promise<{ userNo: string }> {
  return request<{ userNo: string }>({
    url: `/system/operators/${encodeURIComponent(userNo)}/status`,
    method: 'put',
    data: { Enabled: enabled },
  });
}

export function exportOperators(): Promise<{ exportId: string; async: boolean }> {
  return request<{ exportId: string; async: boolean }>({ url: '/system/operators/export', method: 'get' });
}

/* ---------------- 角色管理 ---------------- */

export function fetchRoles(keyword?: string): Promise<Role[]> {
  return request<Role[]>({ url: '/system/roles', method: 'get', params: { keyword } });
}

export function fetchRole(roleNo: string): Promise<Role> {
  return request<Role>({ url: `/system/roles/${encodeURIComponent(roleNo)}`, method: 'get' });
}

export function createRole(data: { Role_No: string; Role_Name: string; Remark?: string }): Promise<{ roleNo: string }> {
  return request<{ roleNo: string }>({ url: '/system/roles', method: 'post', data });
}

export function updateRole(roleNo: string, data: { Role_Name?: string; Remark?: string }): Promise<{ roleNo: string }> {
  return request<{ roleNo: string }>({
    url: `/system/roles/${encodeURIComponent(roleNo)}`,
    method: 'put',
    data,
  });
}

export function deleteRole(roleNo: string): Promise<{ roleNo: string }> {
  return request<{ roleNo: string }>({ url: `/system/roles/${encodeURIComponent(roleNo)}`, method: 'delete' });
}

export function copyRole(
  roleNo: string,
  data: { NewRole_No: string; NewRole_Name: string; Remark?: string },
): Promise<{ roleNo: string; copiedRightCount: number }> {
  return request<{ roleNo: string; copiedRightCount: number }>({
    url: `/system/roles/${encodeURIComponent(roleNo)}/copy`,
    method: 'post',
    data,
  });
}

export function fetchRoleMembers(roleNo: string): Promise<{
  roleNo: string;
  members: Array<{ User_No: string; User_Name: string; deptId?: number | null }>;
}> {
  return request({ url: `/system/roles/${encodeURIComponent(roleNo)}/members`, method: 'get' });
}

/* ---------------- 菜单与操作权限 ---------------- */

export function fetchSubsystems(): Promise<Subsystem[]> {
  return request<Subsystem[]>({ url: '/system/subsystems', method: 'get' });
}

export function fetchMenuTree(systemNo = 'BS'): Promise<MenuTreeNode[]> {
  return request<MenuTreeNode[]>({ url: '/system/menus/tree', method: 'get', params: { systemNo } });
}

export function fetchMenuRights(menuId: number): Promise<{ menuId: number; rights: MenuRight[] }> {
  return request({ url: `/system/menus/${menuId}/rights`, method: 'get' });
}

export function fetchRoleRights(roleNo: string, systemNo = 'BS'): Promise<{ systemNo: string; items: RoleRightItem[] }> {
  return request({
    url: `/system/roles/${encodeURIComponent(roleNo)}/rights`,
    method: 'get',
    params: { systemNo },
  });
}

export function saveRoleRights(
  roleNo: string,
  systemNo: string,
  items: RoleRightItem[],
): Promise<SaveResult & { skippedCount: number }> {
  return request<SaveResult & { skippedCount: number }>({
    url: `/system/roles/${encodeURIComponent(roleNo)}/rights`,
    method: 'put',
    data: { System_No: systemNo, Items: items },
  });
}

/* ---------------- 部门数据权限 ---------------- */

export interface DeptRightInfo {
  scopeType: number;
  ownerDeptId?: number | null;
  deptIds: number[];
  coveredCount: number;
  summary?: string | null;
  updatedTime?: string | null;
  readonlyScope: boolean;
}

export function fetchDeptRight(userNo: string): Promise<DeptRightInfo> {
  return request<DeptRightInfo>({ url: `/system/dept-rights/${encodeURIComponent(userNo)}`, method: 'get' });
}

export function saveDeptRight(
  userNo: string,
  scopeType: number,
  deptIds: number[],
  remark?: string,
): Promise<SaveResult> {
  return request<SaveResult>({
    url: `/system/dept-rights/${encodeURIComponent(userNo)}`,
    method: 'put',
    data: { Scope_Type: scopeType, Dept_IDs: deptIds, Remark: remark },
  });
}

export function previewDeptRight(
  userNo: string,
  scopeType: number,
  deptIds: number[],
): Promise<{ coveredCount: number; personCount: number }> {
  return request({
    url: `/system/dept-rights/${encodeURIComponent(userNo)}/preview`,
    method: 'get',
    params: { scopeType, deptIds: deptIds.join(',') },
  });
}

/* ---------------- 设备权限 ---------------- */

export function fetchDevices(query: {
  systemNo?: string;
  areaNo?: string;
  mocType?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<Device>> {
  return request<PagedResult<Device>>({ url: '/system/devices', method: 'get', params: query });
}

export function fetchDeviceRights(userNo: string): Promise<{
  userNo: string;
  isCashier: boolean;
  userMoc?: string | null;
  items: DeviceRightItem[];
}> {
  return request({ url: `/system/device-rights/${encodeURIComponent(userNo)}`, method: 'get' });
}

export function saveDeviceRights(userNo: string, items: DeviceRightItem[]): Promise<SaveResult> {
  return request<SaveResult>({
    url: `/system/device-rights/${encodeURIComponent(userNo)}`,
    method: 'put',
    data: { Items: items.map((item) => ({ Moc_No: item.mocNo, Right_Level: item.rightLevel })) },
  });
}

/* ---------------- 子系统权限 ---------------- */

export function fetchSubsystemOptions(roleNo?: string): Promise<SubsystemOption[]> {
  return request<SubsystemOption[]>({
    url: '/system/subsystem-rights/options',
    method: 'get',
    params: { roleNo },
  });
}

export function fetchSubsystemRights(userNo: string): Promise<{
  userNo: string;
  systemNos: string[];
  unrestricted: boolean;
}> {
  return request({ url: `/system/subsystem-rights/${encodeURIComponent(userNo)}`, method: 'get' });
}

export function saveSubsystemRights(userNo: string, systemNos: string[]): Promise<SaveResult> {
  return request<SaveResult>({
    url: `/system/subsystem-rights/${encodeURIComponent(userNo)}`,
    method: 'put',
    data: { System_Nos: systemNos },
  });
}

/* ---------------- 出纳授权 ---------------- */

export function fetchCashierAuths(query: {
  keyword?: string;
  onlyCashier?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<CashierAuth>> {
  return request<PagedResult<CashierAuth>>({ url: '/system/cashier-auths', method: 'get', params: query });
}

export function fetchCashierAuth(userNo: string): Promise<{
  userNo: string;
  userName: string;
  isCashier: boolean;
  cardNo?: string | null;
  mocNos: string[];
  remark?: string | null;
}> {
  return request({ url: `/system/cashier-auths/${encodeURIComponent(userNo)}`, method: 'get' });
}

export function fetchCashierDevices(): Promise<Device[]> {
  return request<Device[]>({ url: '/system/cashier-auths/devices', method: 'get' });
}

export function saveCashierAuth(
  userNo: string,
  data: { Is_Cashier: boolean; Card_No?: string; Moc_Nos?: string[]; Remark?: string },
): Promise<SaveResult & { userType: number; cardNo?: string | null; mocNos: string[] }> {
  return request({
    url: `/system/cashier-auths/${encodeURIComponent(userNo)}`,
    method: 'put',
    data,
  });
}
