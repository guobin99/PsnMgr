import client, { ApiError, request } from '@/services/http';
import type {
  CardCodeImportResult,
  CardCodeItemPage,
  CardCodeSavePayload,
  CardCodeTable,
  CardDeptDetail,
  CardDeptExportQuery,
  CardDeptNode,
  CardDeptSavePayload,
  CardFaceBatchResult,
  CardFaceRow,
  CardFaceStat,
  CardImportCommitResult,
  CardImportDetail,
  CardImportErrorRow,
  CardImportJob,
  CardImportPreview,
  CardPerson,
  CardPersonBrief,
  CardPersonDetail,
  CardPersonQuery,
  CardPersonSavePayload,
  CardPersonTypeOption,
} from '@/types/card';
import type { PagedResult } from '@/types/system';

/* ---------------- 通用：文件下载与上传 ---------------- */

/** 从 Content-Disposition 里取文件名，取不到用兜底名 */
function parseFileName(disposition: string, fallback: string): string {
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (encoded?.[1]) return decodeURIComponent(encoded[1].replace(/"/g, ''));
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1] ? decodeURIComponent(plain[1]) : fallback;
}

/** 触发浏览器下载 */
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** 下载后端生成的文件；后端返回 JSON 错误时抛出可读提示 */
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
      /* 忽略解析失败，使用兜底提示 */
    }
    throw new ApiError(message);
  }
  const disposition = String(response.headers['content-disposition'] ?? '');
  saveBlob(blob, parseFileName(disposition, fallbackName));
}

/** 以 Blob 拉取图片，返回可直接用于 img src 的对象地址 */
async function fetchBlobUrl(url: string, params?: Record<string, unknown>): Promise<string> {
  const response = await client.get(url, { params, responseType: 'blob' });
  const blob = response.data as Blob;
  if (blob.type && blob.type.includes('application/json')) throw new ApiError('照片读取失败');
  return URL.createObjectURL(blob);
}

/* ---------------- 人员档案 ---------------- */

export function fetchCardPersons(query: CardPersonQuery): Promise<PagedResult<CardPerson>> {
  return request<PagedResult<CardPerson>>({ url: '/card/persons', method: 'get', params: query });
}

export function fetchNextPersonNo(): Promise<{ personNo: string }> {
  return request<{ personNo: string }>({ url: '/card/persons/next-no', method: 'get' });
}

/** 人员类型候选值：ST_Person 中已存在的取值，仅作下拉建议，录入仍可自由输入 */
export function fetchCardPersonTypes(): Promise<{ items: CardPersonTypeOption[] }> {
  return request<{ items: CardPersonTypeOption[] }>({ url: '/card/persons/types', method: 'get' });
}

export function fetchCardPerson(personId: number): Promise<CardPersonDetail> {
  return request<CardPersonDetail>({ url: `/card/persons/${personId}`, method: 'get' });
}

export function createCardPerson(data: CardPersonSavePayload): Promise<{ personId: number; personNo: string }> {
  return request<{ personId: number; personNo: string }>({ url: '/card/persons', method: 'post', data });
}

export function updateCardPerson(
  personId: number,
  data: CardPersonSavePayload,
): Promise<{ personId: number; changed: number }> {
  return request<{ personId: number; changed: number }>({
    url: `/card/persons/${personId}`,
    method: 'put',
    data,
  });
}

export function deleteCardPerson(personId: number, reason?: string): Promise<{ personId: number; isDel: boolean }> {
  return request<{ personId: number; isDel: boolean }>({
    url: `/card/persons/${personId}`,
    method: 'delete',
    params: { reason },
  });
}

export function restoreCardPerson(personId: number): Promise<{ personId: number; isDel: boolean }> {
  return request<{ personId: number; isDel: boolean }>({
    url: `/card/persons/${personId}/restore`,
    method: 'post',
  });
}

export function moveCardPersons(personIds: number[], deptId: number): Promise<{ moved: number }> {
  return request<{ moved: number }>({
    url: '/card/persons/move',
    method: 'post',
    data: { PersonIds: personIds, DeptId: deptId },
  });
}

export function exportCardPersons(query: Omit<CardPersonQuery, 'page' | 'pageSize' | 'sortBy'>): Promise<void> {
  return download('/card/persons/export', { ...query }, '人员档案.xlsx');
}

/* ---------------- 部门档案 ---------------- */

export function fetchCardDeptTree(includeDisabled = true): Promise<CardDeptNode[]> {
  return request<CardDeptNode[]>({ url: '/card/departments/tree', method: 'get', params: { includeDisabled } });
}

export function fetchCardDept(deptId: number): Promise<CardDeptDetail> {
  return request<CardDeptDetail>({ url: `/card/departments/${deptId}`, method: 'get' });
}

export function createCardDept(data: CardDeptSavePayload): Promise<{ deptId: number; deptNo: string }> {
  return request<{ deptId: number; deptNo: string }>({ url: '/card/departments', method: 'post', data });
}

export function updateCardDept(
  deptId: number,
  data: CardDeptSavePayload,
): Promise<{ deptId: number; changed: number }> {
  return request<{ deptId: number; changed: number }>({
    url: `/card/departments/${deptId}`,
    method: 'put',
    data,
  });
}

export function setCardDeptStatus(deptId: number, disabled: boolean): Promise<{ deptId: number; disabled: boolean }> {
  return request<{ deptId: number; disabled: boolean }>({
    url: `/card/departments/${deptId}/status`,
    method: 'put',
    data: { Disabled: disabled },
  });
}

export function sortCardDepts(items: Array<{ DeptId: number; SortNo: number }>): Promise<{ changed: number }> {
  return request<{ changed: number }>({ url: '/card/departments/sort', method: 'put', data: { Items: items } });
}

export function fetchCardDeptPersons(
  deptId: number,
  params: { keyword?: string; includeChildren?: boolean; page?: number; pageSize?: number },
): Promise<PagedResult<CardPersonBrief>> {
  return request<PagedResult<CardPersonBrief>>({
    url: `/card/departments/${deptId}/persons`,
    method: 'get',
    params,
  });
}

export function exportCardDepts(query: CardDeptExportQuery): Promise<void> {
  return download('/card/departments/export', { ...query }, '部门台账.xlsx');
}

/* ---------------- 编码管理 ---------------- */

export function fetchCardCodeTables(all = false): Promise<{
  items: CardCodeTable[];
  missingPersonType: boolean;
  hint?: string | null;
}> {
  return request({ url: '/card/codes/tables', method: 'get', params: { all } });
}

export function fetchCardCodeItems(params: {
  tableName: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<CardCodeItemPage> {
  return request<CardCodeItemPage>({ url: '/card/codes/items', method: 'get', params });
}

export function createCardCodeItem(data: CardCodeSavePayload): Promise<{ tableName: string; dictId: string }> {
  return request<{ tableName: string; dictId: string }>({ url: '/card/codes/items', method: 'post', data });
}

export function updateCardCodeItem(
  id: number,
  data: CardCodeSavePayload,
): Promise<{ id: number; dictId: string; dictValue: string }> {
  return request({ url: `/card/codes/items/${id}`, method: 'put', data });
}

export function deleteCardCodeItem(
  id: number,
  confirm = false,
): Promise<{ id: number; affectedPersons: number }> {
  return request<{ id: number; affectedPersons: number }>({
    url: `/card/codes/items/${id}`,
    method: 'delete',
    params: { confirm },
  });
}

export function importCardCodeItems(file: File, tableName: string): Promise<CardCodeImportResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('tableName', tableName);
  return request<CardCodeImportResult>({
    url: '/card/codes/items/import',
    method: 'post',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function exportCardCodeItems(tableName: string): Promise<void> {
  return download('/card/codes/items/export', { tableName }, `编码_${tableName}.xlsx`);
}

/* ---------------- 人脸照片库 ---------------- */

export function fetchCardFaces(params: {
  keyword?: string;
  deptId?: number;
  includeChildren?: boolean;
  faceStatus?: number;
  hasPhoto?: boolean;
  updateFrom?: string;
  updateTo?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<CardFaceRow>> {
  return request<PagedResult<CardFaceRow>>({ url: '/card/faces', method: 'get', params });
}

export function fetchCardFaceStat(params: { deptId?: number; includeChildren?: boolean }): Promise<CardFaceStat> {
  return request<CardFaceStat>({ url: '/card/faces/statistics', method: 'get', params });
}

export function fetchCardFace(personId: number): Promise<CardFaceRow> {
  return request<CardFaceRow>({ url: `/card/faces/${personId}`, method: 'get' });
}

/** 照片流：默认取缩略图；type 为 id 时取证件照列 */
export function fetchCardFaceImageUrl(
  personId: number,
  options: { thumb?: boolean; type?: 'id' } = {},
): Promise<string> {
  return fetchBlobUrl(`/card/faces/${personId}/image`, {
    thumb: options.thumb ?? true,
    type: options.type,
  });
}

/** 下载照片原图，需要 card:face:export 权限 */
export async function downloadCardFaceImage(personId: number, fileName: string): Promise<void> {
  const response = await client.get(`/card/faces/${personId}/image`, {
    params: { thumb: false },
    responseType: 'blob',
  });
  const blob = response.data as Blob;
  if (blob.type && blob.type.includes('application/json')) {
    const text = await blob.text();
    let message = '原图下载失败';
    try {
      const body = JSON.parse(text) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      /* 使用兜底提示 */
    }
    throw new ApiError(message);
  }
  saveBlob(blob, fileName);
}

export function uploadCardFace(
  personId: number,
  file: File,
): Promise<{
  personId: number;
  sizeKb: number;
  width: number;
  height: number;
  faceStatus?: number;
  approved?: boolean;
  reason?: string | null;
  warning?: string;
}> {
  const form = new FormData();
  form.append('file', file);
  return request({
    url: `/card/faces/${personId}`,
    method: 'post',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function deleteCardFace(personId: number, reason?: string): Promise<{ personId: number; hasPhoto: boolean }> {
  return request<{ personId: number; hasPhoto: boolean }>({
    url: `/card/faces/${personId}`,
    method: 'delete',
    params: { reason },
  });
}

export function reviewCardFace(
  personId: number,
  approved: boolean,
  reason?: string,
): Promise<{ personId: number; faceStatus: number }> {
  return request<{ personId: number; faceStatus: number }>({
    url: `/card/faces/${personId}/review`,
    method: 'post',
    data: { Approved: approved, Reason: reason },
  });
}

export function batchUploadCardFaces(file: File): Promise<CardFaceBatchResult> {
  const form = new FormData();
  form.append('file', file);
  return request<CardFaceBatchResult>({
    url: '/card/faces/batch',
    method: 'post',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
}

/* ---------------- 人员导入导出 ---------------- */

export function downloadImportTemplate(): Promise<void> {
  return download('/card/imports/template', undefined, '人员导入模板.xlsx');
}

export function fetchImportJobs(params: {
  jobType?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<CardImportJob>> {
  return request<PagedResult<CardImportJob>>({ url: '/card/imports', method: 'get', params });
}

export function uploadImportFile(
  file: File,
  mode: string,
  autoCreateDept: boolean,
): Promise<{ jobId: number; total: number; mode: string; warning?: string | null }> {
  const form = new FormData();
  form.append('file', file);
  form.append('mode', mode);
  form.append('autoCreateDept', autoCreateDept ? 'true' : 'false');
  return request({
    url: '/card/imports',
    method: 'post',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
}

export function fetchImportJob(jobId: number): Promise<CardImportDetail> {
  return request<CardImportDetail>({ url: `/card/imports/${jobId}`, method: 'get' });
}

export function previewImportJob(jobId: number): Promise<CardImportPreview> {
  return request<CardImportPreview>({ url: `/card/imports/${jobId}/preview`, method: 'post', timeout: 120000 });
}

export function commitImportJob(jobId: number): Promise<CardImportCommitResult> {
  return request<CardImportCommitResult>({ url: `/card/imports/${jobId}/commit`, method: 'post', timeout: 180000 });
}

export function fetchImportErrors(
  jobId: number,
  params: { page?: number; pageSize?: number },
): Promise<PagedResult<CardImportErrorRow>> {
  return request<PagedResult<CardImportErrorRow>>({
    url: `/card/imports/${jobId}/errors`,
    method: 'get',
    params,
  });
}

export function retryImportJob(
  jobId: number,
): Promise<{ jobId: number; retried: number; success: number; failed: number }> {
  return request({ url: `/card/imports/${jobId}/retry`, method: 'post', timeout: 180000 });
}

export function exportCardPersonData(params: {
  keyword?: string;
  deptId?: number;
  includeChildren?: boolean;
  status?: string;
  mask?: boolean;
}): Promise<void> {
  return download('/card/imports/export', { ...params }, '人员数据.xlsx');
}
