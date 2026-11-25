import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, KeyOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { usePermission } from '@/hooks/usePermission';
import { fetchCardDeptTree } from '@/services/card';
import {
  changePersonalPassword,
  exportPersonalAccount,
  fetchPersonalDetail,
  fetchPersonalFlows,
  searchPersonal,
} from '@/services/cardAccount';
import type { CardDeptNode } from '@/types/card';
import type { CardFlowRow, CardPersonalDetail, CardPersonalRow } from '@/types/cardAccount';
import { CardDeptSearchRow, CardDeptTreePanel, formatDateTime } from './shared';
import { FLOW_TYPE_OPTIONS, cardStateTag, directionText, money } from './accountShared';

interface PwdFormValues {
  OldPassword?: string;
  AuthCode?: string;
  NewPassword: string;
  ConfirmPassword: string;
  CardWritten: boolean;
  Remark?: string;
}

/**
 * 个人账户：柜台与客服使用的账户全景页。
 * 聚合人员、卡、余额、限额、状态与统一流水（7 类流水合并分页）；写操作仅改密。
 */
export default function PersonalAccountPage() {
  const { message } = App.useApp();
  const { has } = usePermission();

  const [deptNodes, setDeptNodes] = useState<CardDeptNode[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptKeyword, setDeptKeyword] = useState('');
  const [deptId, setDeptId] = useState<number | undefined>();

  const [rows, setRows] = useState<CardPersonalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<CardPersonalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [flows, setFlows] = useState<CardFlowRow[]>([]);
  const [flowTotal, setFlowTotal] = useState(0);
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowPage, setFlowPage] = useState(1);
  const [flowPageSize, setFlowPageSize] = useState(20);
  const [flowTypes, setFlowTypes] = useState<string[]>(FLOW_TYPE_OPTIONS.map((item) => item.value));
  const [flowRange, setFlowRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(90, 'day'), dayjs()]);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdForm] = Form.useForm<PwdFormValues>();

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

  const load = useCallback(() => {
    setLoading(true);
    searchPersonal({
      keyword: keyword.trim() || undefined,
      deptId,
      includeChildren: true,
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
  }, [keyword, deptId, page, pageSize, message]);

  useEffect(() => {
    load();
  }, [load]);

  const loadFlows = useCallback(
    (personId: number) => {
      setFlowLoading(true);
      fetchPersonalFlows(personId, {
        startTime: flowRange[0].format('YYYY-MM-DD'),
        endTime: flowRange[1].format('YYYY-MM-DD'),
        types: flowTypes.join(','),
        page: flowPage,
        pageSize: flowPageSize,
      })
        .then((result) => {
          setFlows(result.items);
          setFlowTotal(result.total);
        })
        .catch((error) => {
          setFlows([]);
          setFlowTotal(0);
          message.error(error instanceof Error ? error.message : '读取流水失败');
        })
        .finally(() => setFlowLoading(false));
    },
    [flowRange, flowTypes, flowPage, flowPageSize, message],
  );

  const openDetail = async (record: CardPersonalRow) => {
    setDetailOpen(true);
    setDetail(null);
    setFlowPage(1);
    setDetailLoading(true);
    try {
      const result = await fetchPersonalDetail(record.personId);
      setDetail(result);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取账户详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (detailOpen && detail) loadFlows(detail.person.personId);
  }, [detailOpen, detail, loadFlows]);

  const handleExport = async () => {
    if (!detail) return;
    try {
      await exportPersonalAccount(detail.person.personId, detail.person.personNo);
      message.success('已开始导出');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出失败');
    }
  };

  const submitPwd = async () => {
    if (!detail) return;
    const values = await pwdForm.validateFields();
    if (values.NewPassword !== values.ConfirmPassword) {
      message.error('两次输入的新密码不一致');
      return;
    }
    setPwdSaving(true);
    try {
      const result = await changePersonalPassword(detail.person.personId, {
        OldPassword: values.OldPassword?.trim() || undefined,
        AuthCode: values.AuthCode?.trim() || undefined,
        NewPassword: values.NewPassword,
        CardWritten: values.CardWritten === true,
        Remark: values.Remark?.trim() || undefined,
      });
      message.success(result.synced ? '卡密码已修改，卡内与库内已同步' : '卡密码已修改，卡内未同步');
      setPwdOpen(false);
      openDetail({
        personId: detail.person.personId,
        personNo: detail.person.personNo,
        personName: detail.person.personName,
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : '修改密码失败');
    } finally {
      setPwdSaving(false);
    }
  };

  const columns: ColumnsType<CardPersonalRow> = [
    { title: '人员编号', dataIndex: 'personNo', key: 'personNo', width: 110 },
    { title: '姓名', dataIndex: 'personName', key: 'personName', width: 100 },
    { title: '部门', dataIndex: 'deptName', key: 'deptName', width: 170, render: (value: string | null) => value || '-' },
    { title: '卡号', dataIndex: 'cardNo', key: 'cardNo', width: 130, render: (value: string | null) => value || '-' },
    { title: '卡类', key: 'typeNo', width: 150, render: (_, record) => (record.typeNo ? `${record.typeNo} ${record.typeName ?? ''}` : '-') },
    { title: '状态', key: 'cardState', width: 90, render: (_, record) => cardStateTag(record.cardState) },
    { title: '主账户', dataIndex: 'balance', key: 'balance', width: 110, align: 'right', render: (value: number | null) => `¥${money(value)}` },
    { title: '小账户', dataIndex: 'smallBalance', key: 'smallBalance', width: 110, align: 'right', render: (value: number | null) => `¥${money(value)}` },
    { title: '补贴', dataIndex: 'subsidyFund', key: 'subsidyFund', width: 100, align: 'right', render: (value: number | null) => `¥${money(value)}` },
    { title: 'IC 余额', dataIndex: 'icBalance', key: 'icBalance', width: 100, align: 'right', render: (value: number | null) => `¥${money(value)}` },
    { title: '有效期', dataIndex: 'validDate', key: 'validDate', width: 120, render: (value: string | null) => (value ? value.slice(0, 10) : '长期') },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => openDetail(record)}>
          查看
        </Button>
      ),
    },
  ];

  const flowColumns: ColumnsType<CardFlowRow> = [
    { title: '时间', dataIndex: 'flowTime', key: 'flowTime', width: 150, render: (value: string | null) => formatDateTime(value) },
    { title: '类型', dataIndex: 'flowTypeName', key: 'flowTypeName', width: 110, render: (value: string | null) => value || '-' },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 110, align: 'right', render: (value: number | null) => `¥${money(value)}` },
    { title: '方向', dataIndex: 'direction', key: 'direction', width: 80, render: (value: string | null) => directionText(value) },
    { title: '余额快照', dataIndex: 'balance', key: 'balance', width: 110, align: 'right', render: (value: number | null) => (value == null ? '-' : `¥${money(value)}`) },
    { title: '操作员', dataIndex: 'opUser', key: 'opUser', width: 100, render: (value: string | null) => value || '-' },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: (value: string | null) => value || '-' },
    { title: '来源表', dataIndex: 'sourceTable', key: 'sourceTable', width: 150, render: (value: string | null) => <span className="card-muted">{value || '-'}</span> },
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
            style={{ width: 240 }}
            placeholder="搜索编号 / 姓名 / 卡号 / 证件号"
            value={keyword}
            onChange={(event) => {
              setPage(1);
              setKeyword(event.target.value);
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={load}>
            刷新
          </Button>
          <span className="card-muted">只显示已开户人员；销户、冻结、挂失请在对应页面办理</span>
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
            showTotal: (count) => `共 ${count} 个账户`,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            },
          }}
        />
      </section>

      <Drawer
        title={
          detail
            ? `个人账户：${detail.person.personName ?? ''}（${detail.person.personNo ?? ''}）`
            : '个人账户'
        }
        width={980}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        destroyOnClose
        extra={
          <Space>
            {has('card:personal:changePwd') ? (
              <Button
                icon={<KeyOutlined />}
                onClick={() => {
                  pwdForm.resetFields();
                  pwdForm.setFieldsValue({ CardWritten: false, Remark: '后台修改卡密码' });
                  setPwdOpen(true);
                }}
              >
                修改密码
              </Button>
            ) : null}
            {has('card:personal:export') ? (
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                导出
              </Button>
            ) : null}
          </Space>
        }
      >
        {detailLoading || !detail ? (
          <Card loading bordered={false} />
        ) : (
          <>
            {detail.amounts.balanceMismatch ? (
              <Alert
                style={{ marginBottom: 12 }}
                type="warning"
                showIcon
                message="库内余额与卡内余额不一致"
                description={detail.amounts.mismatchNote ?? '请核对读卡结果后再办理资金业务'}
              />
            ) : null}

            <Descriptions size="small" bordered column={3} title="基本信息">
              <Descriptions.Item label="人员编号">{detail.person.personNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="姓名">{detail.person.personName || '-'}</Descriptions.Item>
              <Descriptions.Item label="部门">{detail.person.deptName || '-'}</Descriptions.Item>
              <Descriptions.Item label="卡号">{detail.person.cardNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="卡序列号">{detail.person.cardSn || '-'}</Descriptions.Item>
              <Descriptions.Item label="卡状态">{cardStateTag(detail.account.cardState)}</Descriptions.Item>
              <Descriptions.Item label="卡类">
                {detail.account.typeNo ? `${detail.account.typeNo} ${detail.account.typeName ?? ''}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="开户时间">{formatDateTime(detail.account.newDate)}</Descriptions.Item>
              <Descriptions.Item label="有效期">
                {detail.account.validDate ? detail.account.validDate.slice(0, 10) : '长期'}
              </Descriptions.Item>
              <Descriptions.Item label="卡密码">
                {detail.account.pwdConfigured === 1 ? <Tag color="green">已设置</Tag> : <Tag>未设置</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="最近更新">{formatDateTime(detail.account.updateTime)}</Descriptions.Item>
              <Descriptions.Item label="冻结原因">
                {detail.account.lockReasonText || <span className="card-muted">-</span>}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions size="small" bordered column={4} title="资金" style={{ marginTop: 16 }}>
              <Descriptions.Item label="主账户">¥{money(detail.amounts.balance)}</Descriptions.Item>
              <Descriptions.Item label="小账户">¥{money(detail.amounts.smallBalance)}</Descriptions.Item>
              <Descriptions.Item label="补贴">¥{money(detail.amounts.subsidyFund)}</Descriptions.Item>
              <Descriptions.Item label="IC 卡内">¥{money(detail.amounts.icBalance)}</Descriptions.Item>
              <Descriptions.Item label="押金">¥{money(detail.amounts.foregift)}</Descriptions.Item>
              <Descriptions.Item label="卡费">
                <Tooltip title="卡费只登记不退还">¥{money(detail.amounts.charge)}</Tooltip>
              </Descriptions.Item>
              <Descriptions.Item label="可退合计">
                ¥{money(detail.amounts.balance + detail.amounts.smallBalance + detail.amounts.foregift)}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions size="small" bordered column={4} title="限额与规则" style={{ marginTop: 16 }}>
              <Descriptions.Item label="最低余额">¥{money(detail.limits.minBalance)}</Descriptions.Item>
              <Descriptions.Item label="单次消费限额">¥{money(detail.limits.sfMaxFund)}</Descriptions.Item>
              <Descriptions.Item label="日消费限额">¥{money(detail.limits.sfMaxDayFund)}</Descriptions.Item>
              <Descriptions.Item label="每日次数">{detail.limits.sfLimitTimes}</Descriptions.Item>
              <Descriptions.Item label="IC 卡上限">¥{money(detail.limits.maxIcFunds)}</Descriptions.Item>
              <Descriptions.Item label="小账户折扣">{detail.limits.smallDiscount}%</Descriptions.Item>
              <Descriptions.Item label="小账户上限">¥{money(detail.limits.smallAccountMax)}</Descriptions.Item>
              <Descriptions.Item label="黑名单保留">{detail.limits.blackDays} 天</Descriptions.Item>
            </Descriptions>

            <div className="system-toolbar" style={{ marginTop: 16 }}>
              <span className="card-toolbar-label">统一流水</span>
              <DatePicker.RangePicker
                value={flowRange}
                onChange={(values) => {
                  if (values && values[0] && values[1]) {
                    setFlowPage(1);
                    setFlowRange([values[0], values[1]]);
                  }
                }}
              />
              <Select
                mode="multiple"
                allowClear
                style={{ minWidth: 260 }}
                value={flowTypes}
                options={FLOW_TYPE_OPTIONS}
                onChange={(values) => {
                  setFlowPage(1);
                  setFlowTypes(values.length > 0 ? values : FLOW_TYPE_OPTIONS.map((item) => item.value));
                }}
              />
              <Button icon={<ReloadOutlined />} onClick={() => loadFlows(detail.person.personId)}>
                刷新
              </Button>
              <span className="card-muted">单次查询跨度不超过 1 年，导出上限 5000 条</span>
            </div>

            <Table
              rowKey={(record) => `${record.flowType}-${record.flowTime}-${record.amount}-${record.sourceTable}`}
              size="small"
              loading={flowLoading}
              columns={flowColumns}
              dataSource={flows}
              scroll={{ x: 1100 }}
              pagination={{
                current: flowPage,
                pageSize: flowPageSize,
                total: flowTotal,
                showSizeChanger: true,
                pageSizeOptions: [20, 50, 100],
                showTotal: (count) => `共 ${count} 条流水`,
                onChange: (nextPage, nextSize) => {
                  setFlowPage(nextPage);
                  setFlowPageSize(nextSize);
                },
              }}
            />
          </>
        )}
      </Drawer>

      <Modal
        title="修改卡密码"
        open={pwdOpen}
        onOk={submitPwd}
        confirmLoading={pwdSaving}
        onCancel={() => setPwdOpen(false)}
        okText="提交"
        destroyOnClose
      >
        <Alert
          style={{ marginBottom: 12 }}
          type="info"
          showIcon
          message="先写卡、后写库"
          description="系统参数 Card.Pwd.SyncCard = 1 时，必须先由读卡器把新密码写入卡内，再在 BS 提交；BS 不直接操作硬件。"
        />
        <Form form={pwdForm} layout="vertical" preserve={false}>
          <Form.Item name="OldPassword" label="原密码" extra="该卡未设置密码时请改用复核码">
            <Input.Password maxLength={20} autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="AuthCode" label="复核码" extra="管理员复核码（超级密码）">
            <Input.Password maxLength={30} autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="NewPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { max: 20, message: '不超过 20 位' },
            ]}
          >
            <Input.Password maxLength={20} autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="ConfirmPassword"
            label="确认新密码"
            rules={[{ required: true, message: '请再次输入新密码' }]}
          >
            <Input.Password maxLength={20} autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="CardWritten" valuePropName="checked">
            <Checkbox>已通过读卡器把新密码写入卡内</Checkbox>
          </Form.Item>
          <Form.Item name="Remark" label="备注">
            <Input maxLength={50} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
