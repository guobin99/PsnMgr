import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SearchOutlined, SwapOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { usePermission } from '@/hooks/usePermission';
import {
  changeCard,
  checkNewCardNo,
  fetchAlterRecords,
  fetchCards,
  fetchChangeContext,
} from '@/services/cardAccount';
import type { CardAlterRow, CardCardRow, CardChangeContext } from '@/types/cardAccount';
import { formatDateTime } from './shared';
import { cardStateTag, money, newRequestNo } from './accountShared';

interface ChangeFormValues {
  NewCardNo: string;
  NewCardSn?: string;
  AlterFee?: number;
  ResetPassword: boolean;
  NewPassword?: string;
  Password?: string;
  AuthCode?: string;
  Remark?: string;
}

/**
 * 换卡与补卡：旧卡入黑名单、人员卡号改写、IC 卡清小账户并恢复状态。
 * 换卡允许正常与挂失状态，补卡只允许挂失状态；工本费只登记不退。
 */
export default function CardChangePage() {
  const { message, modal } = App.useApp();
  const { has } = usePermission();

  const [tab, setTab] = useState<'cards' | 'records'>('cards');

  const [rows, setRows] = useState<CardCardRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [records, setRecords] = useState<CardAlterRow[]>([]);
  const [recordTotal, setRecordTotal] = useState(0);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordKeyword, setRecordKeyword] = useState('');
  const [recordRange, setRecordRange] = useState<[Dayjs, Dayjs] | null>([dayjs().subtract(30, 'day'), dayjs()]);

  const [target, setTarget] = useState<CardCardRow | null>(null);
  const [context, setContext] = useState<CardChangeContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [changeType, setChangeType] = useState<'CHANGE' | 'REPLACE'>('CHANGE');
  const [newCardCheck, setNewCardCheck] = useState('');
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<ChangeFormValues>();

  const load = useCallback(() => {
    setLoading(true);
    fetchCards({ keyword: keyword.trim() || undefined, page, pageSize })
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
  }, [keyword, page, pageSize, message]);

  useEffect(() => {
    load();
  }, [load]);

  const loadRecords = useCallback(() => {
    setRecordLoading(true);
    fetchAlterRecords({
      keyword: recordKeyword.trim() || undefined,
      from: recordRange?.[0]?.format('YYYY-MM-DD'),
      to: recordRange?.[1]?.format('YYYY-MM-DD'),
      page,
      pageSize,
    })
      .then((result) => {
        setRecords(result.items);
        setRecordTotal(result.total);
      })
      .catch((error) => {
        setRecords([]);
        setRecordTotal(0);
        message.error(error instanceof Error ? error.message : '读取换卡记录失败');
      })
      .finally(() => setRecordLoading(false));
  }, [recordKeyword, recordRange, page, pageSize, message]);

  useEffect(() => {
    if (tab === 'records') loadRecords();
  }, [tab, loadRecords]);

  const openChange = async (record: CardCardRow, type: 'CHANGE' | 'REPLACE') => {
    setTarget(record);
    setChangeType(type);
    setContext(null);
    setNewCardCheck('');
    form.resetFields();
    form.setFieldsValue({
      NewCardNo: '',
      NewCardSn: '',
      AlterFee: 0,
      ResetPassword: false,
      NewPassword: '',
      Password: '',
      AuthCode: '',
      Remark: type === 'REPLACE' ? '补卡' : '换卡',
    });
    setContextLoading(true);
    try {
      const detail = await fetchChangeContext(record.personId);
      setContext(detail);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取换卡上下文失败');
    } finally {
      setContextLoading(false);
    }
  };

  const verifyNewCardNo = async (cardNo: string) => {
    if (!target || !cardNo.trim()) {
      setNewCardCheck('');
      return;
    }
    try {
      const result = await checkNewCardNo({
        cardNo: cardNo.trim(),
        personId: target.personId,
        oldCardNo: context?.oldCardNo ?? undefined,
      });
      if (result.available) {
        setNewCardCheck(result.reason ? `可用（${result.reason}）` : '卡号可用');
      } else {
        setNewCardCheck(`不可用：${result.reason ?? ''}`);
      }
    } catch {
      setNewCardCheck('');
    }
  };

  const submit = async () => {
    if (!target) return;
    const values = await form.validateFields();
    if (newCardCheck.startsWith('不可用')) {
      message.error('新卡号不可用，请更换后再提交');
      return;
    }
    if (changeType === 'CHANGE' && context?.isIcCard) {
      const confirmed = await new Promise<boolean>((resolve) => {
        modal.confirm({
          title: 'IC 卡换卡会清零小账户余额',
          content: '按 CS 口径，IC 卡换卡后 Card_SmallBalance 归零、卡状态恢复为正常。确认继续？',
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (!confirmed) return;
    }
    setSaving(true);
    try {
      const result = await changeCard(target.personId, {
        OldCardNo: context?.oldCardNo ?? undefined,
        NewCardNo: values.NewCardNo.trim(),
        NewCardSn: values.NewCardSn?.trim() || undefined,
        AlterFee: values.AlterFee ?? 0,
        ResetPassword: values.ResetPassword === true,
        NewPassword: values.ResetPassword ? values.NewPassword?.trim() || undefined : undefined,
        ChangeType: changeType,
        Password: values.Password?.trim() || undefined,
        AuthCode: values.AuthCode?.trim() || undefined,
        Remark: values.Remark?.trim() || undefined,
        RequestNo: newRequestNo(),
      });
      modal.success({
        title: changeType === 'REPLACE' ? '补卡完成' : '换卡完成',
        content: `旧卡号 ${result.oldCardNo || '-'} → 新卡号 ${result.newCardNo || '-'}，工本费 ¥${money(result.alterFee)}，换卡记录号 ${result.alterId}`,
      });
      setTarget(null);
      load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '换卡失败');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<CardCardRow> = [
    { title: '人员编号', dataIndex: 'personNo', key: 'personNo', width: 110 },
    { title: '姓名', dataIndex: 'personName', key: 'personName', width: 100 },
    { title: '部门', dataIndex: 'deptName', key: 'deptName', width: 160, render: (value: string | null) => value || '-' },
    { title: '卡号', dataIndex: 'cardNo', key: 'cardNo', width: 130, render: (value: string | null) => value || '-' },
    { title: '卡序列号', dataIndex: 'cardSn', key: 'cardSn', width: 120, render: (value: string | null) => value || '-' },
    { title: '卡类', key: 'typeNo', width: 150, render: (_, record) => (record.typeNo ? `${record.typeNo} ${record.typeName ?? ''}` : '-') },
    { title: '状态', key: 'cardState', width: 90, render: (_, record) => cardStateTag(record.cardState) },
    { title: '主账户', dataIndex: 'balance', key: 'balance', width: 100, align: 'right', render: (value: number | null) => money(value) },
    { title: '小账户', dataIndex: 'smallBalance', key: 'smallBalance', width: 100, align: 'right', render: (value: number | null) => money(value) },
    { title: '换卡次数', dataIndex: 'alterCount', key: 'alterCount', width: 100, align: 'right', render: (value: number) => (value > 0 ? <Tag color="blue">{value} 次</Tag> : <span className="card-muted">0</span>) },
    { title: '最近冻结', dataIndex: 'lastLockTime', key: 'lastLockTime', width: 150, render: (value: string | null) => formatDateTime(value) },
    {
      title: '操作',
      key: 'actions',
      width: 170,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {has('card:cardChange:change') && (
            <Button
              type="link"
              size="small"
              icon={<SwapOutlined />}
              disabled={record.cardState !== 0 && record.cardState !== 1}
              title={record.cardState === 2 ? '冻结状态不允许换卡' : undefined}
              onClick={() => openChange(record, 'CHANGE')}
            >
              换卡
            </Button>
          )}
          {has('card:cardChange:change') && (
            <Button
              type="link"
              size="small"
              disabled={record.cardState !== 1}
              title={record.cardState !== 1 ? '补卡只允许挂失状态' : undefined}
              onClick={() => openChange(record, 'REPLACE')}
            >
              补卡
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const recordColumns: ColumnsType<CardAlterRow> = [
    { title: '换卡时间', dataIndex: 'alterDate', key: 'alterDate', width: 150, render: (value: string | null) => formatDateTime(value) },
    { title: '人员编号', dataIndex: 'personNo', key: 'personNo', width: 110 },
    { title: '姓名', dataIndex: 'personName', key: 'personName', width: 100 },
    { title: '旧卡号', dataIndex: 'cardNo', key: 'cardNo', width: 130, render: (value: string | null) => value || '-' },
    { title: '新卡号', dataIndex: 'newCardNo', key: 'newCardNo', width: 130, render: (value: string | null) => value || '-' },
    { title: '工本费', dataIndex: 'alterFee', key: 'alterFee', width: 100, align: 'right', render: (value: number | null) => money(value) },
    { title: '操作员', dataIndex: 'userNo', key: 'userNo', width: 100, render: (value: string | null) => value || '-' },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: (value: string | null) => value || '-' },
  ];

  return (
    <div className="system-page system-page-single">
      <section className="system-workspace">
        <Tabs
          activeKey={tab}
          onChange={(key) => {
            setPage(1);
            setTab(key as 'cards' | 'records');
          }}
          items={[
            {
              key: 'cards',
              label: '换卡与补卡',
              children: (
                <>
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
                    <Button icon={<ReloadOutlined />} onClick={load}>
                      刷新
                    </Button>
                    <span className="card-muted">冻结状态不允许换卡；补卡只允许挂失状态，且原挂失记录保留</span>
                  </div>
                  <Table
                    rowKey="personId"
                    size="small"
                    loading={loading}
                    columns={columns}
                    dataSource={rows}
                    scroll={{ x: 1560 }}
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
                </>
              ),
            },
            {
              key: 'records',
              label: '换卡记录',
              children: (
                <>
                  <div className="system-toolbar">
                    <Input
                      allowClear
                      prefix={<SearchOutlined />}
                      style={{ width: 220 }}
                      placeholder="搜索人员或卡号"
                      value={recordKeyword}
                      onChange={(event) => {
                        setPage(1);
                        setRecordKeyword(event.target.value);
                      }}
                    />
                    <DatePicker.RangePicker
                      value={recordRange}
                      onChange={(values) => {
                        setPage(1);
                        setRecordRange(values as [Dayjs, Dayjs] | null);
                      }}
                    />
                    <Button icon={<ReloadOutlined />} onClick={loadRecords}>
                      刷新
                    </Button>
                  </div>
                  <Table
                    rowKey="idKey"
                    size="small"
                    loading={recordLoading}
                    columns={recordColumns}
                    dataSource={records}
                    scroll={{ x: 980 }}
                    pagination={{
                      current: page,
                      pageSize,
                      total: recordTotal,
                      showSizeChanger: true,
                      pageSizeOptions: [20, 50, 100],
                      showTotal: (count) => `共 ${count} 条换卡记录`,
                      onChange: (nextPage, nextSize) => {
                        setPage(nextPage);
                        setPageSize(nextSize);
                      },
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </section>

      <Modal
        title={
          target
            ? `${changeType === 'REPLACE' ? '补卡' : '换卡'}：${target.personName ?? ''}（${target.personNo ?? ''}）`
            : '换卡'
        }
        open={Boolean(target)}
        onOk={submit}
        confirmLoading={saving}
        onCancel={() => setTarget(null)}
        okText={changeType === 'REPLACE' ? '确认补卡' : '确认换卡'}
        width={760}
        destroyOnClose
      >
        {contextLoading ? (
          <Card loading bordered={false} />
        ) : context ? (
          <Descriptions size="small" bordered column={2} style={{ marginBottom: 12 }}>
            <Descriptions.Item label="旧卡号">{context.oldCardNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="卡状态">{cardStateTag(context.cardState)}</Descriptions.Item>
            <Descriptions.Item label="卡类">
              {context.typeNo ? `${context.typeNo} ${context.typeName ?? ''}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="是否 IC 卡">{context.isIcCard ? <Tag color="blue">是</Tag> : <Tag>否</Tag>}</Descriptions.Item>
            <Descriptions.Item label="主账户">¥{money(context.balance)}</Descriptions.Item>
            <Descriptions.Item label="小账户">¥{money(context.smallBalance)}</Descriptions.Item>
            <Descriptions.Item label="押金">¥{money(context.foregift)}</Descriptions.Item>
            <Descriptions.Item label="最近冻结">{formatDateTime(context.lastLockTime)}</Descriptions.Item>
          </Descriptions>
        ) : null}

        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label="办理类型">
            <Radio.Group
              value={changeType}
              onChange={(event) => setChangeType(event.target.value as 'CHANGE' | 'REPLACE')}
              options={[
                { value: 'CHANGE', label: '换卡（正常 / 挂失）' },
                { value: 'REPLACE', label: '补卡（仅挂失）' },
              ]}
            />
          </Form.Item>
          <div className="card-form-grid">
            <Form.Item
              name="NewCardNo"
              label="新卡号"
              rules={[
                { required: true, message: '请输入新卡号' },
                { max: 12, message: '不超过 12 位' },
              ]}
              validateStatus={newCardCheck.startsWith('不可用') ? 'error' : undefined}
              extra={newCardCheck || '输入后失焦即时校验占用、禁用与黑名单'}
            >
              <Input
                maxLength={12}
                onBlur={(event) => {
                  void verifyNewCardNo(event.target.value);
                }}
              />
            </Form.Item>
            <Form.Item name="NewCardSn" label="新卡序列号" rules={[{ max: 12, message: '不超过 12 位' }]}>
              <Input maxLength={12} />
            </Form.Item>
            <Form.Item name="AlterFee" label="工本费" extra="只登记不退">
              <InputNumber min={0} max={99999999} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="ResetPassword" label="同时重置卡密码" valuePropName="checked">
            <Switch checkedChildren="重置" unCheckedChildren="保持" />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, next) => prev.ResetPassword !== next.ResetPassword}
          >
            {({ getFieldValue }) =>
              getFieldValue('ResetPassword') ? (
                <Form.Item
                  name="NewPassword"
                  label="新卡密码"
                  rules={[{ required: true, message: '请输入新卡密码' }, { max: 20, message: '不超过 20 位' }]}
                >
                  <Input.Password maxLength={20} autoComplete="new-password" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          {changeType === 'CHANGE' ? (
            <>
              <Alert
                style={{ marginBottom: 12 }}
                type="info"
                showIcon
                message="换卡需要校验旧卡密码或复核码"
                description="补卡可免密；换卡按系统参数 Card.PwdVerify.Mode 校验。"
              />
              <div className="card-form-grid">
                <Form.Item name="Password" label="旧卡密码">
                  <Input.Password maxLength={20} autoComplete="new-password" />
                </Form.Item>
                <Form.Item name="AuthCode" label="复核码">
                  <Input.Password maxLength={30} autoComplete="new-password" />
                </Form.Item>
              </div>
            </>
          ) : null}

          <Form.Item name="Remark" label="备注">
            <Input maxLength={50} />
          </Form.Item>
          <Checkbox disabled checked>
            旧卡号将写入黑名单，人员卡号与加密卡号同步更新
          </Checkbox>
        </Form>
      </Modal>
    </div>
  );
}
