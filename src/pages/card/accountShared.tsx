import { Tag } from 'antd';

/** 卡状态：0 正常、1 挂失、2 冻结（黑名单不是状态，由 ST_BlackPerson 记录） */
export const CARD_STATE_OPTIONS = [
  { value: 0, label: '正常' },
  { value: 1, label: '挂失' },
  { value: 2, label: '冻结' },
];

export function cardStateTag(state?: number | null) {
  if (state === 1) return <Tag color="gold">挂失</Tag>;
  if (state === 2) return <Tag color="red">冻结</Tag>;
  if (state === 0) return <Tag color="green">正常</Tag>;
  return <Tag>未知</Tag>;
}

export function cardStateText(state?: number | null): string {
  if (state === 1) return '挂失';
  if (state === 2) return '冻结';
  if (state === 0) return '正常';
  return '未知';
}

/** 金额展示：两位小数，空值按 0.00 */
export function money(value?: number | null): string {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return amount.toFixed(2);
}

/** 幂等请求号：同一表单重复提交时后端返回首次结果 */
export function newRequestNo(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 冻结原因候选（写入 BS_CardLog.Remark 与 BS_CardExt） */
export const FREEZE_REASONS = ['卡片遗失待核实', '人员离职待结算', '账户金额待核对', '消费纠纷待处理', '其他'];

/** 挂失原因候选 */
export const LOSS_REASONS = ['本人窗口报失', '电话报失', '单位代办报失', '卡片损坏', '其他'];

/** 操作类型文案：BS_CardLog.Op_Type */
export function opTypeText(type?: string | null): string {
  switch ((type ?? '').toUpperCase()) {
    case 'FREEZE':
      return '冻结';
    case 'UNFREEZE':
      return '解冻';
    case 'LOSS':
      return '挂失';
    case 'UNLOSS':
      return '解挂';
    case 'CHANGE':
      return '换卡';
    case 'CHANGEPWD':
      return '改密';
    case 'CLOSE':
      return '销户';
    case 'OPEN':
      return '开户';
    case 'IDCARD_IMPORT':
      return 'ID 卡导入';
    case 'IDCARD_DEL':
      return '删除授权卡';
    default:
      return type || '-';
  }
}

/** 统一流水类型：与后端 types 参数一致 */
export const FLOW_TYPE_OPTIONS = [
  { value: 'SUPPLY', label: '充值' },
  { value: 'TAKE', label: '取款' },
  { value: 'TRANSFER', label: '小账户转入' },
  { value: 'SUBSIDY', label: '补贴发放' },
  { value: 'CONSUME', label: '消费' },
  { value: 'ALTER', label: '换卡' },
  { value: 'DELETE', label: '销户退款' },
];

/** 流水方向文案：IN 入、OUT 出、INNER 内部划转 */
export function directionText(direction?: string | null): string {
  const value = (direction ?? '').toUpperCase();
  if (value === 'IN') return '入';
  if (value === 'OUT') return '出';
  if (value === 'INNER') return '内部';
  return direction || '-';
}
