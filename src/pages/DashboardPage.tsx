import { useMemo, useState } from 'react';
import { Button, Card, Progress, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CoffeeOutlined,
  IdcardOutlined,
  PlusOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { findNodeByPath } from '@/config/menu';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/store/auth';

interface ConsumeRecord {
  key: string;
  time: string;
  person: string;
  department: string;
  device: string;
  amount: string;
  status: string;
}

const records: ConsumeRecord[] = [
  { key: '1', time: '12:08:26', person: '陈晓', department: '研发中心', device: '一食堂 02 号机', amount: '¥ 18.00', status: '已完成' },
  { key: '2', time: '12:06:41', person: '王浩', department: '生产中心', device: '一食堂 01 号机', amount: '¥ 12.50', status: '已完成' },
  { key: '3', time: '12:03:18', person: '李静', department: '财务部', device: '二食堂 03 号机', amount: '¥ 22.00', status: '已完成' },
  { key: '4', time: '11:58:09', person: '赵磊', department: '行政部', device: '二食堂 01 号机', amount: '¥ 16.00', status: '待复核' },
];

const columns: ColumnsType<ConsumeRecord> = [
  { title: '消费时间', dataIndex: 'time', width: 110 },
  { title: '人员', dataIndex: 'person', width: 100, render: (value) => <strong>{value}</strong> },
  { title: '所属部门', dataIndex: 'department', responsive: ['md'] },
  { title: '消费终端', dataIndex: 'device', responsive: ['lg'] },
  { title: '消费金额', dataIndex: 'amount', align: 'right' },
  { title: '状态', dataIndex: 'status', width: 100, render: (value) => <Tag color={value === '已完成' ? 'success' : 'warning'}>{value}</Tag> },
];

const chartData = {
  week: [62, 78, 70, 88, 92, 48, 56],
  month: [48, 64, 58, 74, 68, 86, 79, 90, 72, 82, 94, 88],
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { has } = usePermission();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const quickEntries = [
    { label: '人员档案', path: '/card/person', icon: <TeamOutlined /> },
    { label: '消费流水', path: '/consume/records', icon: <WalletOutlined /> },
    { label: '每日考勤', path: '/attendance/daily', icon: <IdcardOutlined /> },
    { label: '门禁记录', path: '/access/record/normal', icon: <SafetyCertificateOutlined /> },
    { label: '订餐订单', path: '/meal/order', icon: <CoffeeOutlined /> },
    { label: '访客审核', path: '/visitor/approve', icon: <TeamOutlined /> },
  ].filter((entry) => has(findNodeByPath(entry.path)?.permission));

  const todos = [
    { title: '访客预约审批', count: 8, note: '最早预约今天 14:30', path: '/visitor/approve', tone: 'orange' },
    { title: '考勤增补刷卡', count: 12, note: '今日新增 5 条申请', path: '/attendance/makeup-card', tone: 'blue' },
    { title: '门禁报警待处理', count: 3, note: '含 1 条高优先级事件', path: '/access/record/alarm', tone: 'red' },
    { title: '消费流水待复核', count: 6, note: '来自 2 台消费终端', path: '/consume/correction', tone: 'cyan' },
  ].filter((item) => has(findNodeByPath(item.path)?.permission));

  const chartValues = chartData[period];
  const labels = period === 'week' ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] : chartValues.map((_, index) => `${index * 2 + 1}日`);
  const dateText = useMemo(() => dayjs().format('YYYY年MM月DD日 dddd'), []);

  const stats = [
    { title: '在册人员', value: '12,486', unit: '人', note: '本月新增 126 人', icon: <TeamOutlined />, tone: 'blue' },
    { title: '今日消费金额', value: '32,680.50', unit: '元', note: '共 2,846 笔交易', icon: <WalletOutlined />, tone: 'cyan' },
    { title: '今日出勤率', value: '96.8', unit: '%', note: '较昨日提升 0.6%', icon: <IdcardOutlined />, tone: 'violet' },
    { title: '在线设备', value: '126', unit: '/ 132 台', note: '在线率 95.5%', icon: <SafetyCertificateOutlined />, tone: 'green' },
  ];

  return (
    <div className="dashboard-page">
      <section className="welcome-panel">
        <div>
          <div className="welcome-eyebrow"><span className="status-dot" />运营数据实时汇总</div>
          <h1>下午好，{user?.displayName ?? '管理员'}</h1>
          <p>{dateText} · 这里是今日园区运营概况</p>
        </div>
        <div className="welcome-actions">
          <Button onClick={() => navigate('/report/overview')}>查看报表</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/card/person')}>新增人员</Button>
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <Card key={stat.title} className="stat-card" bordered={false}>
            <div className={`stat-icon ${stat.tone}`}>{stat.icon}</div>
            <div className="stat-content">
              <span>{stat.title}</span>
              <div className="stat-value">{stat.value}<small>{stat.unit}</small></div>
              <p><RiseOutlined />{stat.note}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="dashboard-grid primary-grid">
        <Card
          className="dashboard-card trend-card"
          title="消费交易趋势"
          extra={
            <div className="segmented-control">
              <button className={period === 'week' ? 'is-active' : ''} onClick={() => setPeriod('week')}>近 7 日</button>
              <button className={period === 'month' ? 'is-active' : ''} onClick={() => setPeriod('month')}>近 30 日</button>
            </div>
          }
        >
          <div className="trend-summary">
            <div><span>交易总额</span><strong>¥ 186,420.00</strong></div>
            <Tag color="success" icon={<RiseOutlined />}>12.6%</Tag>
          </div>
          <div className="bar-chart">
            <div className="chart-y-axis"><span>30k</span><span>20k</span><span>10k</span><span>0</span></div>
            <div className="chart-plot">
              <div className="chart-grid-lines"><i /><i /><i /><i /></div>
              <div className="chart-bars">
                {chartValues.map((value, index) => (
                  <div className="bar-column" key={`${period}-${index}`}>
                    <div className="bar-value" style={{ height: `${value}%` }}><span>¥ {(value * 0.32).toFixed(1)}k</span></div>
                    <small>{labels[index]}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="dashboard-card todo-card" title="我的待办" extra={<Button type="link" onClick={() => navigate('/visitor/approve')}>全部待办<ArrowRightOutlined /></Button>}>
          <div className="todo-list">
            {todos.map((item) => (
              <button key={item.title} className="todo-item" onClick={() => navigate(item.path)}>
                <span className={`todo-icon ${item.tone}`}><ClockCircleOutlined /></span>
                <span className="todo-copy"><strong>{item.title}</strong><small>{item.note}</small></span>
                <span className="todo-count">{item.count}</span>
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section className="dashboard-grid secondary-grid">
        <Card className="dashboard-card" title="快捷入口" extra={<span className="card-caption">常用业务一键直达</span>}>
          <div className="quick-links">
            {quickEntries.map((item) => (
              <button key={item.path} onClick={() => navigate(item.path)}>
                <span>{item.icon}</span>
                <strong>{item.label}</strong>
                <ArrowRightOutlined className="quick-arrow" />
              </button>
            ))}
          </div>
        </Card>

        <Card className="dashboard-card" title="设备运行状态" extra={<span className="live-label"><i />实时</span>}>
          <div className="device-overview">
            <div className="device-total"><strong>95.5<small>%</small></strong><span>整体在线率</span></div>
            <div className="device-types">
              {[
                { label: '消费终端', online: 48, total: 50 },
                { label: '门禁设备', online: 42, total: 44 },
                { label: '考勤设备', online: 36, total: 38 },
              ].map((device) => (
                <div key={device.label} className="device-row">
                  <div><span>{device.label}</span><strong>{device.online} / {device.total}</strong></div>
                  <Progress percent={(device.online / device.total) * 100} showInfo={false} strokeColor="#3568ed" trailColor="#edf1f7" />
                </div>
              ))}
            </div>
          </div>
          <div className="service-note"><CheckCircleFilled />硬件通讯服务与数据库连接正常</div>
        </Card>
      </section>

      <Card
        className="dashboard-card recent-card"
        title="最新消费流水"
        extra={<Button type="link" onClick={() => navigate('/consume/records')}>查看全部<ArrowRightOutlined /></Button>}
      >
        <Table columns={columns} dataSource={records} pagination={false} size="middle" scroll={{ x: 680 }} />
      </Card>
    </div>
  );
}
