import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  App,
  AutoComplete,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Timeline,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SearchOutlined, StopOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import {
  fetchCards,
  fetchLockHistory,
  freezeCard,
  freezeCardsBatch,
  unfreezeCard,
} from '@/services/cardAccount';
import type { CardCardRow, CardLockHistory } from '@/types/cardAccount';
import { formatDateTime } from './shared';
import { FREEZE_REASONS, cardStateTag, money, newRequestNo, opTypeText } from './accountShared';

interface FreezeFormValues {
  ReasonText: string;
  Password?: string;
  AuthCode?: string;
}

/**
 * 账户冻结与解冻：状态机 0 →(冻结) 2 →(解冻) 0。
 * 挂失卡禁止直接冻结（BS 口径收紧），冻结与解冻都写 ST_LockCard / ST_UnLockCard 并记 BS_CardLog。
 */
export default function FreezePage() {
  const { message } = App.useApp();
  const { has } = usePermission();

  const [rows, setRows] = useState<CardCardRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [cardState, setCardState] = useState<number | undefined>(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<number[]>([]);

  const [freezeTarget, setFreezeTarget] = useState<CardCardRow | null>(null);
  const [unfreezeTarget, setUnfreezeTarget] = useState<CardCardRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<FreezeFormValues>();

  const [batchOpen, setBatchOpen] = useState(false);
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchForm] = Form.useForm<{ ReasonText: string }>();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<CardLockHistory | null>(null);
  const [historyTitle, setHistoryTitle] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchCards({
      keyword: keyword.trim() || undefined,
      cardState,
      page,
      pageSize,
    })
      .then((result) => {
        setRows(result.items);
        setTotal(result.total);
      })
      .catch((error) => {
        setRows([]);
        setTotal(0);
        message.error(error instanceof Error ? error.message : '读取卡片列表失败');
      })
      .finally(() => setLoading(false));
  }, [keyword, cardState, page, pageSize, message]);

  useEffect(() => {
    load();
  }, [load]);

  const openFreeze = (record: CardCardRow) => {
    setFreezeTarget(record);
    form.resetFields();
    form.setFieldsValue({ ReasonText: FREEZE_REASONS[0], Password: '', AuthCode: '' });
  };

  const openUnfreeze = (record: CardCardRow) => {
    setUnfreezeTarget(record);
    form.resetFields();
    form.setFieldsValue({ ReasonText: '核实无误，解除冻结', Password: '', AuthCode: '' });
  };

  const submitFreeze = async () => {
    if (!freezeTarget) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      await freezeCard(freezeTarget.personId, {
        ReasonText: values.ReasonText,
        Password: values.Password?.trim() || undefined,
        AuthCode: values.AuthCode?.trim() || undefined,
        RequestNo: newRequestNo(),
      });
      message.success('账户已冻结');
      setFreezeTarget(null);
      load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '冻结失败');
    } finally {
      setSaving(false);
    }
  };

  const submitUnfreeze = async () => {
    if (!unfreezeTarget) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      await unfreezeCard(unfreezeTarget.personId, {
        ReasonText: values.ReasonText,
        Password: values.Password?.trim() || undefined,
        AuthCode: values.AuthCode?.trim() || undefined,
        RequestNo: newRequestNo(),
      });
      message.success('账户已解冻');
      setUnfreezeTarget(null);
      load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '解冻失败');
    } finally {
      setSaving(false);
    }
  };

  const submitBatch = async () => {
    const values = await batchForm.validateFields();
    setBatchSaving(true);
    try {
      const result = await freezeCardsBatch({ PersonIds: selected, ReasonText: values.ReasonText });
      Modal.info({
        title: '批量冻结结果',
        width: 560,
        content: (
          <div>
            <p>
              共 {result.total} 条，成功 {result.success} 条，失败 {result.failed} 条
            </p>
            {result.details
              .filter((item) => !item.success)
              .slice(0, 10)
              .map((item) => (
                <p key={item.personId} className="card-muted">
                  {item.personNo} {item.personName}：{item.message}
                </p>
              ))}
          </div>
        ),
      });
      setBatchOpen(false);
      setSelected([]);
      load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '批量冻结失败');
    } finally {
      setBatchSaving(false);
    }
  };

  const openHistory = async (record: CardCardRow) => {
    setHistoryOpen(true);
    setHistoryTitle(`${record.personName ?? ''}（${record.personNo ?? ''}）`);
    setHistoryLoading(true);
    setHistory(null);
    try {
      const result = await fetchLockHistory(record.personId);
      setHistory(result);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取冻结记录失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns: ColumnsType<CardCardRow> = [
    { title: '人员编号', dataIndex: 'personNo', key: 'personNo', width: 110 },
    { title: '姓名', dataIndex: 'personName', key: 'personName', width: 100 },
    { title: '部门', dataIndex: 'deptName', key: 'deptName', width: 160, render: (value: string | null) => value || '-' },
    { title: '卡号', dataIndex: 'cardNo', key: 'cardNo', width: 130, render: (value: string | null) => value || '-' },
    {
      title: '卡类',
      key: 'typeNo',
      width: 150,
      render: (_, record) => (record.typeNo ? `${record.typeNo} ${record.typeName ?? ''}` : '-'),
    },
    { title: '状态', key: 'cardState', width: 90, render: (_, record) => cardStateTag(record.cardState) },
    {
      title: '主账户',
      dataIndex: 'balance',
      key: 'balance',
      width: 100,
      align: 'right',
      render: (value: number | null) => money(value),
    },
    {
      title: '冻结原因',
      key: 'reason',
      width: 160,
      render: (_, record) => record.lockReasonText || <span className="card-muted">-</span>,
    },
    {
      title: '最近冻结',
      dataIndex: 'lastLockTime',
      key: 'lastLockTime',
      width: 150,
      render: (value: string | null) => formatDateTime(value),
    },
    {
      title: '最近解冻',
      dataIndex: 'lastUnlockTime',
      key: 'lastUnlockTime',
      width: 150,
      render: (value: string | null) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 190,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {has('card:freeze:freeze') && (
            <Button
              type="link"
              size="small"
              danger
              disabled={record.cardState !== 0}
              title={record.cardState !== 0 ? '只有正常状态可以冻结' : undefined}
              onClick={() => openFreeze(record)}
            >
              冻结
            </Button>
          )}
          {has('card:freeze:unfreeze') && (
            <Button
              type="link"
              size="small"
              disabled={record.cardState !== 2}
              title={record.cardState !== 2 ? '只有冻结状态可以解冻' : undefined}
              onClick={() => openUnfreeze(record)}
            >
              解冻
            </Button>
          )}
          <Button type="link" size="small" onClick={() => openHistory(record)}>
            记录
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="system-page system-page-single">
      <section className="system-workspace">
        <div className="system-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 220 }}
            placeholder="搜索编号 / 姓名 / 卡号"
            value={keyword}
            onChange={(event) => {
              setPage(1);
              setKeyword(event.target.value);
            }}
          />
          <Select
            allowClear
            style={{ width: 140 }}
            placeholder="全部状态"
            value={cardState}
            onChange={(value) => {
              setPage(1);
              setCardState(value);
            }}
            options={[
              { value: 0, label: '正常' },
              { value: 1, label: '挂失' },
              { value: 2, label: '冻结' },
            ]}
          />
          <Space wrap>
            {has('card:freeze:freeze') && (
              <Button
                type="primary"
                danger
                icon={<StopOutlined />}
                disabled={selected.length === 0}
                onClick={() => {
                  batchForm.setFieldsValue({ ReasonText: FREEZE_REASONS[0] });
                  setBatchOpen(true);
                }}
              >
                批量冻结{selected.length > 0 ? `（${selected.length}）` : ''}
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={load}>
              刷新
            </Button>
          </Space>
          <span className="card-muted">挂失卡请先在「卡挂失与解挂」解挂，再办理冻结</span>
        </div>

        <Table
          rowKey="personId"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 1480 }}
          rowSelection={{
            selectedRowKeys: selected,
            onChange: (keys) => setSelected(keys as number[]),
            getCheckboxProps: (record) => ({ disabled: record.cardState !== 0 }),
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100],
            showTotal: (count) => `共 ${count} 张卡`,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            },
          }}
        />
      </section>

      <Modal
        title={freezeTarget ? `冻结：${freezeTarget.personName ?? ''}（${freezeTarget.cardNo ?? ''}）` : '冻结'}
        open={Boolean(freezeTarget)}
        onOk={submitFreeze}
        confirmLoading={saving}
        onCancel={() => setFreezeTarget(null)}
        okText="确认冻结"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <Alert
          style={{ marginBottom: 12 }}
          type="warning"
          showIcon
          message="冻结后该卡禁止消费与取款"
          description="冻结会写入 ST_LockCard，解冻同时写 ST_UnLockCard，动作类型以操作日志为准。"
        />
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="ReasonText" label="冻结原因" rules={[{ required: true, message: '请选择或填写冻结原因' }]}>
            <AutoComplete
              options={FREEZE_REASONS.map((item) => ({ value: item }))}
              filterOption={(input, option) => String(option?.value ?? '').includes(input)}
            />
          </Form.Item>
          <Form.Item name="Password" label="卡密码" extra="按系统参数 Card.PwdVerify.Mode 校验，无需校验时可留空">
            <Input.Password maxLength={20} autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="AuthCode" label="复核码" extra="管理员复核码（超级密码），二选一">
            <Input.Password maxLength={30} autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={unfreezeTarget ? `解冻：${unfreezeTarget.personName ?? ''}（${unfreezeTarget.cardNo ?? ''}）` : '解冻'}
        open={Boolean(unfreezeTarget)}
        onOk={submitUnfreeze}
        confirmLoading={saving}
        onCancel={() => setUnfreezeTarget(null)}
        okText="确认解冻"
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="ReasonText" label="解冻原因" rules={[{ required: true, message: '请填写解冻原因' }]}>
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="Password" label="卡密码">
            <Input.Password maxLength={20} autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="AuthCode" label="复核码">
            <Input.Password maxLength={30} autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`批量冻结 ${selected.length} 人`}
        open={batchOpen}
        onOk={submitBatch}
        confirmLoading={batchSaving}
        onCancel={() => setBatchOpen(false)}
        okText="批量冻结"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <Alert
          style={{ marginBottom: 12 }}
          type="warning"
          showIcon
          message="逐条提交，部分失败不回滚已成功项"
          description="只处理当前为正常状态的卡；状态已变化的记录会跳过并在结果中列出。"
        />
        <Form form={batchForm} layout="vertical" preserve={false}>
          <Form.Item name="ReasonText" label="冻结原因" rules={[{ required: true, message: '请选择冻结原因' }]}>
            <Select options={FREEZE_REASONS.map((item) => ({ value: item, label: item }))} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`冻结解冻记录：${historyTitle}`}
        width={560}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        destroyOnClose
      >
        {historyLoading ? (
          <Card loading bordered={false} />
        ) : history ? (
          <>
            <Space style={{ marginBottom: 12 }} wrap>
              <Tag color="volcano">冻结记录 {history.lockRecords.length} 条</Tag>
              <Tag color="green">解冻记录 {history.unlockRecords.length} 条</Tag>
              <Tag>最近冻结 {formatDateTime(history.lastLockTime)}</Tag>
            </Space>
            {history.items.length === 0 ? (
              <p className="card-muted">暂无冻结解冻操作记录</p>
            ) : (
              <Timeline
                items={history.items.map((item) => ({
                  color: item.opType === 'FREEZE' ? 'red' : item.opType === 'UNFREEZE' ? 'green' : 'gray',
                  children: (
                    <div>
                      <Space size={6} wrap>
                        <strong>{opTypeText(item.opType)}</strong>
                        <span className="card-muted">{formatDateTime(item.opTime)}</span>
                        <span className="card-muted">操作员 {item.opUser || '-'}</span>
                      </Space>
                      <div className="card-muted">
                        状态 {item.beforeState ?? '-'} → {item.afterState ?? '-'}
                        {item.remark ? ` · ${item.remark}` : ''}
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </>
        ) : (
          <p className="card-muted">暂无数据</p>
        )}
      </Drawer>
    </div>
  );
}
