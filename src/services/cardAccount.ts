import client, { ApiError, request } from '@/services/http';
import type {
  CardAccountClosePayload,
  CardAccountCloseResult,
  CardAccountInfoRow,
  CardAccountInfoSavePayload,
  CardAccountOpenPayload,
  CardAccountOpenResult,
  CardAccountRow,
  CardAccountTypeRow,
  CardAccountTypeSavePayload,
  CardAccountUpdatePayload,
  CardAlterRow,
  CardAvailability,
  CardCardRow,
  CardChangeContext,
  CardChangePayload,
  CardChangePwdPayload,
  CardChangeResult,
  CardCloseRecordRow,
  CardFlowPage,
  CardFreezeBatchResult,
  CardFreezePayload,
  CardIdCardRow,
  CardIdDuplicateRow,
  CardIdImportPayload,
  CardIdImportResult,
  CardIdJobRow,
  CardIdParseResult,
  CardLockHistory,
  CardLossPayload,
  CardOpenOptions,
  CardPersonalDetail,
  CardPersonalRow,
  CardRefundPreview,
  CardUnlossPayload,
} from '@/types/cardAccount';
import type { PagedResult } from '@/types/system';

/* ---------------- 通用下载 ---------------- */

async function download(url: string, params: Record<string, unknown> | undefined, fallbackName: string) {
  const response = await client.get(url, { params, responseType: 'blob' });
  const blob = response.data as Blob;
  if (blob.type && blob.type.includes('application/json')) {
    const text = await blob.text();
    let message = '导出失败，请稍后重试';
    try {
      const body = JSON.parse(text) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      /* 使用兜底提示 */
    }
    throw new ApiError(message);
  }
  const disposition = String(response.headers['content-disposition'] ?? '');
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  let fileName = fallbackName;
  if (encoded?.[1]) fileName = decodeURIComponent(encoded[1].replace(/"/g, ''));
  else if (plain?.[1]) fileName = decodeURIComponent(plain[1]);

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

/* ---------------- 账户信息设置 ---------------- */

/** 账户信息为全局单记录参数，接口只有一条路径，不再按卡类寻址 */
export function fetchAccountInfo(): Promise<CardAccountInfoRow> {
  return request<CardAccountInfoRow>({ url: '/card/account-info', method: 'get' });
}

export function saveAccountInfo(data: CardAccountInfoSavePayload): Promise<CardAccountInfoRow> {
  return request<CardAccountInfoRow>({ url: '/card/account-info', method: 'put', data });
}

export function generateInitCode(
  initCode: string,
): Promise<{ cardType: string; initCodeConfigured: number }> {
  return request({
    url: '/card/account-info/init-code',
    method: 'post',
    data: { InitCode: initCode },
  });
}

/* ---------------- 账户类别设置 ---------------- */

export function fetchAccountTypes(params: {
  keyword?: string;
  includeDisabled?: boolean;
}): Promise<{ total: number; items: CardAccountTypeRow[]; nextNo?: string | null }> {
  return request({ url: '/card/account-types', method: 'get', params });
}

export function fetchAccountType(typeNo: string): Promise<CardAccountTypeRow> {
  return request<CardAccountTypeRow>({ url: `/card/account-types/${encodeURIComponent(typeNo)}`, method: 'get' });
}

export function createAccountType(data: CardAccountTypeSavePayload): Promise<{ typeNo: string }> {
  return request<{ typeNo: string }>({ url: '/card/account-types', method: 'post', data });
}

export function updateAccountType(
  typeNo: string,
  data: CardAccountTypeSavePayload,
): Promise<{ typeNo: string; changed: number }> {
  return request({ url: `/card/account-types/${encodeURIComponent(typeNo)}`, method: 'put', data });
}

export function setAccountTypeStatus(
  typeNo: string,
  disabled: boolean,
): Promise<{ typeNo: string; disabled: boolean }> {
  return request({
    url: `/card/account-types/${encodeURIComponent(typeNo)}/status`,
    method: 'put',
    data: { Disabled: disabled },
  });
}

/* ---------------- 开户与销户 ---------------- */

export function fetchAccounts(params: {
  keyword?: string;
  typeNo?: string;
  cardState?: number;
  deptId?: number;
  includeChildren?: boolean;
  opened?: boolean;
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<CardAccountRow>> {
  return request<PagedResult<CardAccountRow>>({ url: '/card/accounts', method: 'get', params });
}

export function fetchOpenOptions(): Promise<CardOpenOptions> {
  return request<CardOpenOptions>({ url: '/card/accounts/open-options', method: 'get' });
}

export function checkCardAvailable(cardNo: string, personId = 0): Promise<CardAvailability> {
  return request<CardAvailability>({
    url: '/card/accounts/available',
    method: 'get',
    params: { cardNo, personId },
  });
}

export function openAccount(data: CardAccountOpenPayload): Promise<CardAccountOpenResult> {
  return request<CardAccountOpenResult>({ url: '/card/accounts/open', method: 'post', data });
}

export function fetchAccount(personId: number): Promise<CardAccountRow> {
  return request<CardAccountRow>({ url: `/card/accounts/${personId}`, method: 'get' });
}

export function updateAccount(
  personId: number,
  data: CardAccountUpdatePayload,
): Promise<{ personId: number; typeNo: string; validDate?: string | null; typeChanged: boolean }> {
  return request({ url: `/card/accounts/${personId}`, method: 'put', data });
}

export function fetchRefundPreview(personId: number): Promise<CardRefundPreview> {
  return request<CardRefundPreview>({ url: `/card/accounts/${personId}/refund-preview`, method: 'get' });
}

export function closeAccount(personId: number, data: CardAccountClosePayload): Promise<CardAccountCloseResult> {
  return request<CardAccountCloseResult>({ url: `/card/accounts/${personId}/close`, method: 'post', data });
}

export function fetchCloseRecords(params: {
  keyword?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<CardCloseRecordRow>> {
  return request<PagedResult<CardCloseRecordRow>>({ url: '/card/accounts/close-records', method: 'get', params });
}

export function fetchCloseRecord(id: number): Promise<CardCloseRecordRow> {
  return request<CardCloseRecordRow>({ url: `/card/accounts/close-records/${id}`, method: 'get' });
}

/* ---------------- 卡片状态 ---------------- */

export function fetchCards(params: {
  keyword?: string;
  cardState?: number;
  typeNo?: string;
  deptId?: number;
  includeChildren?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<CardCardRow>> {
  return request<PagedResult<CardCardRow>>({ url: '/card/cards', method: 'get', params });
}

export function fetchLossList(params: {
  keyword?: string;
  allStates?: boolean;
  typeNo?: string;
  deptId?: number;
  includeChildren?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<CardCardRow> & { remindDays: number }> {
  return request({ url: '/card/cards/loss-list', method: 'get', params });
}

export function fetchLockHistory(personId: number): Promise<CardLockHistory> {
  return request<CardLockHistory>({ url: `/card/cards/${personId}/lock-history`, method: 'get' });
}

export function freezeCard(personId: number, data: CardFreezePayload): Promise<Record<string, unknown>> {
  return request({ url: `/card/cards/${personId}/freeze`, method: 'post', data });
}

export function unfreezeCard(personId: number, data: CardFreezePayload): Promise<Record<string, unknown>> {
  return request({ url: `/card/cards/${personId}/unfreeze`, method: 'post', data });
}

export function freezeCardsBatch(data: {
  PersonIds: number[];
  ReasonCode?: string;
  ReasonText?: string;
}): Promise<CardFreezeBatchResult> {
  return request<CardFreezeBatchResult>({ url: '/card/cards/freeze-batch', method: 'post', data });
}

export function fetchChangeContext(personId: number): Promise<CardChangeContext> {
  return request<CardChangeContext>({ url: `/card/cards/${personId}/change-context`, method: 'get' });
}

export function checkNewCardNo(params: {
  cardNo: string;
  personId: number;
  oldCardNo?: string;
}): Promise<{ cardNo: string; available: boolean; reason?: string | null; blacklisted?: boolean }> {
  return request({ url: '/card/cards/new-card-check', method: 'get', params });
}

export function changeCard(personId: number, data: CardChangePayload): Promise<CardChangeResult> {
  return request<CardChangeResult>({ url: `/card/cards/${personId}/change`, method: 'post', data });
}

export function fetchAlterRecords(params: {
  keyword?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<CardAlterRow>> {
  return request<PagedResult<CardAlterRow>>({ url: '/card/alter-records', method: 'get', params });
}

export function lossCard(personId: number, data: CardLossPayload): Promise<Record<string, unknown>> {
  return request({ url: `/card/cards/${personId}/loss`, method: 'post', data });
}

export function unlossCard(personId: number, data: CardUnlossPayload): Promise<Record<string, unknown>> {
  return request({ url: `/card/cards/${personId}/unloss`, method: 'post', data });
}

export function fetchLossHistory(personId: number): Promise<{ items: CardLockHistory['items'] }> {
  return request({ url: `/card/cards/${personId}/loss-history`, method: 'get' });
}

/* ---------------- 导入授权 ID 卡 ---------------- */

export function parseIdCardFile(file: File): Promise<CardIdParseResult> {
  const form = new FormData();
  form.append('file', file);
  return request<CardIdParseResult>({
    url: '/card/idcards/parse',
    method: 'post',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
}

export function importIdCards(data: CardIdImportPayload): Promise<CardIdImportResult> {
  return request<CardIdImportResult>({ url: '/card/idcards/import', method: 'post', data, timeout: 180000 });
}

export function fetchIdCards(params: {
  keyword?: string;
  batch?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<CardIdCardRow>> {
  return request<PagedResult<CardIdCardRow>>({ url: '/card/idcards', method: 'get', params });
}

export function fetchIdCardJobs(params: {
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<CardIdJobRow>> {
  return request<PagedResult<CardIdJobRow>>({ url: '/card/idcards/import-jobs', method: 'get', params });
}

export function fetchIdCardDuplicates(limit = 200): Promise<{ total: number; items: CardIdDuplicateRow[] }> {
  return request({ url: '/card/idcards/duplicates', method: 'get', params: { limit } });
}

export function deleteIdCard(idKey: number, reason?: string): Promise<{ idKey: number; cardNo: string }> {
  return request({ url: `/card/idcards/${idKey}`, method: 'delete', params: { reason } });
}

/* ---------------- 个人账户 ---------------- */

export function searchPersonal(params: {
  keyword?: string;
  deptId?: number;
  includeChildren?: boolean;
  cardState?: number;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<CardPersonalRow>> {
  return request<PagedResult<CardPersonalRow>>({ url: '/card/personal', method: 'get', params });
}

export function fetchPersonalDetail(personId: number): Promise<CardPersonalDetail> {
  return request<CardPersonalDetail>({ url: `/card/personal/${personId}`, method: 'get' });
}

export function fetchPersonalFlows(
  personId: number,
  params: {
    startTime?: string;
    endTime?: string;
    types?: string;
    page?: number;
    pageSize?: number;
  },
): Promise<CardFlowPage> {
  return request<CardFlowPage>({ url: `/card/personal/${personId}/flows`, method: 'get', params });
}

export function changePersonalPassword(
  personId: number,
  data: CardChangePwdPayload,
): Promise<{ personId: number; cardWritten: boolean; synced: boolean }> {
  return request({
    url: `/card/personal/${personId}/change-password`,
    method: 'post',
    data,
  });
}

export function exportPersonalAccount(personId: number, personNo?: string | null): Promise<void> {
  return download(`/card/personal/${personId}/export`, undefined, `个人账户_${personNo ?? personId}.xlsx`);
}
