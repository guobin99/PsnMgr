import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
} from 'antd';
import { ReloadOutlined, SafetyCertificateOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePermission } from '@/hooks/usePermission';
import { fetchAccountInfo, generateInitCode, saveAccountInfo } from '@/services/cardAccount';
import type { CardAccountInfoRow } from '@/types/cardAccount';

interface AccountInfoFormValues {
  CardType: string;
  Foregift?: number;
  Charge?: number;
  PasswdValue?: string;
  SmallAccountMax?: number;
  IsDelSubsidy: boolean;
  DayDelSysBlack?: number;
  CardSpec?: number;
  IdCardLen?: number;
}

/**
 * 账户信息设置：维护全局卡务参数（押金、卡费、初始密码、小账户上限、补贴截止、
 * 黑名单保留天数与卡片规格）。ST_CardInfo 全表仅一条记录，页面始终读写同一条，
 * 不设卡类列表；保存只影响后续开户，已开户卡的金额与密码不变。
 */
export default function AccountInfoPage() {
  const { message } = App.useApp();
  const { has } = usePermission();
  const canEdit = has('card:account:update');

  const [detail, setDetail] = useState<CardAccountInfoRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [initCodeOpen, setInitCodeOpen] = useState(false);
  const [initCode, setInitCode] = useState('');
  const [initSaving, setInitSaving] = useState(false);
  const [form] = Form.useForm<AccountInfoFormValues>();

  const loadDetail = useCallback(() => {
    setLoading(true);
    setLoadError('');
    fetchAccountInfo()
      .then((row) => {
        setDetail(row);
        form.setFieldsValue({
          CardType: row.cardType || 'IC卡',
          Foregift: row.foregift ?? 0,
          Charge: row.charge ?? 0,
          SmallAccountMax: row.smallAccountMax ?? 0,
          IsDelSubsidy: row.isDelSubsidy === true,
          DayDelSysBlack: row.dayDelSysBlack ?? 182,
          CardSpec: row.cardSpec ?? 0,
          IdCardLen: row.idCardLen ?? 10,
          PasswdValue: '',
        });
      })
      .catch((error) => {
        setDetail(null);
        setLoadError(error instanceof Error ? error.message : '读取账户信息失败');
      })
      .finally(() => setLoading(false));
  }, [form]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const row = await saveAccountInfo({
        CardType: values.CardType,
        Foregift: values.Foregift ?? 0,
        Charge: values.Charge ?? 0,
        PasswdValue: values.PasswdValue?.trim() ? values.PasswdValue.trim() : undefined,
        SmallAccountMax: values.SmallAccountMax ?? 0,
        IsDelSubsidy: values.IsDelSubsidy === true,
        DayDelSysBlack: values.DayDelSysBlack ?? 182,
        CardSpec: values.CardSpec ?? 0,
        IdCardLen: values.IdCardLen ?? 10,
      });
      setDetail(row);
      form.setFieldValue('PasswdValue', '');
      message.success('账户信息已保存，仅影响后续开户');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleInitCode = async () => {
    if (!initCode.trim()) {
      message.warning('请输入读卡代理读到的卡内初始密钥');
      return;
    }
    setInitSaving(true);
    try {
      await generateInitCode(initCode.trim());
      message.success('初始密钥已配置');
      setInitCodeOpen(false);
      setInitCode('');
      loadDetail();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '写入初始密钥失败');
    } finally {
      setInitSaving(false);
    }
  };

  return (
    <div className="system-page system-page-single">
      <section className="system-workspace">
        <Spin spinning={loading}>
          {!detail ? (
            <Card>
              <Empty
                description={loadError || '卡务参数尚未初始化，请先在数据库中建立 ST_CardInfo 唯一记录'}
              >
                <Button icon={<ReloadOutlined />} onClick={loadDetail}>
                  重新读取
                </Button>
              </Empty>
            </Card>
          ) : (
            <Card
              title={
                <Space size={8}>
                  <span>全局卡务参数</span>
                  <Tag color="blue">全表单条记录</Tag>
                  {detail.initCodeConfigured === 1 ? <Tag color="green">初始密钥已配置</Tag> : null}
                </Space>
              }
              extra={
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={loadDetail}>
                    刷新
                  </Button>
                  {canEdit ? (
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                      保存
                    </Button>
                  ) : null}
                </Space>
              }
            >
              {(detail.recordCount ?? 1) > 1 ? (
                <Alert
                  style={{ marginBottom: 12 }}
                  type="error"
                  showIcon
                  message={`检测到 ${detail.recordCount} 条账户信息记录`}
                  description="ST_CardInfo 业务上只允许一条记录。请先在数据库中清理为单条，否则保存会被拒绝。"
                />
              ) : null}

              <Descriptions size="small" column={3} bordered style={{ marginBottom: 12 }}>
                <Descriptions.Item label="当前卡类型">
                  {detail.cardType || '未设置'}
                  <span className="card-muted"> · 可在下方“密钥与卡片”中修改</span>
                </Descriptions.Item>
                <Descriptions.Item label="最近修改时间">
                  {detail.updateTime ? dayjs(detail.updateTime).format('YYYY-MM-DD HH:mm:ss') : '暂无记录'}
                </Descriptions.Item>
                <Descriptions.Item label="最近修改人">{detail.updateUser || '—'}</Descriptions.Item>
              </Descriptions>

              {!canEdit ? (
                <p className="system-readonly-tip">当前账号只有查看权限，保存按钮已隐藏。</p>
              ) : null}

              <Form form={form} layout="vertical" disabled={!canEdit}>
                <Divider orientation="left" plain>
                  费用与限额
                </Divider>
                <div className="card-form-grid">
                  <Form.Item name="Foregift" label="押金（元）" extra="开户写入 ST_Card，销户时与余额一并退还">
                    <InputNumber min={0} max={99999} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="Charge" label="卡费（元）" extra="只登记不退还">
                    <InputNumber min={0} max={99999} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="SmallAccountMax" label="小账户上限（元）" extra="为 0 时开户不允许转入小账户">
                    <InputNumber min={0} max={99999999} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item
                    name="PasswdValue"
                    label="卡初始密码"
                    extra={
                      detail.passwdConfigured === 1
                        ? '已配置，留空保持不变（保存时加密存储）'
                        : '尚未配置（保存时加密存储）'
                    }
                  >
                    <Input.Password maxLength={24} placeholder="留空保持不变" autoComplete="new-password" />
                  </Form.Item>
                </div>

                <Divider orientation="left" plain>
                  密钥与卡片
                </Divider>
                <div className="card-form-grid">
                  <Form.Item
                    name="CardType"
                    label="卡类型"
                    extra="对应 ST_CardInfo.Card_Type，保存后影响后续开户与写卡"
                    rules={[{ required: true, message: '请选择卡类型' }]}
                  >
                    <Select
                      options={[
                        { value: 'IC卡', label: 'IC卡' },
                        { value: 'ID卡', label: 'ID卡' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="CardSpec" label="卡片型号" extra="0 = IC-MF1S50，1 = CPU-FMCOS2">
                    <Select
                      options={[
                        { value: 0, label: '0 · IC-MF1S50' },
                        { value: 1, label: '1 · CPU-FMCOS2' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="IdCardLen" label="ID 卡读卡长度" extra="写 ST_SysParam.IDCardLen，仅支持 10、8、6">
                    <Select
                      options={[
                        { value: 10, label: '10 位' },
                        { value: 8, label: '8 位' },
                        { value: 6, label: '6 位' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item label="卡内初始密钥" extra="依赖读卡器，读到的密钥由服务端加密写入 Init_Code">
                    <Space>
                      <Tag color={detail.initCodeConfigured === 1 ? 'green' : 'default'}>
                        {detail.initCodeConfigured === 1 ? '已配置' : '未配置'}
                      </Tag>
                      <Button
                        size="small"
                        icon={<SafetyCertificateOutlined />}
                        disabled={!canEdit}
                        onClick={() => setInitCodeOpen(true)}
                      >
                        读卡生成
                      </Button>
                    </Space>
                  </Form.Item>
                </div>

                <Divider orientation="left" plain>
                  补贴与黑名单
                </Divider>
                <div className="card-form-grid">
                  <Form.Item
                    name="IsDelSubsidy"
                    label="是否扣补贴"
                    valuePropName="checked"
                    extra="开启后扣除上月未用完的补贴"
                  >
                    <Switch checkedChildren="扣减" unCheckedChildren="不扣减" />
                  </Form.Item>
                  <Form.Item name="DayDelSysBlack" label="黑名单保留天数" extra="0 至 3650，默认 182 天">
                    <InputNumber min={0} max={3650} precision={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                <Alert
                  type="info"
                  showIcon
                  message="账户信息只影响后续开户"
                  description="修改押金、卡费、初始密码不会改变已开账户的金额与密码；全局参数对所有卡类生效，如已开账户需要调整金额，请走个人账户页面的资金业务。"
                />
              </Form>
            </Card>
          )}
        </Spin>
      </section>

      <Modal
        title="读卡生成初始密钥"
        open={initCodeOpen}
        onCancel={() => setInitCodeOpen(false)}
        onOk={handleInitCode}
        confirmLoading={initSaving}
        okText="保存"
        destroyOnClose
      >
        <Alert
          style={{ marginBottom: 12 }}
          type="warning"
          showIcon
          message="BS 不直接操作硬件"
          description="请先用读卡代理读取卡内初始密钥，再把读到的密钥粘贴到下方。保存后界面只显示“已配置”。"
        />
        <Input.TextArea
          rows={3}
          maxLength={100}
          showCount
          value={initCode}
          placeholder="读卡代理读到的初始密钥"
          onChange={(event) => setInitCode(event.target.value)}
        />
      </Modal>
    </div>
  );
}
