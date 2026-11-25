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
  Radio,
  Space,
  Switch,
  Table,
  Timeline,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { fetchLossHistory, fetchLossList, lossCard, unlossCard } from '@/services/cardAccount';
import type { CardCardRow, CardLogRow } from '@/types/cardAccount';
import { formatDateTime } from './shared';
import { LOSS_REASONS, cardStateTag, money, newRequestNo, opTypeText } from './accountShared';

interface LossFormValues {
  ReasonText: string;
  Channel: 'WINDOW' | 'PHONE';
  Contact?: string;
  PoliceReport: boolean;
  Password?: string;
  AuthCode?: string;
  FoundNote?: string;
}

/**
 * 卡挂失与解挂：状态机 0 →(挂失) 1 →(解挂) 0。
 * 已补卡的挂失记录禁止解挂（后端返回 40920），挂失卡禁止消费。
 */
export default function CardLossPage() {
  const { message } = App.useApp();
  const { has } = usePermission();

  const [rows, setRows] = useState<CardCardRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [allStates, setAllStates] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [remindDays, setRemindDays] = useState(30);

  const [lossTarget, setLossTarget] = useState<CardCardRow | null>(null);
  const [unlossTarget, setUnlossTarget] = useState<CardCardRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<LossFormValues>();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<CardLogRow[]>([]);
  const [historyTitle, setHistoryTitle] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchLossList({
      keyword: keyword.trim() || undefined,
      allStates,
      page,
      pageSize,
    })
      .then((result) => {
        setRows(result.items);
        setTotal(result.total);
        setRemindDays(result.remindDays ?? 30);
      })
      .catch((error) => {
        setRows([]);
        setTotal(0);
        message.error(error instanceof Error ? error.message : '读取挂失清单失败');
      })
      .finally(() => setLoading(false));
  }, [keyword, allStates, page, pageSize, message]);

  useEffect(() => {
    load();
  }, [load]);

  const openLoss = (record: CardCardRow) => {
    setLossTarget(record);
    form.resetFields();
    form.setFieldsValue({
      ReasonText: LOSS_REASONS[0],
      Channel: 'WINDOW',
      Contact: record.mobile ?? '',
      PoliceReport: false,
      Password: '',
      AuthCode: '',
      FoundNote: '',
    });
  };

  const openUnloss = (record: CardCardRow) => {
    setUnlossTarget(record);
    form.resetFields();
    form.setFieldsValue({ FoundNote: '' });
  };

  const submitLoss = async () => {
    if (!lossTarget) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      await lossCard(lossTarget.personId, {
        ReasonText: values.ReasonText,
        Channel: values.Channel,
        Contact: values.Contact?.trim() || undefined,
        PoliceReport: values.PoliceReport === true,
        Password: values.Password?.trim() || undefined,
        AuthCode: values.AuthCode?.trim() || undefined,
        FoundNote: values.FoundNote?.trim() || undefined,
        RequestNo: newRequestNo(),
      });
      message.success('挂失成功，该卡已禁止消费');
      setLossTarget(null);
      load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '挂失失败');
    } finally {
      setSaving(false);
    }
  };

  const submitUnloss = async () => {
    if (!unlossTarget) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      await unlossCard(unlossTarget.personId, {
        ReasonText: '核实卡片已找回，解除挂失',
        FoundNote: values.FoundNote?.trim() || undefined,
        RequestNo: newRequestNo(),
      });
      message.success('解挂成功，卡已恢复正常');
      setUnlossTarget(null);
      load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '解挂失败');
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (record: CardCardRow) => {
    setHistoryOpen(true);
    setHistoryTitle(`${record.personName ?? ''}（${record.personNo ?? ''}）`);
    setHistoryLoading(true);
    setHistoryItems([]);
    try {
      const result = await fetchLossHistory(record.personId);
      setHistoryItems(result.items ?? []);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取挂失记录失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns: ColumnsType<CardCardRow> = [
    { title: '人员编号', dataIndex: 'personNo', key: 'personNo', width: 110 },
    { title: '姓名', dataIndex: 'personName', key: 'personName', width: 100 },
    { title: '部门', dataIndex: 'deptName', key: 'deptName', width: 160, render: (value: string | null) => value || '-' },
    { title: '卡号', dataIndex: 'cardNo', key: 'cardNo', width: 130, render: (value: string | null) => value || '-' },
    { title: '卡类', key: 'typeNo', width: 150, render: (_, record) => (record.typeNo ? `${record.typeNo} ${record.typeName ?? ''}` : '-') },
    { title: '状态', key: 'cardState', width: 90, render: (_, record) => cardStateTag(record.cardState) },
    { title: '主账户', dataIndex: 'balance', key: 'balance', width: 100, align: 'right', render: (value: number | null) => money(value) },
    {
      title: '挂失天数',
      key: 'lostDays',
      width: 130,
      render: (_, record) =>
        record.lostDays > 0 ? (
          <Space size={4}>
            <span>{record.lostDays} 天</span>
            {record.longTerm ? <Tag color="red">待处理</Tag> : null}
          </Space>
        ) : (
          <span className="card-muted">-</span>
        ),
    },
    {
      title: '受理渠道',
      dataIndex: 'lostChannel',
      key: 'lostChannel',
      width: 200,
      render: (value: string | null) => value || <span className="card-muted">-</span>,
    },
    { title: '最近挂失', dataIndex: 'lastLockTime', key: 'lastLockTime', width: 150, render: (value: string | null) => formatDateTime(value) },
    { title: '最近解挂', dataIndex: 'lastUnlockTime', key: 'lastUnlockTime', width: 150, render: (value: string | null) => formatDateTime(value) },
    {
      title: '操作',
      key: 'actions',
      width: 190,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {has('card:cardLoss:loss') && (
            <Button
              type="link"
              size="small"
              danger
              disabled={record.cardState !== 0}
              title={record.cardState !== 0 ? '只有正常状态可以挂失' : undefined}
              onClick={() => openLoss(record)}
            >
              挂失
            </Button>
          )}
          {has('card:cardLoss:unloss') && (
            <Button
              type="link"
              size="small"
              disabled={record.cardState !== 1}
              title={record.cardState !== 1 ? '只有挂失状态可以解挂' : undefined}
              onClick={() => openUnloss(record)}
            >
              解挂
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
          <Space size={6}>
            <span className="card-muted">显示全部状态</span>
            <Switch
              size="small"
              checked={allStates}
              onChange={(value) => {
                setPage(1);
                setAllStates(value);
              }}
            />
          </Space>
          <Button icon={<ReloadOutlined />} onClick={load}>
            刷新
          </Button>
          <span className="card-muted">挂失超过 {remindDays} 天标记为待处理；已补卡的挂失记录不可解挂</span>
        </div>

        <Table
          rowKey="personId"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 1620 }}
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
        title={lossTarget ? `挂失：${lossTarget.personName ?? ''}（${lossTarget.cardNo ?? ''}）` : '挂失'}
        open={Boolean(lossTarget)}
        onOk={submitLoss}
        confirmLoading={saving}
        onCancel={() => setLossTarget(null)}
        okText="确认挂失"
        okButtonProps={{ danger: true }}
        width={680}
        destroyOnClose
      >
        <Alert
          style={{ marginBottom: 12 }}
          type="warning"
          showIcon
          message="挂失后该卡禁止消费，写 ST_LockCard"
          description="挂失卡不允许冻结；如需恢复使用请办理解挂或补卡。"
        />
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="ReasonText" label="挂失原因" rules={[{ required: true, message: '请选择或填写挂失原因' }]}>
            <AutoComplete
              options={LOSS_REASONS.map((item) => ({ value: item }))}
              filterOption={(input, option) => String(option?.value ?? '').includes(input)}
            />
          </Form.Item>
          <Form.Item name="Channel" label="受理渠道" rules={[{ required: true }]}>
            <Radio.Group
              options={[
                { value: 'WINDOW', label: '窗口受理' },
                { value: 'PHONE', label: '电话受理' },
              ]}
            />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, next) => prev.Channel !== next.Channel}
          >
            {({ getFieldValue }) =>
              getFieldValue('Channel') === 'PHONE' ? (
                <Form.Item
                  name="Contact"
                  label="联系方式"
                  rules={[{ required: true, message: '电话受理必须填写联系方式' }, { max: 30, message: '不超过 30 位' }]}
                >
                  <Input maxLength={30} placeholder="来电号码或回访电话" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="PoliceReport" label="是否已报警" valuePropName="checked">
            <Switch checkedChildren="已报警" unCheckedChildren="未报警" />
          </Form.Item>
          <div className="card-form-grid">
            <Form.Item name="Password" label="卡密码">
              <Input.Password maxLength={20} autoComplete="new-password" />
            </Form.Item>
            <Form.Item name="AuthCode" label="复核码">
              <Input.Password maxLength={30} autoComplete="new-password" />
            </Form.Item>
          </div>
          <Form.Item name="FoundNote" label="补充说明">
            <Input.TextArea rows={2} maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={unlossTarget ? `解挂：${unlossTarget.personName ?? ''}（${unlossTarget.cardNo ?? ''}）` : '解挂'}
        open={Boolean(unlossTarget)}
        onOk={submitUnloss}
        confirmLoading={saving}
        onCancel={() => setUnlossTarget(null)}
        okText="确认解挂"
        destroyOnClose
      >
        <Alert
          style={{ marginBottom: 12 }}
          type="info"
          showIcon
          message="已补卡的挂失记录不可解挂"
          description="后端会校验挂失之后是否存在补卡记录（ST_AlterCard），存在时返回「该卡已补办」。"
        />
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="FoundNote" label="卡片找回经过">
            <Input.TextArea rows={3} maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`挂失解挂记录：${historyTitle}`}
        width={560}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        destroyOnClose
      >
        {historyLoading ? (
          <Card loading bordered={false} />
        ) : historyItems.length === 0 ? (
          <p className="card-muted">暂无挂失解挂记录</p>
        ) : (
          <Timeline
            items={historyItems.map((item) => ({
              color: item.opType === 'LOSS' ? 'orange' : 'green',
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
                    {item.ext1 ? ` · ${item.ext1}` : ''}
                  </div>
                </div>
              ),
            }))}
          />
        )}
      </Drawer>
    </div>
  );
}
