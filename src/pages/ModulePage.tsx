import { useEffect, useState } from 'react';
import type { Key } from 'react';
import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { getModulePageMeta } from '@/config/menu';
import { usePermission } from '@/hooks/usePermission';
import NotFoundPage from '@/pages/NotFoundPage';

interface DemoRow {
  key: string;
  code: string;
  name: string;
  department: string;
  category: string;
  updatedAt: string;
  status: string;
  operator: string;
}

const demoRows: DemoRow[] = [
  { key: '1', code: 'BS202611020001', name: '陈晓', department: '研发中心', category: '正式人员', updatedAt: '2026-11-02 15:26', status: '正常', operator: '系统管理员' },
  { key: '2', code: 'BS202611020002', name: '王浩', department: '生产中心', category: '正式人员', updatedAt: '2026-11-02 14:18', status: '正常', operator: '张敏' },
  { key: '3', code: 'BS202611010026', name: '李静', department: '财务部', category: '管理人员', updatedAt: '2026-11-02 11:42', status: '待审核', operator: '系统管理员' },
  { key: '4', code: 'BS202611010019', name: '赵磊', department: '行政部', category: '正式人员', updatedAt: '2026-11-01 17:08', status: '正常', operator: '刘杰' },
  { key: '5', code: 'BS202611010012', name: '孙悦', department: '市场部', category: '外协人员', updatedAt: '2026-11-01 16:35', status: '已停用', operator: '张敏' },
];

export default function ModulePage() {
  const location = useLocation();
  const { message } = App.useApp();
  const { has } = usePermission();
  const meta = getModulePageMeta(location.pathname);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [rows, setRows] = useState(demoRows);

  useEffect(() => {
    setSelectedKeys([]);
    setRows(demoRows);
    form.resetFields();
  }, [location.pathname, form]);

  if (!meta) return <NotFoundPage />;

  /** 操作级权限：由页面查看权限派生，无权限时优先隐藏按钮而不是置灰 */
  const canOperate = has(meta.editPermission);

  const runQuery = (values?: { keyword?: string; status?: string }) => {
    setLoading(true);
    window.setTimeout(() => {
      const keyword = values?.keyword?.trim();
      const status = values?.status;
      setRows(demoRows.filter((row) => (!keyword || `${row.name}${row.code}${row.department}`.includes(keyword)) && (!status || row.status === status)));
      setLoading(false);
      message.success('查询条件已应用');
    }, 350);
  };

  const columns: ColumnsType<DemoRow> = [
    { title: '业务编号', dataIndex: 'code', width: 170, render: (value) => <span className="table-code">{value}</span> },
    { title: '姓名 / 名称', dataIndex: 'name', width: 130, render: (value) => <strong>{value}</strong> },
    { title: '所属部门', dataIndex: 'department', width: 140 },
    { title: '业务类别', dataIndex: 'category', width: 130 },
    { title: '更新时间', dataIndex: 'updatedAt', width: 175, sorter: (a, b) => a.updatedAt.localeCompare(b.updatedAt) },
    {
      title: '状态',
      dataIndex: 'status',
      width: 105,
      render: (value) => <Tag color={value === '正常' ? 'success' : value === '待审核' ? 'warning' : 'default'}>{value}</Tag>,
    },
    { title: '操作人', dataIndex: 'operator', width: 120, responsive: ['lg'] },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: () => (
        <Space size={2}>
          <Button type="link" size="small" onClick={() => message.info('已打开详情（演示）')}>查看</Button>
          {canOperate ? (
            <Button type="link" size="small" onClick={() => setModalOpen(true)}>编辑</Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const isExport = meta.primaryAction === '导出数据';

  return (
    <div className="module-page">
      <div className="page-heading">
        <div>
          <div className="page-domain">
            <span>{meta.domain}</span>
            {meta.group ? <span className="page-group">{meta.group}</span> : null}
            <Tag>页面原型</Tag>
            <Tag color="blue">{meta.permission}</Tag>
          </div>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
        {canOperate ? (
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={() => message.success('导出任务已创建（演示）')}>导出</Button>
            <Button
              type="primary"
              icon={isExport ? <DownloadOutlined /> : <PlusOutlined />}
              onClick={() => isExport ? message.success('导出任务已创建（演示）') : setModalOpen(true)}
            >
              {meta.primaryAction}
            </Button>
          </Space>
        ) : null}
      </div>

      <Card className="filter-card" bordered={false}>
        <Form form={form} layout="inline" onFinish={runQuery} className="filter-form">
          <Form.Item name="keyword" label="关键词">
            <Input allowClear placeholder={`搜索${meta.title}名称或编号`} prefix={<SearchOutlined />} />
          </Form.Item>
          <Form.Item name="department" label="所属部门">
            <Select
              allowClear
              placeholder="全部部门"
              style={{ width: 150 }}
              options={['研发中心', '生产中心', '财务部', '行政部', '市场部'].map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              allowClear
              placeholder="全部状态"
              style={{ width: 130 }}
              options={['正常', '待审核', '已停用'].map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="业务日期" className="date-filter">
            <DatePicker.RangePicker />
          </Form.Item>
          <Form.Item className="filter-actions">
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  form.resetFields();
                  runQuery();
                }}
              >重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card className="table-card" bordered={false}>
        <div className="table-toolbar">
          <div><h2>{meta.title}列表</h2><span>共 86 条记录</span></div>
          {canOperate && selectedKeys.length > 0 && (
            <div className="batch-actions">
              已选择 <strong>{selectedKeys.length}</strong> 项
              <Button size="small" onClick={() => message.success('批量操作已提交（演示）')}>批量处理</Button>
              <Button size="small" type="text" onClick={() => setSelectedKeys([])}>取消选择</Button>
            </div>
          )}
        </div>
        <Table
          rowKey="key"
          columns={columns}
          dataSource={rows}
          loading={loading}
          scroll={{ x: 1120 }}
          rowSelection={canOperate ? { selectedRowKeys: selectedKeys, onChange: setSelectedKeys } : undefined}
          pagination={{
            total: rows.length === demoRows.length ? 86 : rows.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={`${meta.title} · 基本信息`}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          initialValues={{ status: '正常', department: '研发中心' }}
          onFinish={() => {
            setModalOpen(false);
            message.success('信息已保存（演示）');
          }}
        >
          <Form.Item name="name" label="姓名 / 名称" rules={[{ required: true, message: '请输入姓名或名称' }]}>
            <Input placeholder="请输入姓名或业务名称" />
          </Form.Item>
          <Form.Item name="department" label="所属部门" rules={[{ required: true }]}>
            <Select options={['研发中心', '生产中心', '财务部', '行政部', '市场部'].map((value) => ({ value, label: value }))} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={['正常', '待审核', '已停用'].map((value) => ({ value, label: value }))} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" maxLength={200} showCount />
          </Form.Item>
          <Space className="modal-form-actions">
            <Button onClick={() => setModalOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit">保存</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
