/** 卡务中心 — 账户与卡：接口数据结构（与后端 DTO 字段名保持一致） */

/* ---------------- 账户信息设置 ---------------- */

/** 账户信息为全局单记录参数（ST_CardInfo 全表仅一条），不按卡类分行 */
export interface CardAccountInfoRow {
  cardType: string;
  foregift?: number | null;
  charge?: number | null;
  smallAccountMax?: number | null;
  subsidyCutOffDate?: string | null;
  isDelSubsidy?: boolean | null;
  dayDelSysBlack?: number | null;
  cardSpec?: number | null;
  initCodeConfigured: number;
  passwdConfigured: number;
  idCardLen: number;
  /** 实际记录数，正常恒为 1；大于 1 表示数据异常需清理 */
  recordCount?: number;
  updateTime?: string | null;
  updateUser?: string | null;
}

export interface CardAccountInfoSavePayload {
  /** 卡类型：IC卡 / ID卡；不传表示不修改（ST_CardInfo 主键） */
  CardType?: string;
  Foregift?: number | null;
  Charge?: number | null;
  PasswdValue?: string;
  SmallAccountMax?: number | null;
  SubsidyCutOffDate?: string | null;
  IsDelSubsidy: boolean;
  DayDelSysBlack?: number | null;
  CardSpec?: number | null;
  IdCardLen?: number | null;
}

/* ---------------- 账户类别设置 ---------------- */

export interface CardAccountTypeRow {
  typeNo: string;
  typeName?: string | null;
  validity?: number | null;
  minBalance?: number | null;
  subsidy?: number | null;
  maxIcFunds?: number | null;
  sfMaxFund?: number | null;
  sfMaxDayFund?: number | null;
  sfLimitTimes?: number | null;
  sfMaxCount?: number | null;
  sfDiscount?: number | null;
  lhMaxFund?: number | null;
  lhMaxDayFund?: number | null;
  lhDiscount?: number | null;
  smallDiscount?: number | null;
  isOnlySubsidy?: boolean | null;
  isDel?: boolean | null;
  useMoc?: string | null;
  useRepast?: string | null;
  remark?: string | null;
  typeSign?: string | null;
  cardCount: number;
}

export interface CardAccountTypeSavePayload {
  TypeNo?: string;
  TypeName: string;
  Validity?: number | null;
  MinBalance?: number | null;
  Subsidy?: number | null;
  MaxIcFunds?: number | null;
  SfMaxFund?: number | null;
  SfMaxDayFund?: number | null;
  SfLimitTimes?: number | null;
  SfMaxCount?: number | null;
  SfDiscount?: number | null;
  LhMaxFund?: number | null;
  LhMaxDayFund?: number | null;
  LhDiscount?: number | null;
  SmallDiscount?: number | null;
  IsOnlySubsidy: boolean;
  UseMoc?: string;
  UseRepast?: string;
  Remark?: string;
  TypeSign?: string;
}

/* ---------------- 开户与销户 ---------------- */

export interface CardAccountRow {
  personId: number;
  personNo?: string | null;
  personName?: string | null;
  deptId?: number | null;
  deptNo?: string | null;
  deptName?: string | null;
  cardNo?: string | null;
  cardSn?: string | null;
  personIsDel?: boolean | null;
  typeNo?: string | null;
  typeName?: string | null;
  cardState?: number | null;
  cardStateText?: string | null;
  allowedActions?: string[] | null;
  balance?: number | null;
  smallBalance?: number | null;
  subsidyFund?: number | null;
  icBalance?: number | null;
  foregift?: number | null;
  charge?: number | null;
  newDate?: string | null;
  validDate?: string | null;
  cardUserNo?: string | null;
  updateTime?: string | null;
  validity?: number | null;
  minBalance?: number | null;
  sfMaxFund?: number | null;
  sfMaxDayFund?: number | null;
  sfLimitTimes?: number | null;
  maxIcFunds?: number | null;
  smallDiscount?: number | null;
  smallAccountMax?: number | null;
  blackDays?: number | null;
  cardPassword?: string | null;
  pwdConfigured: number;
  lastLockTime?: string | null;
  lastUnlockTime?: string | null;
}

export interface CardOpenOptions {
  items: CardAccountTypeRow[];
  isPersonNoAsCardNo: number;
  idCardLen: number;
  supplyRemark: string;
  pwdVerifyMode: string;
  blacklistCheck: number;
}

export interface CardAvailability {
  cardNo: string;
  available: boolean;
  reason?: string | null;
  blacklisted?: boolean;
  blackDate?: string | null;
  ownerId?: number;
}

export interface CardAccountOpenPayload {
  PersonId: number;
  TypeNo: string;
  CardNo?: string;
  CardSn?: string;
  Password?: string;
  ValidDate?: string;
  MainFund?: number | null;
  SmallFund?: number | null;
  ConfirmBlacklist: boolean;
  Remark?: string;
  RequestNo?: string;
}

export interface CardAccountOpenResult {
  personId: number;
  cardNo?: string | null;
  typeNo?: string | null;
  validDate?: string | null;
  logId?: number | null;
  supplyId?: number | null;
  duplicate?: boolean;
  warning?: string | null;
}

export interface CardAccountUpdatePayload {
  TypeNo: string;
  ValidDate?: string;
  Password?: string;
  ConfirmTypeChange: boolean;
}

export interface CardRefundPreview {
  personId: number;
  personNo?: string | null;
  personName?: string | null;
  deptName?: string | null;
  cardNo?: string | null;
  typeNo?: string | null;
  typeName?: string | null;
  cardState?: number | null;
  cardStateText?: string | null;
  balance: number;
  smallBalance: number;
  foregift: number;
  charge: number;
  icBalance: number;
  subsidyFund: number;
  refundFund: number;
  dbFund: number;
  newDate?: string | null;
  validDate?: string | null;
  chargeNote?: string | null;
  newUserNo?: string | null;
}

export interface CardAccountClosePayload {
  RefundFund?: number | null;
  ReadCardBalance?: number | null;
  RefundMode?: string;
  VoucherNo?: string;
  DeletePerson: boolean;
  HasCard: boolean;
  ConfirmLost: boolean;
  Confirmed: boolean;
  ConfirmText: string;
  Remark?: string;
  RequestNo?: string;
}

export interface CardAccountCloseResult {
  deleteCardId: number;
  takeFundId?: number | null;
  refundFund: number;
  backFund: number;
  factFund: number;
  balanceAdjust: number;
  cardNo?: string | null;
  personName?: string | null;
  deletePerson?: boolean;
  duplicate?: boolean;
}

export interface CardCloseRecordRow {
  idKey: number;
  personId: number;
  personNo?: string | null;
  personName?: string | null;
  cardNo?: string | null;
  newDate?: string | null;
  delDate?: string | null;
  backFund?: number | null;
  factFund?: number | null;
  backSmallFund?: number | null;
  backForegift?: number | null;
  cardCharge?: number | null;
  userNo?: string | null;
  newUserNo?: string | null;
  remark?: string | null;
}

/* ---------------- 卡片状态：冻结/挂失/换卡 ---------------- */

export interface CardCardRow {
  personId: number;
  personNo?: string | null;
  personName?: string | null;
  deptId?: number | null;
  deptNo?: string | null;
  deptName?: string | null;
  cardNo?: string | null;
  cardSn?: string | null;
  mobile?: string | null;
  typeNo?: string | null;
  typeName?: string | null;
  cardState?: number | null;
  cardStateText?: string | null;
  allowedActions?: string[] | null;
  balance?: number | null;
  smallBalance?: number | null;
  icBalance?: number | null;
  foregift?: number | null;
  charge?: number | null;
  newDate?: string | null;
  validDate?: string | null;
  cardUserNo?: string | null;
  updateTime?: string | null;
  lockReasonCode?: string | null;
  lockReasonText?: string | null;
  lockTime?: string | null;
  lastOpType?: string | null;
  lastOpTime?: string | null;
  lastOpUser?: string | null;
  lastLockTime?: string | null;
  lastUnlockTime?: string | null;
  alterCount: number;
  lostDays: number;
  longTerm: boolean;
  lostChannel?: string | null;
}

export interface CardLogRow {
  idKey: number;
  personId: number;
  cardNo?: string | null;
  newCardNo?: string | null;
  opType?: string | null;
  beforeState?: number | null;
  afterState?: number | null;
  balance?: number | null;
  smallBalance?: number | null;
  refundAmount?: number | null;
  modifyFee?: number | null;
  opUser?: string | null;
  opTime?: string | null;
  remark?: string | null;
  ext1?: string | null;
  ext2?: string | null;
}

export interface CardLockRow {
  idKey: number;
  actionTime?: string | null;
  userNo?: string | null;
  remark?: string | null;
}

export interface CardLockHistory {
  items: CardLogRow[];
  lockRecords: CardLockRow[];
  unlockRecords: CardLockRow[];
  lastLockTime?: string | null;
  lastUnlockTime?: string | null;
}

export interface CardFreezePayload {
  ReasonCode?: string;
  ReasonText?: string;
  Password?: string;
  AuthCode?: string;
  RequestNo?: string;
}

export interface CardFreezeBatchResult {
  total: number;
  success: number;
  failed: number;
  details: Array<{
    personId: number;
    personNo?: string | null;
    personName?: string | null;
    success: boolean;
    message?: string | null;
  }>;
}

export interface CardChangeContext {
  personId: number;
  personNo?: string | null;
  personName?: string | null;
  deptName?: string | null;
  oldCardNo?: string | null;
  oldCardSn?: string | null;
  typeNo?: string | null;
  typeName?: string | null;
  cardState?: number | null;
  cardStateText?: string | null;
  balance: number;
  smallBalance: number;
  foregift: number;
  validDate?: string | null;
  isIcCard: boolean;
  canChange: boolean;
  canReplace: boolean;
  lastLockTime?: string | null;
  allowedActions?: string[] | null;
}

export interface CardChangePayload {
  OldCardNo?: string;
  NewCardNo: string;
  NewCardSn?: string;
  AlterFee?: number | null;
  ResetPassword: boolean;
  NewPassword?: string;
  ChangeType: 'CHANGE' | 'REPLACE';
  Password?: string;
  AuthCode?: string;
  Remark?: string;
  RequestNo?: string;
}

export interface CardChangeResult {
  personId: number;
  oldCardNo?: string | null;
  newCardNo?: string | null;
  alterFee: number;
  alterId: number;
  cardState?: number | null;
  smallBalance?: number | null;
  duplicate?: boolean;
}

export interface CardAlterRow {
  idKey: number;
  personId: number;
  personNo?: string | null;
  personName?: string | null;
  alterDate?: string | null;
  cardNo?: string | null;
  newCardNo?: string | null;
  alterFee?: number | null;
  alterType?: number | null;
  userNo?: string | null;
  remark?: string | null;
}

export interface CardLossPayload {
  ReasonCode?: string;
  ReasonText?: string;
  Channel?: 'WINDOW' | 'PHONE';
  Contact?: string;
  PoliceReport: boolean;
  Password?: string;
  AuthCode?: string;
  FoundNote?: string;
  RequestNo?: string;
}

export interface CardUnlossPayload {
  ReasonText?: string;
  FoundNote?: string;
  RequestNo?: string;
}

/* ---------------- 导入授权 ID 卡 ---------------- */

export interface CardIdPreviewRow {
  rowNo: number;
  cardNo?: string | null;
  status: number;
  statusText?: string | null;
  message?: string | null;
}

export interface CardIdParseResult {
  parseToken: number;
  jobId: number;
  fileName: string;
  fileHash?: string | null;
  totalRows: number;
  duplicateRows: number;
  errorRows: number;
  keyState: 'NEW' | 'MATCH' | 'MISMATCH' | string;
  keyHint?: string | null;
  duplicateFile?: { jobId: number; createTime?: string | null; createUser?: string | null } | null;
  requireDuplicateConfirm: boolean;
  shortCode: string;
  preview: CardIdPreviewRow[];
}

export interface CardIdImportPayload {
  ParseToken: number;
  ConfirmDuplicate: boolean;
  RequireDuplicateConfirm: boolean;
}

export interface CardIdImportResult {
  jobId: number;
  success: number;
  duplicate: number;
  failed: number;
  total: number;
  shortCode: string;
}

export interface CardIdCardRow {
  idKey: number;
  cardNo?: string | null;
  batchCode?: string | null;
  jobId?: number | null;
  usedCount: number;
}

export interface CardIdJobRow {
  jobId: number;
  fileName?: string | null;
  fileHash?: string | null;
  keyState?: string | null;
  status: number;
  statusText?: string | null;
  keyStateText?: string | null;
  totalRows: number;
  successRows: number;
  failRows: number;
  skipRows: number;
  createUser?: string | null;
  createTime?: string | null;
  finishTime?: string | null;
}

export interface CardIdDuplicateRow {
  cardNo?: string | null;
  duplicateCount: number;
  minIdKey: number;
}

/* ---------------- 个人账户 ---------------- */

export interface CardPersonalRow {
  personId: number;
  personNo?: string | null;
  personName?: string | null;
  deptNo?: string | null;
  deptName?: string | null;
  cardNo?: string | null;
  typeNo?: string | null;
  typeName?: string | null;
  cardState?: number | null;
  cardStateText?: string | null;
  balance?: number | null;
  smallBalance?: number | null;
  subsidyFund?: number | null;
  icBalance?: number | null;
  validDate?: string | null;
}

export interface CardFlowRow {
  flowTime?: string | null;
  flowType?: string | null;
  flowTypeName?: string | null;
  amount?: number | null;
  direction?: string | null;
  balance?: number | null;
  balanceLabel?: string | null;
  opUser?: string | null;
  remark?: string | null;
  sourceTable?: string | null;
}

export interface CardPersonalDetail {
  person: {
    personId: number;
    personNo?: string | null;
    personName?: string | null;
    deptId?: number | null;
    deptNo?: string | null;
    deptName?: string | null;
    cardNo?: string | null;
    cardSn?: string | null;
  };
  account: {
    typeNo?: string | null;
    typeName?: string | null;
    cardState: number;
    cardStateText?: string | null;
    allowedActions?: string[] | null;
    newDate?: string | null;
    validDate?: string | null;
    cardUserNo?: string | null;
    updateTime?: string | null;
    lockReasonText?: string | null;
    lockTime?: string | null;
    pwdConfigured: number;
  };
  amounts: {
    balance: number;
    smallBalance: number;
    subsidyFund: number;
    icBalance: number;
    foregift: number;
    charge: number;
    balanceMismatch: boolean;
    mismatchNote?: string | null;
  };
  limits: {
    minBalance: number;
    sfMaxFund: number;
    sfMaxDayFund: number;
    sfLimitTimes: number;
    maxIcFunds: number;
    smallDiscount: number;
    smallAccountMax: number;
    blackDays: number;
  };
  recentLogs: CardLogRow[];
}

export interface CardFlowPage {
  total: number;
  items: CardFlowRow[];
  start?: string | null;
  end?: string | null;
  types?: string[] | null;
  rangeDays?: number | null;
}

export interface CardChangePwdPayload {
  OldPassword?: string;
  AuthCode?: string;
  NewPassword: string;
  CardWritten: boolean;
  Remark?: string;
}
