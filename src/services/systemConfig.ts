import { request } from '@/services/http';
import type {
  BlacklistItem,
  CardLookup,
  CleanupPreview,
  ConsistencyItem,
  DictItem,
  DictMetaColumn,
  DictMetaField,
  DictMetaResult,
  DictTable,
  Endpoint,
  ExportResult,
  FragmentationItem,
  LoginLog,
  LoginStatistics,
  MaintJob,
  MaintModeInfo,
  MaintStep,
  OperLog,
  ParamBackup,
  ParamListResult,
  ParamScopeNode,
  SyncLog,
  SyncTask,
  SystemLog,
} from '@/types/systemConfig';

/* ---------------- 系统参数 ---------------- */

export function fetchParamGroups(): Promise<ParamScopeNode[]> {
  return request<ParamScopeNode[]>({ url: '/system/params/groups', method: 'get' });
}

export function fetchParams(scope: string, groupName?: string, keyword?: string): Promise<ParamListResult> {
  return request<ParamListResult>({ url: '/system/params', method: 'get', params: { scope, groupName, keyword } });
}

export function saveParams(scope: string, items: Array<{ paramCode: string; value: string; oldValue?: string }>) {
  return request<{ savedCount: number; skippedCount: number; needRestart: string[]; version: number }>({
    url: '/system/params',
    method: 'put',
    data: { Scope: scope, Items: items },
  });
}

export function resetParams(scope: string, codes: string[]) {
  return request<{ changedCount: number; skippedCount: number; needRestart: string[]; version: number }>({
    url: '/system/params/reset',
    method: 'post',
    data: { Scope: scope, Codes: codes },
  });
}

export function fetchParamBackups(scope?: string): Promise<ParamBackup[]> {
  return request<ParamBackup[]>({ url: '/system/params/backups', method: 'get', params: { scope } });
}

export function createParamBackup(scope: string, name?: string, remark?: string) {
  return request<{ backupId: number; itemCount: number }>({
    url: '/system/params/backups',
    method: 'post',
    data: { Scope: scope, Name: name, Remark: remark },
  });
}

export function restoreParamBackup(backupId: number) {
  return request<{ changedCount: number; version: number }>({
    url: `/system/params/backups/${backupId}/restore`,
    method: 'post',
  });
}

export function deleteParamBackup(backupId: number) {
  return request<{ backupId: number }>({ url: `/system/params/backups/${backupId}`, method: 'delete' });
}

export interface ParamImportPlan {
  newCount: number;
  modifiedCount: number;
  unchanged: string[];
  conflicts: string[];
  changes: Array<{ code: string; value?: string; oldValue?: string; isNew: boolean }>;
}

export function previewParamImport(scope: string, items: Array<{ code: string; value: string }>) {
  return request<ParamImportPlan>({
    url: '/system/params/import/preview',
    method: 'post',
    data: { Scope: scope, Items: items },
  });
}

export function importParams(scope: string, items: Array<{ code: string; value: string }>) {
  return request<{ savedCount: number; skippedCount: number; version: number }>({
    url: '/system/params/import',
    method: 'post',
    data: { Scope: scope, Items: items },
  });
}

export function exportParams(scope: string): Promise<ExportResult> {
  return request<ExportResult>({ url: '/system/params/export', method: 'get', params: { scope } });
}

/* ---------------- 数据字典 ---------------- */

export function fetchDictTables(keyword?: string): Promise<DictTable[]> {
  return request<DictTable[]>({ url: '/system/dict/tables', method: 'get', params: { keyword } });
}

export function fetchDictItems(tableName: string, keyword?: string, page = 1, pageSize = 50) {
  return request<{ total: number; items: DictItem[] }>({
    url: '/system/dict/items',
    method: 'get',
    params: { tableName, keyword, page, pageSize },
  });
}

export function createDictItem(data: {
  TableName: string;
  Dict_Id?: string;
  Dict_Value: string;
  Is_SysCol?: boolean;
  Remark?: string;
}) {
  return request<{ id: number; dictId: string }>({ url: '/system/dict/items', method: 'post', data });
}

export function updateDictItem(
  id: number,
  data: { Dict_Id?: string; Dict_Value?: string; Remark?: string; OldDict_Id?: string; OldDict_Value?: string },
) {
  return request<{ id: number }>({ url: `/system/dict/items/${id}`, method: 'put', data });
}

export function deleteDictItem(id: number) {
  return request<{ id: number }>({ url: `/system/dict/items/${id}`, method: 'delete' });
}

export function importDictItems(tableName: string, items: Array<{ dictId: string; dictValue: string }>, overwrite: boolean) {
  return request<{ inserted: number; updated: number; skipped: number }>({
    url: '/system/dict/items/import',
    method: 'post',
    data: { TableName: tableName, Items: items, Overwrite: overwrite },
  });
}

export function exportDictItems(tableName: string): Promise<ExportResult> {
  return request<ExportResult>({ url: '/system/dict/items/export', method: 'get', params: { tableName } });
}

export function fetchDictMetaTables(): Promise<DictMetaResult<DictTable>> {
  return request<DictMetaResult<DictTable>>({ url: '/system/dict/meta/tables', method: 'get' });
}

export function fetchDictMetaFields(tableName?: string): Promise<DictMetaResult<DictMetaField>> {
  return request<DictMetaResult<DictMetaField>>({ url: '/system/dict/meta/fields', method: 'get', params: { tableName } });
}

export function fetchDictMetaColumns(tableName?: string): Promise<DictMetaResult<DictMetaColumn>> {
  return request<DictMetaResult<DictMetaColumn>>({ url: '/system/dict/meta/columns', method: 'get', params: { tableName } });
}

export function syncDictMeta(tableName: string) {
  return request<{ inserted: number; updated: number; pending: number }>({
    url: '/system/dict/meta/sync',
    method: 'post',
    data: { TableName: tableName },
  });
}

export function fetchConsistency(tableName?: string) {
  return request<{ metaAvailable: boolean; items: ConsistencyItem[] }>({
    url: '/system/dict/consistency',
    method: 'get',
    params: { tableName },
  });
}

export function buildFixScript(): Promise<ExportResult> {
  return request<ExportResult>({ url: '/system/dict/consistency/fix-script', method: 'post' });
}

/* ---------------- 接口与集成 ---------------- */

export function fetchEndpoints(params?: { type?: string; keyword?: string }): Promise<Endpoint[]> {
  return request<Endpoint[]>({ url: '/system/integrations', method: 'get', params });
}

export function fetchEndpoint(code: string): Promise<Endpoint> {
  return request<Endpoint>({ url: `/system/integrations/${encodeURIComponent(code)}`, method: 'get' });
}

export function createEndpoint(data: object) {
  return request<{ endpointCode: string }>({ url: '/system/integrations', method: 'post', data });
}

export function updateEndpoint(code: string, data: object) {
  return request<{ endpointCode: string }>({ url: `/system/integrations/${encodeURIComponent(code)}`, method: 'put', data });
}

export function setEndpointSecret(code: string, secret: string, confirm: string, reason: string) {
  return request<{ endpointCode: string }>({
    url: `/system/integrations/${encodeURIComponent(code)}/secret`,
    method: 'put',
    data: { Secret: secret, Secret_Confirm: confirm, Reason: reason },
  });
}

export function rollbackEndpointSecret(code: string, reason?: string) {
  return request<{ endpointCode: string }>({
    url: `/system/integrations/${encodeURIComponent(code)}/secret/rollback`,
    method: 'post',
    data: { Reason: reason },
  });
}

export function toggleEndpoint(code: string, enabled: boolean) {
  return request<{ endpointCode: string; isEnabled: boolean }>({
    url: `/system/integrations/${encodeURIComponent(code)}/enabled`,
    method: 'put',
    data: { Enabled: enabled },
  });
}

export function testEndpoint(code: string) {
  return request<{ success: boolean; elapsed: number; message: string; healthStatus: number }>({
    url: `/system/integrations/${encodeURIComponent(code)}/test`,
    method: 'post',
  });
}

export function fetchSyncTasks(params?: { endpointCode?: string; keyword?: string }): Promise<SyncTask[]> {
  return request<SyncTask[]>({ url: '/system/integrations/tasks', method: 'get', params });
}

export function updateSyncTask(code: string, data: object) {
  return request<{ taskCode: string }>({
    url: `/system/integrations/tasks/${encodeURIComponent(code)}`,
    method: 'put',
    data,
  });
}

export function runSyncTask(code: string) {
  return request<{ taskCode: string; status: number; traceId?: string; archived?: number }>({
    url: `/system/integrations/tasks/${encodeURIComponent(code)}/run`,
    method: 'post',
  });
}

/* ---------------- 数据维护 ---------------- */

export function fetchMaintJobs(params?: { jobType?: string; status?: number; page?: number; pageSize?: number }) {
  return request<{ total: number; items: MaintJob[] }>({ url: '/system/maintenance/jobs', method: 'get', params });
}

export function fetchMaintJob(jobId: number) {
  return request<{ job: MaintJob; steps: MaintStep[] }>({ url: `/system/maintenance/jobs/${jobId}`, method: 'get' });
}

export function fetchMaintMode(): Promise<MaintModeInfo> {
  return request<MaintModeInfo>({ url: '/system/maintenance/mode', method: 'get' });
}

export function setMaintMode(enabled: boolean, hours?: number) {
  return request<{ enabled: boolean; until?: string }>({
    url: '/system/maintenance/mode',
    method: 'put',
    data: { Enabled: enabled, Hours: hours },
  });
}

export function createBackup(data: { BackupType?: string; TargetPath?: string; Compression?: boolean; Verify?: boolean }) {
  return request<{ jobId: number; path: string; sizeBytes: number }>({
    url: '/system/maintenance/backups',
    method: 'post',
    data,
  });
}

export function fetchBackups(page = 1, pageSize = 20) {
  return request<{ total: number; items: MaintJob[] }>({
    url: '/system/maintenance/backups',
    method: 'get',
    params: { page, pageSize },
  });
}

export function fetchFragmentation(tableName?: string): Promise<FragmentationItem[]> {
  return request<FragmentationItem[]>({ url: '/system/maintenance/fragmentation', method: 'get', params: { tableName } });
}

export function rebuildIndexes(items: Array<{ TableName: string; IndexName: string }>) {
  return request<{ jobId: number; succeeded: number; failed: number; messages: string[] }>({
    url: '/system/maintenance/rebuild',
    method: 'post',
    data: { Items: items },
  });
}

export function updateStatistics(tables: string[]) {
  return request<{ jobId: number; succeeded: number; failed: number }>({
    url: '/system/maintenance/stats',
    method: 'post',
    data: { Tables: tables },
  });
}

export function fetchCleanupPreview(cutoffDate: string): Promise<CleanupPreview> {
  return request<CleanupPreview>({
    url: '/system/maintenance/cleanup/preview',
    method: 'get',
    params: { cutoffDate },
  });
}

export function runCleanup(data: {
  CutoffDate: string;
  ConfirmPhrase: string;
  BackupDone: boolean;
  CsExited: boolean;
  Irreversible: boolean;
}) {
  return request<{ jobId: number; tables: Array<{ tableName: string; copied: number; deleted: number }> }>({
    url: '/system/maintenance/cleanup',
    method: 'post',
    data,
  });
}

export function runSettle(data: { CutoffDate: string; BackupDone: boolean; CsExited: boolean }) {
  return request<{ jobId: number; status: number }>({
    url: '/system/maintenance/settle',
    method: 'post',
    data,
  });
}

export function createTransfer(data: { TaskCode: string; Direction: string; Target?: string; TargetKey?: string }) {
  return request<{ jobId: number; direction: string; taskCode: string }>({
    url: '/system/maintenance/transfer',
    method: 'post',
    data,
  });
}

/* ---------------- 黑名单 ---------------- */

export function fetchBlacklist(params: Record<string, unknown>) {
  return request<{ total: number; items: BlacklistItem[] }>({ url: '/system/blacklist', method: 'get', params });
}

export function fetchBlacklistItem(id: number): Promise<BlacklistItem> {
  return request<BlacklistItem>({ url: `/system/blacklist/${id}`, method: 'get' });
}

export function lookupCard(cardNo: string): Promise<CardLookup> {
  return request<CardLookup>({ url: `/system/blacklist/card/${encodeURIComponent(cardNo)}`, method: 'get' });
}

export function addBlacklist(data: { Card_No: string; Person_ID?: number; Reason: string; Del_Sign?: boolean; SyncNow?: boolean }) {
  return request<{ id: number; cardNo: string; personId?: number; cardState?: string; syncTaskCreated: boolean }>({
    url: '/system/blacklist',
    method: 'post',
    data,
  });
}

export function importBlacklist(items: Array<{ cardNo: string; reason?: string }>) {
  return request<{ added: number; skipped: number; errors: string[] }>({
    url: '/system/blacklist/import',
    method: 'post',
    data: { Items: items },
  });
}

export function releaseBlacklist(id: number, reason: string) {
  return request<{ id: number; cardState?: string; released: boolean }>({
    url: `/system/blacklist/${id}`,
    method: 'delete',
    data: { Reason: reason },
  });
}

export function exportBlacklist(params?: { cardNo?: string; personName?: string }): Promise<ExportResult> {
  return request<ExportResult>({ url: '/system/blacklist/export', method: 'get', params });
}

/* ---------------- 日志 ---------------- */

export function fetchSystemLogs(params: Record<string, unknown>) {
  return request<{ total: number; items: SystemLog[] }>({ url: '/system/logs/system', method: 'get', params });
}

export function fetchSystemLogDetail(id: number, source: string) {
  return request<{ row: SystemLog; origin: string; note: string }>({
    url: `/system/logs/system/${id}`,
    method: 'get',
    params: { source },
  });
}

export function exportSystemLogs(params: Record<string, unknown>): Promise<ExportResult> {
  return request<ExportResult>({ url: '/system/logs/system/export', method: 'get', params });
}

export function fetchLoginLogs(params: Record<string, unknown>) {
  return request<{ total: number; items: LoginLog[] }>({ url: '/system/logs/login', method: 'get', params });
}

export function fetchLoginLogDetail(id: number, source: string) {
  return request<Record<string, unknown>>({ url: `/system/logs/login/${id}`, method: 'get', params: { source } });
}

export function fetchLoginStatistics(): Promise<LoginStatistics> {
  return request<LoginStatistics>({ url: '/system/logs/login/statistics', method: 'get' });
}

export function exportLoginLogs(params: Record<string, unknown>): Promise<ExportResult> {
  return request<ExportResult>({ url: '/system/logs/login/export', method: 'get', params });
}

export function fetchOperLogs(params: Record<string, unknown>) {
  return request<{ total: number; items: OperLog[] }>({ url: '/system/logs/oper', method: 'get', params });
}

export function fetchOperLogDetail(id: number, source: string) {
  return request<{ row: OperLog; note: string }>({ url: `/system/logs/oper/${id}`, method: 'get', params: { source } });
}

export function fetchOperLogDiff(id: number) {
  return request<{ before: unknown; after: unknown; traceId?: string }>({
    url: '/system/logs/oper/diff',
    method: 'get',
    params: { id },
  });
}

export function exportOperLogs(params: Record<string, unknown>): Promise<ExportResult> {
  return request<ExportResult>({ url: '/system/logs/oper/export', method: 'get', params });
}

export function fetchSyncLogs(params: Record<string, unknown>) {
  return request<{ total: number; items: SyncLog[]; sources: Record<string, string> }>({
    url: '/system/logs/sync',
    method: 'get',
    params,
  });
}

export function fetchSyncLogDetail(source: string, id: number) {
  return request<{ row: SyncLog; note: string }>({
    url: `/system/logs/sync/${source}/${id}`,
    method: 'get',
  });
}

export function retrySyncLog(id: number) {
  return request<{ retryId: number; sourceId: number }>({ url: `/system/logs/sync/${id}/retry`, method: 'post' });
}

export function exportSyncLogs(params: Record<string, unknown>): Promise<ExportResult> {
  return request<ExportResult>({ url: '/system/logs/sync/export', method: 'get', params });
}

/* ---------------- 通用导出 ---------------- */

/** 把后端返回的文本内容触发为浏览器下载 */
export function downloadText(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
