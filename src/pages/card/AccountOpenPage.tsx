import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { usePermission } from '@/hooks/usePermission';
import { fetchCardDeptTree } from '@/services/card';
import {
  checkCardAvailable,
  closeAccount,
  fetchAccounts,
  fetchCloseRecords,
  fetchOpenOptions,
  fetchRefundPreview,
  openAccount,
  updateAccount,
} from '@/services/cardAccount';
import type { CardDeptNode } from '@/types/card';
import type {
  CardAccountRow,
  CardCloseRecordRow,
  CardOpenOptions,
  CardRefundPreview,
} from '@/types/cardAccount';
import { CardDeptSearchRow, CardDeptTreePanel, formatDateTime } from './shared';
import { cardStateTag, money, newRequestNo } from './accountShared';

interface OpenFormValues {
  TypeNo: string;
  CardNo?: string;
  CardSn?: string;
  Password?: string;
  ValidDate?: Dayjs | null;
  MainFund?: number;
  SmallFund?: number;
  Remark?: string;
  ConfirmBlacklist: boolean;
}

interface UpdateFormValues {
  TypeNo: string;
  ValidDate?: Dayjs | null;
  Password?: string;
  ConfirmTypeChange: boolean;
}

interface CloseFormValues {
  RefundFund?: number;
  ReadCardBalance?: number;
  RefundMode: string;
  VoucherNo: string;
  DeletePerson: boolean;
  ConfirmLost: boolean;
  Confirmed: boolean;
  Remark?: string;
}

/**
 * 开户与销户：以人员为主线管理账户。
 * 开户写 ST_Card + ST_Person.Card_No + ST_Person.C_PSD，销户按有无卡片/是否注销人员分三种落账方式。
 */
export default function AccountOpenPage() {
  const { message, modal } = App.useApp();
  const { has } = usePermission();

  const [deptNodes, setDeptNodes] = useState<CardDeptNode[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptKeyword, setDeptKeyword] = useState('');
  const [deptId, setDeptId] = useState<number | undefined>();

  const [tab, setTab] = useState<'unopened' | 'opened' | 'records'>('unopened');
  const [keyword, setKeyword] = useState('');
  const [cardState, setCardState] = useState<number | undefined>();
  const [typeNo, setTypeNo] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [rows, setRows] = useState<CardAccountRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [records, setRecords] = useState<CardCloseRecordRow[]>([]);
  const [recordTotal, setRecordTotal] = useState(0);
  const [recordLoading, setRecordLoading] = useState(false);

  const [options, setOptions] = useState<CardOpenOptions | null>(null);
  const [openTarget, setOpenTarget] = useState<CardAccountRow | null>(null);
  const [openSaving, setOpenSaving] = useState(false);
  const [cardCheck, setCardCheck] = useState<string>('');
  const [openForm] = Form.useForm<OpenFormValues>();

  const [editTarget, setEditTarget] = useState<CardAccountRow | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm] = Form.useForm<UpdateFormValues>();

  const [closeTarget, setCloseTarget] = useState<CardAccountRow | null>(null);
  const [closePreview, setClosePreview] = useState<CardRefundPreview | null>(null);
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeSaving, setCloseSaving] = useState(false);
  const [closeForm] = Form.useForm<CloseFormValues>();

  const loadDeptTree = useCallback(() => {
    setDeptLoading(true);
    fetchCardDeptTree(true)
      .then(setDeptNodes)
      .catch(() => setDeptNodes([]))
      .finally(() => setDeptLoading(false));
  }, []);

  useEffect(() => {
    loadDeptTree();
  }, [loadDeptTree]);

  const loadRows = useCallback(() => {
    if (tab === 'records') return;
    setLoading(true);
    fetchAccounts({
      keyword: keyword.trim() || undefined,
      deptId,
      includeChildren: true,
      typeNo,
      cardState: tab === 'opened' ? cardState : undefined,
      opened: tab === 'opened',
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
        message.error(error instanceof Error ? error.message : '读取账户失败');
      })
      .finally(() => setLoading(false));
  }, [tab, keyword, deptId, typeNo, cardState, page, pageSize, message]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const loadRecords = useCallback(() => {
    setRecordLoading(true);
    fetchCloseRecords({ keyword: keyword.trim() || undefined, page, pageSize })
      .then((result) => {
        setRecords(result.items);
        setRecordTotal(result.total);
      })
      .catch((error) => {
        setRecords([]);
        setRecordTotal(0);
        message.error(error instanceof Error ? error.message : '读取销卡记录失败');
      })
      .finally(() => setRecordLoading(false));
  }, [keyword, page, pageSize, message]);

  useEffect(() => {
    if (tab === 'records') loadRecords();
  }, [tab, loadRecords]);

  const cardTypes = options?.items ?? [];

  const openOpenModal = async (record: CardAccountRow) => {
    setOpenTarget(record);
    setCardCheck('');
    openForm.resetFields();
    let current = options;
    if (!current) {
      try {
        current = await fetchOpenOptions();
        setOptions(current);
      } catch (error) {
        message.error(error instanceof Error ? error.message : '读取开户选项失败');
        return;
      }
    }
    const first = current.items[0];
    const cardNo = current.isPersonNoAsCardNo === 1 ? record.personNo ?? '' : '';
    openForm.setFieldsValue({
      TypeNo: first?.typeNo ?? '',
      CardNo: cardNo,
      CardSn: '',
      Password: '',
      ValidDate: first ? dayjs().add(first.validity ?? 365, 'day') : null,
      MainFund: 0,
      SmallFund: 0,
      Remark: '',
      ConfirmBlacklist: false,
    });
    if (cardNo) void verifyCardNo(cardNo, record.personId);
  };

  const verifyCardNo = async (cardNo: string, personId: number) => {
    if (!cardNo.trim()) {
      setCardCheck('');
      return;
    }
    try {
      const result = await checkCardAvailable(cardNo.trim(), personId);
      setCardCheck(result.available ? (result.reason ? `可用（${result.reason}）` : '卡号可用') : `不可用：${result.reason ?? ''}`);
    } catch {
      setCardCheck('');
    }
  };

  const submitOpen = async () => {
    if (!openTarget) return;
    const values = await openForm.validateFields();
    if (cardCheck.startsWith('不可用')) {
      message.error('卡号不可用，请先更换卡号');
      return;
    }
    setOpenSaving(true);
    try {
      await openAccount({
        PersonId: openTarget.personId,
        TypeNo: values.TypeNo,
        CardNo: values.CardNo?.trim() || undefined,
        CardSn: values.CardSn?.trim() || undefined,
        Password: values.Password?.trim() || undefined,
        ValidDate: values.ValidDate ? values.ValidDate.format('YYYY-MM-DD') : undefined,
        MainFund: values.MainFund ?? 0,
        SmallFund: values.SmallFund ?? 0,
        ConfirmBlacklist: values.ConfirmBlacklist === true,
        Remark: values.Remark?.trim() || undefined,
        RequestNo: newRequestNo(),
      });
      message.success('开户完成');
      setOpenTarget(null);
      loadRows();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '开户失败');
    } finally {
      setOpenSaving(false);
    }
  };

  const openEditModal = (record: CardAccountRow) => {
    setEditTarget(record);
    editForm.resetFields();
    editForm.setFieldsValue({
      TypeNo: record.typeNo ?? '',
      ValidDate: record.validDate ? dayjs(record.validDate) : null,
      Password: '',
      ConfirmTypeChange: false,
    });
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    const values = await editForm.validateFields();
    setEditSaving(true);
    try {
      await updateAccount(editTarget.personId, {
        TypeNo: values.TypeNo,
        ValidDate: values.ValidDate ? values.ValidDate.format('YYYY-MM-DD') : undefined,
        Password: values.Password?.trim() || undefined,
        ConfirmTypeChange: values.ConfirmTypeChange === true,
      });
      message.success('卡信息已保存');
      setEditTarget(null);
      loadRows();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setEditSaving(false);
    }
  };

  const openCloseModal = async (record: CardAccountRow) => {
    setCloseTarget(record);
    setClosePreview(null);
    closeForm.resetFields();
    closeForm.setFieldsValue({
      RefundFund: 0,
      ReadCardBalance: undefined,
      RefundMode: '现金',
      VoucherNo: '',
      DeletePerson: false,
      ConfirmLost: false,
      Confirmed: false,
      Remark: '',
    });
    setCloseLoading(true);
    try {
      const preview = await fetchRefundPreview(record.personId);
      setClosePreview(preview);
      closeForm.setFieldsValue({
        RefundFund: preview.refundFund,
        ReadCardBalance: preview.icBalance > 0 ? preview.icBalance : undefined,
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取退款试算失败');
    } finally {
      setCloseLoading(false);
    }
  };

  const submitClose = async () => {
    if (!closeTarget) return;
    const values = await closeForm.validateFields();
    setCloseSaving(true);
    try {
      const result = await closeAccount(closeTarget.personId, {
        RefundFund: values.RefundFund ?? 0,
        ReadCardBalance: values.ReadCardBalance,
        RefundMode: values.RefundMode,
        VoucherNo: values.VoucherNo?.trim(),
        DeletePerson: values.DeletePerson === true,
        HasCard: Boolean(closeTarget.typeNo),
        ConfirmLost: values.ConfirmLost === true,
        Confirmed: values.Confirmed === true,
        ConfirmText: '确认销户',
        Remark: values.Remark?.trim() || undefined,
        RequestNo: newRequestNo(),
      });
      modal.success({
        title: '销户完成',
        content: `实退金额 ¥${money(result.refundFund)}，销卡记录号 ${result.deleteCardId}${
          result.takeFundId ? `，取款流水号 ${result.takeFundId}` : ''
        }`,
      });
      setCloseTarget(null);
      loadRows();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '销户失败');
    } finally {
      setCloseSaving(false);
    }
  };

  const columns: ColumnsType<CardAccountRow> = useMemo(() => {
    const base: ColumnsType<CardAccountRow> = [
      { title: '人员编号', dataIndex: 'personNo', key: 'personNo', width: 110, fixed: 'left' },
      { title: '姓名', dataIndex: 'personName', key: 'personName', width: 100, fixed: 'left' },
      { title: '部门', dataIndex: 'deptName', key: 'deptName', width: 160, render: (value: string | null) => value || '-' },
    ];

    if (tab === 'unopened') {
      return [
        ...base,
        {
          title: '状态',
          dataIndex: 'personIsDel',
          key: 'personIsDel',
          width: 90,
          render: (value: boolean | null) => (value ? <Tag>已注销</Tag> : <Tag color="green">在册</Tag>),
        },
        {
          title: '操作',
          key: 'actions',
          width: 120,
          fixed: 'right',
          render: (_, record) =>
            has('card:accountOpen:open') ? (
              <Button type="link" size="small" onClick={() => openOpenModal(record)}>
                开户
              </Button>
            ) : null,
        },
      ];
    }

    return [
      ...base,
      { title: '卡号', dataIndex: 'cardNo', key: 'cardNo', width: 130, render: (value: string | null) => value || '-' },
      {
        title: '卡类',
        key: 'typeNo',
        width: 150,
        render: (_, record) => (record.typeNo ? `${record.typeNo} ${record.typeName ?? ''}` : '-'),
      },
      {
        title: '状态',
        key: 'cardState',
        width: 90,
        render: (_, record) => cardStateTag(record.cardState),
      },
      {
        title: '主账户',
        dataIndex: 'balance',
        key: 'balance',
        width: 100,
        align: 'right',
        render: (value: number | null) => money(value),
      },
      {
        title: '小账户',
        dataIndex: 'smallBalance',
        key: 'smallBalance',
        width: 100,
        align: 'right',
        render: (value: number | null) => money(value),
      },
      {
        title: '押金',
        dataIndex: 'foregift',
        key: 'foregift',
        width: 90,
        align: 'right',
        render: (value: number | null) => money(value),
      },
      {
        title: '有效期',
        dataIndex: 'validDate',
        key: 'validDate',
        width: 120,
        render: (value: string | null) => (value ? value.slice(0, 10) : '长期'),
      },
      {
        title: '密码',
        dataIndex: 'pwdConfigured',
        key: 'pwdConfigured',
        width: 80,
        render: (value: number) => (value === 1 ? <Tag color="green">已设</Tag> : <Tag>未设</Tag>),
      },
      {
        title: '操作',
        key: 'actions',
        width: 150,
        fixed: 'right',
        render: (_, record) => (
          <Space size="small">
            {has('card:accountOpen:update') && (
              <Button type="link" size="small" onClick={() => openEditModal(record)}>
                改卡
              </Button>
            )}
            {has('card:accountOpen:close') && (
              <Button type="link" size="small" danger onClick={() => openCloseModal(record)}>
                销户
              </Button>
            )}
          </Space>
        ),
      },
    ];
  }, [tab, has, openOpenModal, openEditModal, openCloseModal]);

  const recordColumns: ColumnsType<CardCloseRecordRow> = [
    { title: '销卡时间', dataIndex: 'delDate', key: 'delDate', width: 150, render: (value: string | null) => formatDateTime(value) },
    { title: '人员编号', dataIndex: 'personNo', key: 'personNo', width: 110 },
    { title: '姓名', dataIndex: 'personName', key: 'personName', width: 100 },
    { title: '卡号', dataIndex: 'cardNo', key: 'cardNo', width: 130 },
    { title: '开户时间', dataIndex: 'newDate', key: 'newDate', width: 150, render: (value: string | null) => formatDateTime(value) },
    { title: '押金退还', dataIndex: 'backForegift', key: 'backForegift', width: 100, align: 'right', render: (value: number | null) => money(value) },
    { title: '小账户退还', dataIndex: 'backSmallFund', key: 'backSmallFund', width: 110, align: 'right', render: (value: number | null) => money(value) },
    { title: '卡费', dataIndex: 'cardCharge', key: 'cardCharge', width: 90, align: 'right', render: (value: number | null) => money(value) },
    { title: '实退金额', dataIndex: 'factFund', key: 'factFund', width: 110, align: 'right', render: (value: number | null) => money(value) },
    { title: '操作员', dataIndex: 'userNo', key: 'userNo', width: 100, render: (value: string | null) => value || '-' },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: (value: string | null) => value || '-' },
  ];

  return (
    <div className="system-page">
      <aside>
        <Card
          size="small"
          className="system-context-card"
          title="组织结构"
          extra={
            <Button size="small" type="text" icon={<ReloadOutlined />} onClick={loadDeptTree}>
              刷新
            </Button>
          }
        >
          <CardDeptSearchRow keyword={deptKeyword} onKeywordChange={setDeptKeyword} />
          <CardDeptTreePanel
            nodes={deptNodes}
            loading={deptLoading}
            selectedKey={deptId}
            keyword={deptKeyword}
            onSelect={(value) => {
              setPage(1);
              setDeptId(value);
            }}
          />
          <div className="card-tree-footer">
            <span className="card-muted">{deptId ? '已选部门，含下级' : '全部部门'}</span>
            <Button size="small" type="link" disabled={!deptId} onClick={() => setDeptId(undefined)}>
              清除
            </Button>
          </div>
        </Card>
      </aside>

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
          {tab === 'opened' ? (
            <>
              <Select
                allowClear
                style={{ width: 140 }}
                placeholder="卡状态"
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
              <Select
                allowClear
                showSearch
                style={{ width: 190 }}
                placeholder="卡类"
                value={typeNo}
                onChange={(value) => {
                  setPage(1);
                  setTypeNo(value);
                }}
                options={(options?.items ?? []).map((item) => ({
                  value: item.typeNo,
                  label: `${item.typeNo} ${item.typeName ?? ''}`,
                }))}
                onDropdownVisibleChange={(open) => {
                  if (open && !options) fetchOpenOptions().then(setOptions).catch(() => undefined);
                }}
              />
            </>
          ) : null}
          <Button icon={<ReloadOutlined />} onClick={() => (tab === 'records' ? loadRecords() : loadRows())}>
            刷新
          </Button>
        </div>

        <Tabs
          activeKey={tab}
          onChange={(key) => {
            setPage(1);
            setTab(key as 'unopened' | 'opened' | 'records');
          }}
          items={[
            {
              key: 'unopened',
              label: '待开户人员',
              children: (
                <Table
                  rowKey="personId"
                  size="small"
                  loading={loading}
                  columns={columns}
                  dataSource={rows}
                  scroll={{ x: 760 }}
                  pagination={{
                    current: page,
                    pageSize,
                    total,
                    showSizeChanger: true,
                    pageSizeOptions: [20, 50, 100],
                    showTotal: (count) => `共 ${count} 人待开户`,
                    onChange: (nextPage, nextSize) => {
                      setPage(nextPage);
                      setPageSize(nextSize);
                    },
                  }}
                />
              ),
            },
            {
              key: 'opened',
              label: '已开户账户',
              children: (
                <Table
                  rowKey="personId"
                  size="small"
                  loading={loading}
                  columns={columns}
                  dataSource={rows}
                  scroll={{ x: 1400 }}
                  pagination={{
                    current: page,
                    pageSize,
                    total,
                    showSizeChanger: true,
                    pageSizeOptions: [20, 50, 100],
                    showTotal: (count) => `共 ${count} 个账户`,
                    onChange: (nextPage, nextSize) => {
                      setPage(nextPage);
                      setPageSize(nextSize);
                    },
                  }}
                />
              ),
            },
            {
              key: 'records',
              label: '销卡记录',
              children: (
                <Table
                  rowKey="idKey"
                  size="small"
                  loading={recordLoading}
                  columns={recordColumns}
                  dataSource={records}
                  scroll={{ x: 1240 }}
                  pagination={{
                    current: page,
                    pageSize,
                    total: recordTotal,
                    showSizeChanger: true,
                    pageSizeOptions: [20, 50, 100],
                    showTotal: (count) => `共 ${count} 条销卡记录`,
                    onChange: (nextPage, nextSize) => {
                      setPage(nextPage);
                      setPageSize(nextSize);
                    },
                  }}
                />
              ),
            },
          ]}
        />
      </section>

      {/* 开户 */}
      <Modal
        title={openTarget ? `开户：${openTarget.personName ?? ''}（${openTarget.personNo ?? ''}）` : '开户'}
        open={Boolean(openTarget)}
        onOk={submitOpen}
        confirmLoading={openSaving}
        onCancel={() => setOpenTarget(null)}
        okText="确认开户"
        width={720}
        destroyOnClose
      >
        <Form form={openForm} layout="vertical" preserve={false}>
          <div className="card-form-grid">
            <Form.Item name="TypeNo" label="卡类" rules={[{ required: true, message: '请选择卡类' }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={cardTypes.map((item) => ({
                  value: item.typeNo,
                  label: `${item.typeNo} ${item.typeName ?? ''}（有效期 ${item.validity ?? 0} 天）`,
                }))}
                onChange={(value) => {
                  const type = cardTypes.find((item) => item.typeNo === value);
                  if (type) {
                    openForm.setFieldValue('ValidDate', dayjs().add(type.validity ?? 365, 'day'));
                  }
                }}
              />
            </Form.Item>
            <Form.Item
              name="CardNo"
              label="卡号"
              extra={cardCheck || '留空表示不绑定卡片（虚拟账户）'}
              validateStatus={cardCheck.startsWith('不可用') ? 'error' : undefined}
            >
              <Input
                maxLength={12}
                placeholder="最长 12 位"
                onBlur={(event) => {
                  if (openTarget) void verifyCardNo(event.target.value, openTarget.personId);
                }}
              />
            </Form.Item>
            <Form.Item name="CardSn" label="卡序列号">
              <Input maxLength={12} placeholder="读卡器读取的物理序列号" />
            </Form.Item>
            <Form.Item name="Password" label="卡密码" extra="留空表示开户后不设密码">
              <Input.Password maxLength={20} autoComplete="new-password" />
            </Form.Item>
            <Form.Item name="ValidDate" label="有效期">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="MainFund" label="开户充值（主账户）">
              <InputNumber min={0} max={99999999} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="SmallFund" label="小账户初始金额">
              <InputNumber min={0} max={99999999} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="Remark" label="备注">
              <Input maxLength={50} />
            </Form.Item>
          </div>
          {cardCheck ? <Alert style={{ marginBottom: 12 }} type={cardCheck.startsWith('不可用') ? 'error' : 'info'} showIcon message={cardCheck} /> : null}
          <Form.Item name="ConfirmBlacklist" valuePropName="checked">
            <Checkbox>卡号曾进入黑名单，已核实可以继续开户</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* 改卡 */}
      <Modal
        title={editTarget ? `修改卡信息：${editTarget.personName ?? ''}` : '修改卡信息'}
        open={Boolean(editTarget)}
        onOk={submitEdit}
        confirmLoading={editSaving}
        onCancel={() => setEditTarget(null)}
        okText="保存"
        destroyOnClose
      >
        <Alert
          style={{ marginBottom: 12 }}
          type="info"
          showIcon
          message="卡号变更请走「换卡与补卡」"
          description="本页只改卡类、有效期与密码；卡号与余额变更需在换卡、开户充值中处理。"
        />
        <Form form={editForm} layout="vertical" preserve={false}>
          <Form.Item name="TypeNo" label="卡类" rules={[{ required: true, message: '请选择卡类' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={cardTypes.map((item) => ({
                value: item.typeNo,
                label: `${item.typeNo} ${item.typeName ?? ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="ValidDate" label="有效期">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="Password" label="新卡密码" extra="留空表示不修改">
            <Input.Password maxLength={20} autoComplete="new-password" />
          </Form.Item>
          {editTarget && editForm.getFieldValue('TypeNo') !== editTarget.typeNo ? (
            <Form.Item name="ConfirmTypeChange" valuePropName="checked">
              <Checkbox>确认变更卡类（消费折扣、限额将按新卡类执行）</Checkbox>
            </Form.Item>
          ) : null}
        </Form>
      </Modal>

      {/* 销户 */}
      <Modal
        title={closeTarget ? `销户：${closeTarget.personName ?? ''}（${closeTarget.personNo ?? ''}）` : '销户'}
        open={Boolean(closeTarget)}
        onOk={submitClose}
        confirmLoading={closeSaving}
        onCancel={() => setCloseTarget(null)}
        okText="确认销户"
        okButtonProps={{ danger: true, disabled: !has('card:accountOpen:closeConfirm') }}
        width={760}
        destroyOnClose
      >
        {!has('card:accountOpen:closeConfirm') ? (
          <Alert
            style={{ marginBottom: 12 }}
            type="error"
            showIcon
            message="缺少销户复核权限"
            description="销户需要「销户办理」与「销户复核」两个权限，请联系管理员分配 card:accountOpen:closeConfirm。"
          />
        ) : null}
        <Alert
          style={{ marginBottom: 12 }}
          type="warning"
          showIcon
          message="销户不可撤销"
          description="确认后卡号进入黑名单、账户记录归档；人员档案是否注销由下方选项决定。"
        />
        {closeLoading ? (
          <Card loading bordered={false} />
        ) : closePreview ? (
          <Descriptions size="small" bordered column={2} style={{ marginBottom: 12 }}>
            <Descriptions.Item label="卡号">{closePreview.cardNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="卡类">
              {closePreview.typeNo ? `${closePreview.typeNo} ${closePreview.typeName ?? ''}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="卡状态">{cardStateTag(closePreview.cardState)}</Descriptions.Item>
            <Descriptions.Item label="押金">¥{money(closePreview.foregift)}</Descriptions.Item>
            <Descriptions.Item label="主账户">¥{money(closePreview.balance)}</Descriptions.Item>
            <Descriptions.Item label="小账户">¥{money(closePreview.smallBalance)}</Descriptions.Item>
            <Descriptions.Item label="卡内余额（IC）">¥{money(closePreview.icBalance)}</Descriptions.Item>
            <Descriptions.Item label="卡费（不退）">
              <Tooltip title={closePreview.chargeNote ?? '卡费只登记不退还'}>¥{money(closePreview.charge)}</Tooltip>
            </Descriptions.Item>
            <Descriptions.Item label="应退合计">¥{money(closePreview.refundFund)}</Descriptions.Item>
            <Descriptions.Item label="补贴余额">¥{money(closePreview.subsidyFund)}</Descriptions.Item>
          </Descriptions>
        ) : null}
        <Form form={closeForm} layout="vertical" preserve={false}>
          <div className="card-form-grid">
            <Form.Item name="RefundFund" label="实退金额" rules={[{ required: true, message: '请填写实退金额' }]}>
              <InputNumber min={0} max={99999999} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="ReadCardBalance" label="读卡余额" extra="IC 卡以读卡值为准，差额写入 Back_Fund">
              <InputNumber min={0} max={99999999} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="RefundMode" label="退款方式" rules={[{ required: true, message: '请选择退款方式' }]}>
              <Select
                options={[
                  { value: '现金', label: '现金' },
                  { value: '转账', label: '转账' },
                  { value: '冲抵', label: '冲抵其他费用' },
                ]}
              />
            </Form.Item>
            <Form.Item name="VoucherNo" label="凭证号" rules={[{ required: true, message: '请填写凭证号' }]}>
              <Input maxLength={30} />
            </Form.Item>
          </div>
          <Form.Item name="Remark" label="备注">
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="DeletePerson" valuePropName="checked">
            <Checkbox>同时注销人员档案（人员不再在册）</Checkbox>
          </Form.Item>
          {closeTarget?.cardState === 1 ? (
            <Form.Item name="ConfirmLost" valuePropName="checked">
              <Checkbox>该卡处于挂失状态，已确认按挂失卡销户</Checkbox>
            </Form.Item>
          ) : null}
          <Form.Item
            name="Confirmed"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('请勾选确认项后再提交')),
              },
            ]}
          >
            <Checkbox>我已核对退款金额与凭证号，确认销户且不可撤销</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
