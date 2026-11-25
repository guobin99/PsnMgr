import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Radio,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CloudUploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  RetweetOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import {
  commitImportJob,
  downloadImportTemplate,
  exportCardPersonData,
  fetchImportErrors,
  fetchImportJobs,
  previewImportJob,
  retryImportJob,
  uploadImportFile,
} from '@/services/card';
import type { CardImportErrorRow, CardImportJob, CardImportPreview } from '@/types/card';
import { formatDateTime, importStatusTag } from './shared';

const MODE_OPTIONS = [
  { value: 'CREATE', label: '新增（已存在则跳过）' },
  { value: 'UPDATE', label: '更新（不存在则新增）' },
  { value: 'OVERWRITE', label: '覆盖（空值也写入）' },
];

/** 人员导入导出：模板下载、上传解析、预演、提交、失败清单与导出 */
export default function ImportPage() {
  const { message } = App.useApp();
  const { has } = usePermission();

  const [jobs, setJobs] = useState<CardImportJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobType, setJobType] = useState<string>('PERSON');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [mode, setMode] = useState('CREATE');
  const [autoCreateDept, setAutoCreateDept] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [acting, setActing] = useState(false);

  const [preview, setPreview] = useState<CardImportPreview | null>(null);
  const [previewJob, setPreviewJob] = useState<CardImportJob | null>(null);

  const [errorJob, setErrorJob] = useState<CardImportJob | null>(null);
  const [errors, setErrors] = useState<CardImportErrorRow[]>([]);
  const [errorTotal, setErrorTotal] = useState(0);
  const [errorPage, setErrorPage] = useState(1);
  const [errorLoading, setErrorLoading] = useState(false);

  const [exportForm] = Form.useForm<{ keyword?: string; mask: boolean }>();

  const loadJobs = useCallback(() => {
    setLoading(true);
    fetchImportJobs({ jobType: jobType || undefined, page, pageSize })
      .then((result) => {
        setJobs(result.items);
        setTotal(result.total);
      })
      .catch((error: unknown) => {
        setJobs([]);
        setTotal(0);
        message.error(error instanceof Error ? error.message : '导入批次加载失败');
      })
      .finally(() => setLoading(false));
  }, [jobType, page, pageSize, message]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleTemplate = async () => {
    try {
      await downloadImportTemplate();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '模板下载失败');
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadImportFile(file, mode, autoCreateDept);
      message.success(`文件已解析，共 ${result.total} 行数据，请执行预演`);
      if (result.warning) message.warning(result.warning);
      setPage(1);
      loadJobs();
      setPreview(null);
      setPreviewJob({
        jobId: result.jobId,
        jobType: 'PERSON',
        fileName: file.name,
        mode: result.mode,
        status: 1,
        totalRows: result.total,
        successRows: 0,
        failRows: 0,
        skipRows: 0,
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handlePreview = async (job: CardImportJob) => {
    setActing(true);
    try {
      const result = await previewImportJob(job.jobId);
      setPreview(result);
      setPreviewJob(job);
      message.success(`预演完成：新增 ${result.createCount}，更新 ${result.updateCount}，跳过 ${result.skipCount}，错误 ${result.errorCount}`);
      loadJobs();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '预演失败');
    } finally {
      setActing(false);
    }
  };

  const handleCommit = async (job: CardImportJob) => {
    setActing(true);
    try {
      const result = await commitImportJob(job.jobId);
      if (result.failed > 0) {
        message.warning(`提交完成：成功 ${result.success} 行，失败 ${result.failed} 行`);
      } else {
        message.success(`提交完成：成功导入 ${result.success} 行`);
      }
      setPreview(null);
      setPreviewJob(null);
      loadJobs();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '提交失败');
    } finally {
      setActing(false);
    }
  };

  const loadErrors = (jobId: number, nextPage: number) => {
    setErrorLoading(true);
    fetchImportErrors(jobId, { page: nextPage, pageSize: 50 })
      .then((result) => {
        setErrors(result.items);
        setErrorTotal(result.total);
        setErrorPage(nextPage);
      })
      .catch(() => {
        setErrors([]);
        setErrorTotal(0);
      })
      .finally(() => setErrorLoading(false));
  };

  const handleRetry = async (job: CardImportJob) => {
    setActing(true);
    try {
      const result = await retryImportJob(job.jobId);
      message.success(`重试完成：成功 ${result.success} 行，失败 ${result.failed} 行`);
      loadJobs();
      if (errorJob && errorJob.jobId === job.jobId) {
        loadErrors(job.jobId, 1);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '重试失败');
    } finally {
      setActing(false);
    }
  };

  const openErrors = (job: CardImportJob) => {
    setErrorJob(job);
    loadErrors(job.jobId, 1);
  };

  const handleExport = async () => {
    const values = await exportForm.validateFields();
    try {
      await exportCardPersonData({
        keyword: values.keyword?.trim() || undefined,
        status: 'normal',
        mask: values.mask,
      });
      message.success('导出已开始，请稍候查看下载文件');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出失败');
    }
  };

  const jobColumns: ColumnsType<CardImportJob> = [
    { title: '批次号', dataIndex: 'jobId', key: 'jobId', width: 90 },
    {
      title: '类型',
      dataIndex: 'jobType',
      key: 'jobType',
      width: 90,
      render: (value: string | null) => (value === 'PHOTO' ? <Tag color="purple">照片</Tag> : <Tag color="blue">人员</Tag>),
    },
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 220,
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    { title: '模式', dataIndex: 'mode', key: 'mode', width: 110, render: (value: string | null) => value || '-' },
    { title: '状态', key: 'status', width: 100, render: (_, record) => importStatusTag(record.status) },
    {
      title: '行数（总/成功/失败/跳过）',
      key: 'rows',
      width: 210,
      render: (_, record) => (
        <span>
          {record.totalRows} / <span className="card-ok">{record.successRows}</span> /{' '}
          <span className="card-danger">{record.failRows}</span> / {record.skipRows}
        </span>
      ),
    },
    { title: '创建人', dataIndex: 'createUser', key: 'createUser', width: 110 },
    {
      title: '上传时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
      render: (value: string | null) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          {has('card:import:import') && record.status <= 2 && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              loading={acting}
              onClick={() => handlePreview(record)}
            >
              预演
            </Button>
          )}
          {has('card:import:import') && record.status === 2 && (
            <Button type="link" size="small" onClick={() => handleCommit(record)} loading={acting}>
              提交
            </Button>
          )}
          {has('card:import:view') && (record.failRows > 0 || record.status >= 5) && (
            <Button type="link" size="small" onClick={() => openErrors(record)}>
              失败清单
            </Button>
          )}
          {has('card:import:retry') && record.status >= 4 && record.failRows > 0 && (
            <Button
              type="link"
              size="small"
              icon={<RetweetOutlined />}
              loading={acting}
              onClick={() => handleRetry(record)}
            >
              重试失败行
            </Button>
          )}
          {has('card:import:view') && record.status === 1 && (
            <span className="card-muted">待预演</span>
          )}
        </Space>
      ),
    },
  ];

  const previewErrorColumns: ColumnsType<CardImportPreview['errors'][number]> = [
    { title: '行号', dataIndex: 'row', key: 'row', width: 80 },
    { title: '列', dataIndex: 'column', key: 'column', width: 100, render: (value?: string) => value || '-' },
    { title: '错误码', dataIndex: 'code', key: 'code', width: 100, render: (value?: string) => value || '-' },
    { title: '说明', dataIndex: 'message', key: 'message', render: (value?: string) => value || '-' },
  ];

  const errorColumns: ColumnsType<CardImportErrorRow> = [
    { title: '行号', dataIndex: 'rowNo', key: 'rowNo', width: 80 },
    { title: '人员编号', dataIndex: 'personNo', key: 'personNo', width: 120, render: (value: string | null) => value || '-' },
    { title: '姓名', dataIndex: 'personName', key: 'personName', width: 100, render: (value: string | null) => value || '-' },
    { title: '卡号', dataIndex: 'cardNo', key: 'cardNo', width: 120, render: (value: string | null) => value || '-' },
    { title: '动作', dataIndex: 'action', key: 'action', width: 90, render: (value: string | null) => value || '-' },
    { title: '错误码', dataIndex: 'errorCode', key: 'errorCode', width: 100, render: (value: string | null) => value || '-' },
    { title: '原因', dataIndex: 'errorMessage', key: 'errorMessage', render: (value: string | null) => value || '-' },
  ];

  return (
    <div className="system-workspace system-page-single">
      <Card size="small" className="filter-card" title="导入人员">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={handleTemplate}>
              下载导入模板
            </Button>
            <span className="card-muted">模板列：人员编号、姓名、部门编号、部门名称、卡号、人员类型、性别、出生日期、手机、身份证号、民族、职务、参加工作时间、备注</span>
          </Space>
          <Space wrap>
            <span>导入模式</span>
            <Radio.Group value={mode} onChange={(event) => setMode(event.target.value)} optionType="button" buttonStyle="solid">
              {MODE_OPTIONS.map((item) => (
                <Radio.Button key={item.value} value={item.value}>
                  {item.label}
                </Radio.Button>
              ))}
            </Radio.Group>
            <span className="card-inline-switch">
              部门不存在时自动创建
              <Switch size="small" checked={autoCreateDept} onChange={setAutoCreateDept} />
            </span>
          </Space>
          <Space wrap>
            {has('card:import:import') && (
              <Upload accept=".xlsx,.csv" showUploadList={false} beforeUpload={(file) => handleUpload(file as File)}>
                <Button type="primary" icon={<CloudUploadOutlined />} loading={uploading}>
                  选择文件并解析
                </Button>
              </Upload>
            )}
            <span className="card-muted">支持 xlsx、csv，单文件不超过 10MB，单次不超过 5 万行</span>
          </Space>
        </Space>
      </Card>

      {preview ? (
        <Card
          size="small"
          className="filter-card"
          title={`预演结果（批次 #${preview.jobId}）`}
          extra={
            <Space>
              <Button size="small" onClick={() => setPreview(null)}>
                收起
              </Button>
              {has('card:import:import') && preview.errorCount === 0 && previewJob && (
                <Button type="primary" size="small" loading={acting} onClick={() => handleCommit(previewJob)}>
                  确认提交
                </Button>
              )}
            </Space>
          }
        >
          <Descriptions size="small" column={5} bordered items={[
            { key: 'total', label: '总行数', children: preview.total },
            { key: 'create', label: '将新增', children: preview.createCount },
            { key: 'update', label: '将更新', children: preview.updateCount },
            { key: 'skip', label: '将跳过', children: preview.skipCount },
            { key: 'error', label: '校验不通过', children: preview.errorCount },
          ]} />
          {preview.errorCount > 0 ? (
            <>
              <Alert
                style={{ marginTop: 12 }}
                type="error"
                showIcon
                message={`存在 ${preview.errorCount} 行校验不通过，提交将被阻断。请修正文件后重新上传。`}
              />
              <Table
                rowKey={(record) => `${record.row}-${record.code ?? ''}`}
                style={{ marginTop: 12 }}
                size="small"
                columns={previewErrorColumns}
                dataSource={preview.errors}
                pagination={false}
              />
            </>
          ) : (
            <Alert style={{ marginTop: 12 }} type="success" showIcon message="校验全部通过，可以提交导入。" />
          )}
        </Card>
      ) : null}

      <Card
        size="small"
        style={{ marginBottom: 14 }}
        title="导入批次"
        extra={
          <Space>
            <Radio.Group
              size="small"
              value={jobType}
              onChange={(event) => {
                setPage(1);
                setJobType(event.target.value);
              }}
              options={[
                { label: '人员', value: 'PERSON' },
                { label: '照片', value: 'PHOTO' },
                { label: '全部', value: '' },
              ]}
              optionType="button"
            />
            <Button size="small" icon={<ReloadOutlined />} onClick={loadJobs}>
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="jobId"
          size="small"
          loading={loading}
          columns={jobColumns}
          dataSource={jobs}
          scroll={{ x: 1360 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (count) => `共 ${count} 个批次`,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            },
          }}
        />
      </Card>

      <Card size="small" className="filter-card" title="导出人员数据">
        <Form form={exportForm} layout="inline" initialValues={{ mask: true }}>
          <Form.Item name="keyword" label="关键字">
            <Input allowClear style={{ width: 220 }} placeholder="编号 / 姓名 / 卡号 / 手机" />
          </Form.Item>
          <Form.Item name="mask" label="敏感字段脱敏" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExport} disabled={!has('card:import:export')}>
              导出 xlsx
            </Button>
          </Form.Item>
        </Form>
        <p className="card-muted" style={{ marginTop: 8 }}>
          无「敏感字段查看」权限时，手机与身份证号按前六后四、前三后四脱敏导出。
        </p>
      </Card>

      <Modal
        title={errorJob ? `失败清单（批次 #${errorJob.jobId}）` : '失败清单'}
        open={Boolean(errorJob)}
        onCancel={() => setErrorJob(null)}
        width={900}
        footer={
          <Space>
            <Button onClick={() => setErrorJob(null)}>关闭</Button>
            {errorJob && has('card:import:retry') && (
              <Button type="primary" icon={<RetweetOutlined />} loading={acting} onClick={() => handleRetry(errorJob)}>
                重试失败行
              </Button>
            )}
          </Space>
        }
      >
        <Table
          rowKey="rowNo"
          size="small"
          loading={errorLoading}
          columns={errorColumns}
          dataSource={errors}
          pagination={{
            current: errorPage,
            pageSize: 50,
            total: errorTotal,
            showSizeChanger: false,
            showTotal: (count) => `共 ${count} 行失败`,
            onChange: (nextPage) => {
              if (errorJob) loadErrors(errorJob.jobId, nextPage);
            },
          }}
        />
      </Modal>
    </div>
  );
}
