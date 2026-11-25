import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import {
  createAccountType,
  fetchAccountTypes,
  setAccountTypeStatus,
  updateAccountType,
} from '@/services/cardAccount';
import type { CardAccountTypeRow } from '@/types/cardAccount';
import { money } from './accountShared';

interface TypeFormValues {
  TypeNo?: string;
  TypeName: string;
  Validity?: number;
  MinBalance?: number;
  Subsidy?: number;
  MaxIcFunds?: number;
  SfMaxFund?: number;
  SfMaxDayFund?: number;
  SfLimitTimes?: number;
  SfMaxCount?: number;
  SfDiscount?: number;
  LhMaxFund?: number;
  LhMaxDayFund?: number;
  LhDiscount?: number;
  SmallDiscount?: number;
  IsOnlySubsidy: boolean;
  UseMoc?: string;
  UseRepast?: string;
  TypeSign?: string;
  Remark?: string;
}

/** 账户类别设置：维护 ST_CardType（卡类）的有效期、消费限额、补贴规则与适用范围 */
export default function AccountTypePage() {
  const { message, modal } = App.useApp();
  const { has } = usePermission();

  const [items, setItems] = useState<CardAccountTypeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [includeDisabled, setIncludeDisabled] = useState(true);
  const [nextNo, setNextNo] = useState<string>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CardAccountTypeRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<TypeFormValues>();

  const load = useCallback(() => {
    setLoading(true);
    fetchAccountTypes({ keyword: keyword.trim() || undefined, includeDisabled })
      .then((result) => {
        setItems(result.items);
        setNextNo(result.nextNo ?? '');
      })
      .catch((error) => {
        setItems([]);
        message.error(error instanceof Error ? error.message : '读取卡类失败');
      })
      .finally(() => setLoading(false));
  }, [keyword, includeDisabled, message]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      TypeNo: nextNo,
      Validity: 365,
      MinBalance: 0,
      Subsidy: 0,
      MaxIcFunds: 0,
      SfMaxFund: 0,
      SfMaxDayFund: 0,
      SfLimitTimes: 0,
      SfMaxCount: 0,
      SfDiscount: 100,
      LhMaxFund: 0,
      LhMaxDayFund: 0,
      LhDiscount: 100,
      SmallDiscount: 100,
      IsOnlySubsidy: false,
    });
    setModalOpen(true);
  };

  const openEdit = (record: CardAccountTypeRow) => {
    setEditing(record);
    form.resetFields();
    form.setFieldsValue({
      TypeNo: record.typeNo,
      TypeName: record.typeName ?? '',
      Validity: record.validity ?? 0,
      MinBalance: record.minBalance ?? 0,
      Subsidy: record.subsidy ?? 0,
      MaxIcFunds: record.maxIcFunds ?? 0,
      SfMaxFund: record.sfMaxFund ?? 0,
      SfMaxDayFund: record.sfMaxDayFund ?? 0,
      SfLimitTimes: record.sfLimitTimes ?? 0,
      SfMaxCount: record.sfMaxCount ?? 0,
      SfDiscount: record.sfDiscount ?? 100,
      LhMaxFund: record.lhMaxFund ?? 0,
      LhMaxDayFund: record.lhMaxDayFund ?? 0,
      LhDiscount: record.lhDiscount ?? 100,
      SmallDiscount: record.smallDiscount ?? 100,
      IsOnlySubsidy: record.isOnlySubsidy === true,
      UseMoc: record.useMoc ?? '',
      UseRepast: record.useRepast ?? '',
      TypeSign: record.typeSign ?? '',
      Remark: record.remark ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        TypeNo: values.TypeNo?.trim() || undefined,
        TypeName: values.TypeName.trim(),
        Validity: values.Validity ?? 0,
        MinBalance: values.MinBalance ?? 0,
        Subsidy: values.Subsidy ?? 0,
        MaxIcFunds: values.MaxIcFunds ?? 0,
        SfMaxFund: values.SfMaxFund ?? 0,
        SfMaxDayFund: values.SfMaxDayFund ?? 0,
        SfLimitTimes: values.SfLimitTimes ?? 0,
        SfMaxCount: values.SfMaxCount ?? 0,
        SfDiscount: values.SfDiscount ?? 100,
        LhMaxFund: values.LhMaxFund ?? 0,
        LhMaxDayFund: values.LhMaxDayFund ?? 0,
        LhDiscount: values.LhDiscount ?? 100,
        SmallDiscount: values.SmallDiscount ?? 100,
        IsOnlySubsidy: values.IsOnlySubsidy === true,
        UseMoc: values.UseMoc?.trim() || undefined,
        UseRepast: values.UseRepast?.trim() || undefined,
        TypeSign: values.TypeSign?.trim() || undefined,
        Remark: values.Remark?.trim() || undefined,
      };
      if (editing) {
        await updateAccountType(editing.typeNo, payload);
        message.success('卡类已更新');
      } else {
        await createAccountType(payload);
        message.success('卡类已新增');
      }
      setModalOpen(false);
      load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (record: CardAccountTypeRow) => {
    const disabling = record.isDel !== true;
    modal.confirm({
      title: disabling ? `确认停用卡类「${record.typeName}」？` : `确认启用卡类「${record.typeName}」？`,
      content: disabling ? '卡类被人员账户占用时不允许停用；停用后不能再开户。' : '启用后可以继续开户。',
      okButtonProps: { danger: disabling },
      onOk: async () => {
        try {
          await setAccountTypeStatus(record.typeNo, disabling);
          message.success(disabling ? '卡类已停用' : '卡类已启用');
          load();
        } catch (error) {
          message.error(error instanceof Error ? error.message : '操作失败');
        }
      },
    });
  };

  const columns: ColumnsType<CardAccountTypeRow> = [
    { title: '编号', dataIndex: 'typeNo', key: 'typeNo', width: 80 },
    { title: '名称', dataIndex: 'typeName', key: 'typeName', width: 140 },
    {
      title: '有效期(天)',
      dataIndex: 'validity',
      key: 'validity',
      width: 100,
      render: (value: number | null) => value ?? '-',
    },
    {
      title: '最低余额',
      dataIndex: 'minBalance',
      key: 'minBalance',
      width: 100,
      align: 'right',
      render: (value: number | null) => money(value),
    },
    {
      title: '单次限额',
      dataIndex: 'sfMaxFund',
      key: 'sfMaxFund',
      width: 100,
      align: 'right',
      render: (value: number | null) => money(value),
    },
    {
      title: '日限额',
      dataIndex: 'sfMaxDayFund',
      key: 'sfMaxDayFund',
      width: 100,
      align: 'right',
      render: (value: number | null) => money(value),
    },
    {
      title: '小账户折扣',
      dataIndex: 'smallDiscount',
      key: 'smallDiscount',
      width: 110,
      align: 'right',
      render: (value: number | null) => (value == null ? '-' : `${value}%`),
    },
    {
      title: '在用卡数',
      dataIndex: 'cardCount',
      key: 'cardCount',
      width: 100,
      align: 'right',
      render: (value: number) => (value > 0 ? <Tag color="blue">{value} 张</Tag> : <span className="card-muted">0</span>),
    },
    {
      title: '状态',
      dataIndex: 'isDel',
      key: 'isDel',
      width: 90,
      render: (value: boolean | null) => (value ? <Tag>已停用</Tag> : <Tag color="green">启用</Tag>),
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: (value: string | null) => value || '-' },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {has('card:accountType:update') && (
            <Button type="link" size="small" onClick={() => openEdit(record)}>
              编辑
            </Button>
          )}
          {has('card:accountType:delete') && (
            <Button type="link" size="small" danger={record.isDel !== true} onClick={() => toggleStatus(record)}>
              {record.isDel === true ? '启用' : '停用'}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="system-page system-page-single">
      <section className="system-workspace">
        <div className="system-toolbar">
          <Input.Search
            allowClear
            placeholder="搜索卡类编号 / 名称"
            style={{ width: 260 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Space size={6}>
            <span className="card-muted">显示已停用</span>
            <Switch size="small" checked={includeDisabled} onChange={setIncludeDisabled} />
          </Space>
          <Space wrap>
            {has('card:accountType:create') && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                新增卡类
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={load}>
              刷新
            </Button>
          </Space>
          {nextNo ? <span className="card-muted">下一个可用编号：{nextNo}</span> : null}
        </div>

        <Table
          rowKey="typeNo"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={items}
          scroll={{ x: 1320 }}
          pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (count) => `共 ${count} 个卡类` }}
        />
      </section>

      <Modal
        title={editing ? `编辑卡类 ${editing.typeNo}` : '新增卡类'}
        open={modalOpen}
        onOk={handleSave}
        confirmLoading={saving}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        width={860}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <div className="card-form-grid">
            <Form.Item name="TypeNo" label="卡类编号" extra="1 至 3 位，留空自动生成">
              <Input maxLength={3} disabled={Boolean(editing)} />
            </Form.Item>
            <Form.Item
              name="TypeName"
              label="卡类名称"
              rules={[{ required: true, message: '请输入卡类名称' }, { max: 20, message: '不超过 20 个字符' }]}
            >
              <Input maxLength={20} />
            </Form.Item>
            <Form.Item name="Validity" label="有效期（天）" extra="1 至 3650">
              <InputNumber min={0} max={3650} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Divider orientation="left" plain>
            资金与限额
          </Divider>
          <div className="card-form-grid">
            <Form.Item name="MinBalance" label="最低余额">
              <InputNumber min={0} max={99999999} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="Subsidy" label="补贴金额">
              <InputNumber min={0} max={99999999} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="MaxIcFunds" label="IC 卡最大余额">
              <InputNumber min={0} max={99999999} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="SfMaxFund" label="单次消费限额">
              <InputNumber min={0} max={99999999} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="SfMaxDayFund" label="日消费限额">
              <InputNumber min={0} max={99999999} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="SfLimitTimes" label="每日消费次数">
              <InputNumber min={0} max={9999} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="SfMaxCount" label="单次可消费份数">
              <InputNumber min={0} max={9999} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="SfDiscount" label="消费折扣(%)" extra="70 表示七折">
              <InputNumber min={0} max={100} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="SmallDiscount" label="小账户折扣(%)">
              <InputNumber min={0} max={100} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="LhMaxFund" label="单次取款限额">
              <InputNumber min={0} max={99999999} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="LhMaxDayFund" label="日取款限额">
              <InputNumber min={0} max={99999999} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="LhDiscount" label="取款折扣(%)">
              <InputNumber min={0} max={100} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Alert
            style={{ marginBottom: 12 }}
            type="info"
            showIcon
            message="押金、卡费、小账户上限请在「账户信息设置」中维护"
            description="押金、卡费与小账户上限属于全局卡务参数（ST_CardInfo 全表单条记录），对所有卡类生效，不随卡类新增写入。本页只维护卡类本身的消费与取款规则。"
          />

          <Divider orientation="left" plain>
            使用范围
          </Divider>
          <div className="card-form-grid">
            <Form.Item name="UseMoc" label="适用出纳机" extra="逗号分隔，留空表示全部">
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item name="UseRepast" label="适用餐次" extra="逗号分隔，留空表示全部">
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item name="TypeSign" label="卡类标识">
              <Input maxLength={20} />
            </Form.Item>
            <Form.Item name="IsOnlySubsidy" label="仅使用补贴" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
            <Form.Item name="Remark" label="备注">
              <Input maxLength={50} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
