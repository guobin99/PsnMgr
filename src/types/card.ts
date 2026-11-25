/** 卡务中心-人员与组织：接口数据类型，字段与后端 DTO 一一对应。 */

/* ---------------- 人员档案 ---------------- */

export interface CardPerson {
  personId: number;
  personNo?: string | null;
  personName?: string | null;
  deptId?: number | null;
  deptNo?: string | null;
  deptName?: string | null;
  cardNo?: string | null;
  personType?: string | null;
  personTypeName?: string | null;
  certName?: string | null;
  certCode?: string | null;
  duty?: string | null;
  dutyName?: string | null;
  title?: string | null;
  nationality?: string | null;
  nationalityName?: string | null;
  sex?: string | null;
  birthday?: string | null;
  isMarry?: boolean | null;
  nativePlace?: string | null;
  address?: string | null;
  residence?: string | null;
  onWorkDate?: string | null;
  offWorkDate?: string | null;
  isDel: boolean;
  remark?: string | null;
  mobile?: string | null;
  idNumber?: string | null;
  updateTime?: string | null;
  hasPhoto: number;
  cardTypeNo?: string | null;
  cardTypeName?: string | null;
  cardState?: number | null;
  cardBalance?: number | null;
  faceStatus: number;
}

export interface CardPersonDetail {
  person: CardPerson;
  systems: string[];
  photo: {
    hasPhoto: boolean;
    photoBytes: number;
    idPhotoBytes: number;
    updateTime?: string | null;
  };
}

/** 人员列表排序口径：部门 / 更新时间 / 人员编号 / 姓名 / 卡号 */
export type CardPersonSortBy = 'dept' | 'update' | 'personNo' | 'personName' | 'cardNo';

export interface CardPersonQuery {
  keyword?: string;
  deptId?: number;
  includeChildren?: boolean;
  personType?: string;
  status?: string;
  hasPhoto?: boolean;
  updateFrom?: string;
  updateTo?: string;
  sortBy?: CardPersonSortBy;
  page?: number;
  pageSize?: number;
}

/** 新增/修改人员提交体，字段名与后端 CardPersonSaveRequest 一致（首字母大写）。 */
export interface CardPersonSavePayload {
  PersonNo?: string;
  PersonName: string;
  DeptId: number;
  PersonType?: string;
  CertName?: string;
  CertCode?: string;
  Duty?: string;
  Title?: string;
  Nationality?: string;
  Sex?: string;
  Birthday?: string;
  IsMarry?: boolean;
  NativePlace?: string;
  Address?: string;
  Residence?: string;
  OnWorkDate?: string;
  OffWorkDate?: string;
  Remark?: string;
  Mobile?: string;
  IdNumber?: string;
  Source?: string;
  Systems?: string[];
}

/* ---------------- 部门档案 ---------------- */

export interface CardDeptNode {
  deptId: number;
  deptNo?: string | null;
  deptName?: string | null;
  parentId?: number | null;
  parentIdCache?: number | null;
  level: number;
  chief?: string | null;
  duty?: string | null;
  personCount?: number | null;
  activeCount?: number;
  activeDirect?: number;
  isDel?: boolean | null;
  disabled?: boolean;
  sortNo?: number | null;
  deptType?: string | null;
  addCol1?: string | null;
  addCol2?: string | null;
  remark?: string | null;
}

export interface CardDeptDetail extends CardDeptNode {
  parentNo?: string | null;
  parentName?: string | null;
  childCount: number;
  deletedCount: number;
  telphone?: string | null;
  createTime?: string | null;
}

export interface CardDeptSavePayload {
  DeptNo?: string;
  DeptName: string;
  ParentId?: number | null;
  Chief?: string;
  Duty?: string;
  Remark?: string;
  AddCol1?: string;
  AddCol2?: string;
  SortNo?: number | null;
  DeptType?: string;
}

/** 部门台账导出参数：deptId 为空表示导出全部可见部门。 */
export interface CardDeptExportQuery {
  deptId?: number | null;
  includeChildren?: boolean;
  includeDisabled?: boolean;
}

export interface CardPersonBrief {
  personId: number;
  personNo?: string | null;
  personName?: string | null;
  deptName?: string | null;
  cardNo?: string | null;
  personType?: string | null;
  personTypeName?: string | null;
  isDel?: boolean;
  updateTime?: string | null;
}

/* ---------------- 编码管理 ---------------- */

export interface CardCodeTable {
  tableName: string;
  tableChsName?: string | null;
  itemCount: number;
  refSupported: boolean;
  isDefault: boolean;
}

export interface CardCodeItem {
  id: number;
  tableName?: string | null;
  dictId?: string | null;
  dictValue?: string | null;
  sysCol?: boolean | null;
  remark?: string | null;
  refCount: number;
}

export interface CardCodeItemPage {
  total: number;
  items: CardCodeItem[];
  tableName: string;
  tableChsName?: string | null;
  refSupported: boolean;
}

export interface CardCodeSavePayload {
  TableName: string;
  TableChsName?: string;
  DictId?: string;
  DictValue: string;
  Remark?: string;
  AllowAnyTable?: boolean;
}

export interface CardCodeImportResult {
  tableName: string;
  created: number;
  updated: number;
  fail: number;
  errors: Array<{ row: number; message: string }>;
}

/* ---------------- 人脸照片库 ---------------- */

export interface CardFaceRow {
  personId: number;
  personNo?: string | null;
  personName?: string | null;
  deptId?: number | null;
  deptNo?: string | null;
  deptName?: string | null;
  hasPhoto: number;
  faceStatus: number;
  reviewUser?: string | null;
  reviewTime?: string | null;
  reviewReason?: string | null;
  photoTime?: string | null;
  photoBytes: number;
  idPhotoBytes?: number;
  isDel?: boolean;
  historyCount?: number;
}

export interface CardFaceStat {
  total: number;
  withPhoto: number;
  pending: number;
  approved: number;
  rejected: number;
  noPhoto: number;
}

export interface CardFaceBatchResult {
  jobId: number;
  total: number;
  success: number;
  failed: number;
  approved?: number;
  rejected?: number;
  errors: Array<{ row: number; file: string; message: string }>;
  autoRejected?: Array<{ row: number; file: string; personNo?: string | null; reason: string }>;
}

/* ---------------- 人员导入导出 ---------------- */

export interface CardImportJob {
  jobId: number;
  jobType?: string | null;
  fileName?: string | null;
  mode?: string | null;
  status: number;
  totalRows: number;
  successRows: number;
  failRows: number;
  skipRows: number;
  createUser?: string | null;
  createTime?: string | null;
  finishTime?: string | null;
  errorFile?: string | null;
  optionsJson?: string | null;
}

export interface CardImportDetail {
  job: CardImportJob;
  summary: Array<{ action: string; cnt: number }>;
}

export interface CardImportPreview {
  jobId: number;
  total: number;
  createCount: number;
  updateCount: number;
  skipCount: number;
  errorCount: number;
  errors: Array<{ row: number; column?: string; code?: string; message?: string }>;
}

export interface CardImportErrorRow {
  rowNo: number;
  personNo?: string | null;
  cardNo?: string | null;
  personName?: string | null;
  action?: string | null;
  status: number;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export interface CardImportCommitResult {
  jobId: number;
  success: number;
  failed: number;
  status: number;
}

/** 人员类型候选值：取自 ST_Person.Person_Type 的实际取值，仅作下拉建议 */
export interface CardPersonTypeOption {
  personType?: string | null;
  personCount: number;
}
