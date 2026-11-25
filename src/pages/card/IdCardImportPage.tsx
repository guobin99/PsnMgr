import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Empty,
  Input,
  Result,
  Space,
  Table,
  Tabs,
  Tag,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { InboxOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import {
  deleteIdCard,
  fetchIdCardDuplicates,
  fetchIdCardJobs,
  fetchIdCards,
  importIdCards,
  parseIdCardFile,
} from '@/services/cardAccount';
import type {
  CardIdCardRow,
  CardIdDuplicateRow,
  CardIdJobRow,
  CardIdParseResult,
  CardIdPreviewRow,
} from '@/types/cardAccount';
import { formatDateTime } from './shared';

/**
 * 导入授权 ID 卡：完全沿用 CS 的 uCardImpExp 文件规则。
 * 文件名前四位必须为 CARD、首行为授权密钥、密钥写 ST_SysParam(ST.ID.Import)；批次追溯落 BS_ImportJob。
 */
export default function IdCardImportPage() {
  const { message, modal } = App.useApp();
  const { has } = usePermission();

  const [tab, setTab] = useState<'import' | 'cards' | 'jobs' | 'duplicates'>('import');
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<CardIdParseResult | null>(null);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [importing, setImporting] = useState(false);

  const [cards, setCards] = useState<CardIdCardRow[]>([]);
  const [cardTotal, setCardTotal] = useState(0);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardKeyword, setCardKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [jobs, setJobs] = useState<CardIdJobRow[]>([]);
  const [jobTotal, setJobTotal] = useState(0);
  const [jobLoading, setJobLoading] = useState(false);

  const [duplicates, setDuplicates] = useState<CardIdDuplicateRow[]>([]);
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  const loadCards = useCallback(() => {
    setCardLoading(true);
    fetchIdCards({ keyword: cardKeyword.trim() || undefined, page, pageSize })
      .then((result) => {
        setCards(result.items);
        setCardTotal(result.total);
      })
      .catch((error) => {
        setCards([]);
        setCardTotal(0);
        message.error(error instanceof Error ? error.message : '读取授权卡失败');
      })
      .finally(() => setCardLoading(false));
  }, [cardKeyword, page, pageSize, message]);

  const loadJobs = useCallback(() => {
    setJobLoading(true);
    fetchIdCardJobs({ page: 1, pageSize: 50 })
      .then((result) => {
        setJobs(result.items);
        setJobTotal(result.total);
      })
      .catch((error) => {
        setJobs([]);
        setJobTotal(0);
        message.error(error instanceof Error ? error.message : '读取导入批次失败');
      })
      .finally(() => setJobLoading(false));
  }, [message]);

  const loadDuplicates = useCallback(() => {
    setDuplicateLoading(true);
    fetchIdCardDuplicates(200)
      .then((result) => setDuplicates(result.items))
      .catch((error) => {
        setDuplicates([]);
        message.error(error instanceof Error ? error.message : '重复检测失败');
      })
      .finally(() => setDuplicateLoading(false));
  }, [message]);

  useEffect(() => {
    if (tab === 'cards') loadCards();
  }, [tab, loadCards]);

  useEffect(() => {
    if (tab === 'jobs') loadJobs();
  }, [tab, loadJobs]);

  useEffect(() => {
    if (tab === 'duplicates') loadDuplicates();
  }, [tab, loadDuplicates]);

  const handleParse = async (file: File) => {
    setParsing(true);
    setParseResult(null);
    setConfirmDuplicate(false);
    try {
      const result = await parseIdCardFile(file);
      setParseResult(result);
      if (result.keyState === 'MISMATCH') {
        message.warning('文件首行密钥与系统密钥不一致，该文件将被整份跳过');
      } else {
        message.success(`解析完成，共 ${result.totalRows} 行`);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '解析失败');
    } finally {
      setParsing(false);
    }
    return false;
  };

  const handleImport = async () => {
    if (!parseResult) return;
    if (parseResult.requireDuplicateConfirm && !confirmDuplicate) {
      message.warning('该文件 24 小时内已导入过，请勾选「确认重复导入」');
      return;
    }
    setImporting(true);
    try {
      const result = await importIdCards({
        ParseToken: parseResult.parseToken,
        ConfirmDuplicate: confirmDuplicate,
        RequireDuplicateConfirm: parseResult.requireDuplicateConfirm,
      });
      modal.success({
        title: '导入完成',
        content: `成功 ${result.success} 条，重复 ${result.duplicate} 条，失败 ${result.failed} 条，批次 ${result.shortCode}`,
      });
      setParseResult(null);
      setConfirmDuplicate(false);
      if (tab === 'cards') loadCards();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = (record: CardIdCardRow) => {
    modal.confirm({
      title: `确认删除授权卡 ${record.cardNo}？`,
      content: '已被人员使用的卡号不允许删除授权。',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteIdCard(record.idKey, '后台删除授权卡');
          message.success('授权卡已删除');
          loadCards();
        } catch (error) {
          message.error(error instanceof Error ? error.message : '删除失败');
        }
      },
    });
  };

  const previewColumns: ColumnsType<CardIdPreviewRow> = [
    { title: '行号', dataIndex: 'rowNo', key: 'rowNo', width: 80 },
    { title: '卡号', dataIndex: 'cardNo', key: 'cardNo' },
    {
      title: '解析结果',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: number) =>
        value === 0 ? <Tag color="green">待导入</Tag> : value === 3 ? <Tag color="gold">重复</Tag> : <Tag color="red">格式错误</Tag>,
    },
    { title: '说明', dataIndex: 'message', key: 'message', render: (value: string | null) => value || '-' },
  ];

  const cardColumns: ColumnsType<CardIdCardRow> = [
    { title: '卡号', dataIndex: 'cardNo', key: 'cardNo' },
    { title: '批次', dataIndex: 'batchCode', key: 'batchCode', width: 110, render: (value: string | null) => value || '-' },
    { title: '批次号', dataIndex: 'jobId', key: 'jobId', width: 110, render: (value: number | null) => value ?? '-' },
    {
      title: '人员使用',
      dataIndex: 'usedCount',
      key: 'usedCount',
      width: 110,
      render: (value: number) => (value > 0 ? <Tag color="blue">{value} 人</Tag> : <span className="card-muted">未使用</span>),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) =>
        has('card:cardImport:delete') ? (
          <Button type="link" size="small" danger disabled={record.usedCount > 0} onClick={() => handleDelete(record)}>
            删除
          </Button>
        ) : null,
    },
  ];

  const jobColumns: ColumnsType<CardIdJobRow> = [
    { title: '批次号', dataIndex: 'jobId', key: 'jobId', width: 100 },
    { title: '文件名', dataIndex: 'fileName', key: 'fileName', render: (value: string | null) => value || '-' },
    { title: '密钥状态', dataIndex: 'keyStateText', key: 'keyStateText', width: 170, render: (value: string | null) => value || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value: number, record) => {
        const text = record.statusText ?? '-';
        const color = value === 2 ? 'green' : value === 3 ? 'red' : value === 0 ? 'gold' : 'default';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    { title: '总行数', dataIndex: 'totalRows', key: 'totalRows', width: 90, align: 'right' },
    { title: '成功', dataIndex: 'successRows', key: 'successRows', width: 80, align: 'right' },
    { title: '失败', dataIndex: 'failRows', key: 'failRows', width: 80, align: 'right' },
    { title: '跳过', dataIndex: 'skipRows', key: 'skipRows', width: 80, align: 'right' },
    { title: '操作员', dataIndex: 'createUser', key: 'createUser', width: 100, render: (value: string | null) => value || '-' },
    { title: '上传时间', dataIndex: 'createTime', key: 'createTime', width: 150, render: (value: string | null) => formatDateTime(value) },
    { title: '完成时间', dataIndex: 'finishTime', key: 'finishTime', width: 150, render: (value: string | null) => formatDateTime(value) },
  ];

  const duplicateColumns: ColumnsType<CardIdDuplicateRow> = [
    { title: '卡号', dataIndex: 'cardNo', key: 'cardNo' },
    { title: '重复次数', dataIndex: 'duplicateCount', key: 'duplicateCount', width: 120, align: 'right', render: (value: number) => <Tag color="red">{value}</Tag> },
    { title: '最早记录 ID', dataIndex: 'minIdKey', key: 'minIdKey', width: 130 },
  ];

  return (
    <div className="system-page system-page-single">
      <section className="system-workspace">
        <Tabs
          activeKey={tab}
          onChange={(key) => setTab(key as 'import' | 'cards' | 'jobs' | 'duplicates')}
          items={[
            {
              key: 'import',
              label: '导入授权卡',
              children: (
                <>
                  <Alert
                    style={{ marginBottom: 12 }}
                    type="info"
                    showIcon
                    message="文件规则与 CS 完全一致"
                    description="文件名前四位必须为 CARD（不区分大小写），第 1 行为授权密钥，之后每行一个卡号。系统读取 UTF-8 / GBK 文本，密钥不匹配时整份文件跳过。"
                  />
                  {has('card:cardImport:import') ? (
                    <Upload.Dragger
                      accept=".txt,.csv,.dat"
                      multiple={false}
                      showUploadList={false}
                      disabled={parsing}
                      beforeUpload={(file) => handleParse(file as File)}
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">{parsing ? '正在解析…' : '点击或拖拽文件到此处上传'}</p>
                      <p className="ant-upload-hint">单文件不超过 10MB，文件名例如 CARD001.txt</p>
                    </Upload.Dragger>
                  ) : (
                    <Empty description="当前账号没有导入权限" />
                  )}

                  {parseResult ? (
                    <Card
                      style={{ marginTop: 16 }}
                      size="small"
                      title="解析结果"
                      extra={
                        <Space>
                          <Button onClick={() => setParseResult(null)}>重新上传</Button>
                          {has('card:cardImport:import') ? (
                            <Button
                              type="primary"
                              loading={importing}
                              disabled={parseResult.keyState === 'MISMATCH'}
                              onClick={handleImport}
                            >
                              确认导入
                            </Button>
                          ) : null}
                        </Space>
                      }
                    >
                      {parseResult.keyState === 'MISMATCH' ? (
                        <Alert
                          style={{ marginBottom: 12 }}
                          type="error"
                          showIcon
                          message="密钥不匹配，整份文件将被跳过"
                          description={parseResult.keyHint ?? undefined}
                        />
                      ) : parseResult.keyState === 'NEW' ? (
                        <Alert
                          style={{ marginBottom: 12 }}
                          type="warning"
                          showIcon
                          message="首次导入：文件首行密钥将写入 ST_SysParam(ST.ID.Import)"
                        />
                      ) : (
                        <Alert style={{ marginBottom: 12 }} type="success" showIcon message="密钥与系统一致" />
                      )}

                      {parseResult.duplicateFile ? (
                        <Alert
                          style={{ marginBottom: 12 }}
                          type="warning"
                          showIcon
                          message={`该文件在 24 小时内已上传过（批次 ${parseResult.duplicateFile.jobId}，${formatDateTime(
                            parseResult.duplicateFile.createTime,
                          )}）`}
                        />
                      ) : null}

                      <Descriptions size="small" bordered column={3}>
                        <Descriptions.Item label="文件名">{parseResult.fileName}</Descriptions.Item>
                        <Descriptions.Item label="总行数">{parseResult.totalRows}</Descriptions.Item>
                        <Descriptions.Item label="批次短码">{parseResult.shortCode}</Descriptions.Item>
                        <Descriptions.Item label="重复卡号">{parseResult.duplicateRows}</Descriptions.Item>
                        <Descriptions.Item label="格式错误">{parseResult.errorRows}</Descriptions.Item>
                        <Descriptions.Item label="批次号">{parseResult.jobId}</Descriptions.Item>
                      </Descriptions>

                      {parseResult.requireDuplicateConfirm ? (
                        <Checkbox
                          style={{ marginTop: 12 }}
                          checked={confirmDuplicate}
                          onChange={(event) => setConfirmDuplicate(event.target.checked)}
                        >
                          我确认该文件为重复导入，允许继续
                        </Checkbox>
                      ) : null}

                      <Table
                        style={{ marginTop: 12 }}
                        rowKey="rowNo"
                        size="small"
                        columns={previewColumns}
                        dataSource={parseResult.preview}
                        pagination={false}
                        scroll={{ y: 260 }}
                      />
                    </Card>
                  ) : null}
                </>
              ),
            },
            {
              key: 'cards',
              label: '授权卡列表',
              children: (
                <>
                  <div className="system-toolbar">
                    <Input
                      allowClear
                      prefix={<SearchOutlined />}
                      style={{ width: 240 }}
                      placeholder="搜索卡号"
                      value={cardKeyword}
                      onChange={(event) => {
                        setPage(1);
                        setCardKeyword(event.target.value);
                      }}
                    />
                    <Button icon={<ReloadOutlined />} onClick={loadCards}>
                      刷新
                    </Button>
                  </div>
                  <Table
                    rowKey="idKey"
                    size="small"
                    loading={cardLoading}
                    columns={cardColumns}
                    dataSource={cards}
                    pagination={{
                      current: page,
                      pageSize,
                      total: cardTotal,
                      showSizeChanger: true,
                      pageSizeOptions: [20, 50, 100],
                      showTotal: (count) => `共 ${count} 张授权卡`,
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
              key: 'jobs',
              label: '导入批次',
              children: (
                <>
                  <div className="system-toolbar">
                    <Button icon={<ReloadOutlined />} onClick={loadJobs}>
                      刷新
                    </Button>
                    <span className="card-muted">共 {jobTotal} 个批次</span>
                  </div>
                  <Table
                    rowKey="jobId"
                    size="small"
                    loading={jobLoading}
                    columns={jobColumns}
                    dataSource={jobs}
                    scroll={{ x: 1300 }}
                    pagination={false}
                  />
                </>
              ),
            },
            {
              key: 'duplicates',
              label: '重复卡号检测',
              children: (
                <>
                  <div className="system-toolbar">
                    <Button icon={<ReloadOutlined />} onClick={loadDuplicates} loading={duplicateLoading}>
                      重新检测
                    </Button>
                    <span className="card-muted">ST_EnCard 无唯一约束，历史数据可能存在重复卡号</span>
                  </div>
                  {duplicates.length === 0 && !duplicateLoading ? (
                    <Result status="success" title="未发现重复卡号" subTitle="授权卡表中每个卡号都只有一条记录" />
                  ) : (
                    <Table
                      rowKey="minIdKey"
                      size="small"
                      loading={duplicateLoading}
                      columns={duplicateColumns}
                      dataSource={duplicates}
                      pagination={{ pageSize: 50, showSizeChanger: false }}
                    />
                  )}
                </>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
