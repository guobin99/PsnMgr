import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import {
  createCardCodeItem,
  deleteCardCodeItem,
  exportCardCodeItems,
  fetchCardCodeItems,
  fetchCardCodeTables,
  importCardCodeItems,
  updateCardCodeItem,
} from '@/services/card';
import type { CardCodeItem, CardCodeTable } from '@/types/card';

interface CodeFormValues {
  DictId?: string;
  DictValue: string;
  Remark?: string;
}

/** 编码管理：左侧编码表清单 + 右侧编码明细，支持增删改与导入导出 */
export default function CodePage() {
  const { message, modal } = App.useApp();
  const { has } = usePermission();

  const [tables, setTables] = useState<CardCodeTable[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<string>('');
  const [hint, setHint] = useState<string | null>(null);
  const [tableKeyword, setTableKeyword] = useState('');

  const [items, setItems] = useState<CardCodeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [refSupported, setRefSupported] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CardCodeItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form] = Form.useForm<CodeFormValues>();

  const loadTables = useCallback(() => {
    setTableLoading(true);
    fetchCardCodeTables(false)
      .then((result) => {
        setTables(result.items);
        setHint(result.hint ?? null);
        if (!activeTable && result.items.length > 0) setActiveTable(result.items[0].tableName);
      })
      .catch(() => {
        setTables([]);
        setHint(null);
      })
      .finally(() => setTableLoading(false));
  }, [activeTable]);

  const loadItems = useCallback(() => {
    if (!activeTable) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    fetchCardCodeItems({ tableName: activeTable, keyword: keyword || undefined, page, pageSize })
      .then((result) => {
        setItems(result.items);
        setTotal(result.total);
        setRefSupported(result.refSupported);
      })
      .catch((error) => {
        setItems([]);
        setTotal(0);
        message.error(error instanceof Error ? error.message : '读取编码失败');
      })
      .finally(() => setLoading(false));
  }, [activeTable, keyword, page, pageSize, message]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const activeTableName = tables.find((item) => item.tableName === activeTable)?.tableChsName ?? activeTable;
  const keywordLower = tableKeyword.trim().toLowerCase();
  const visibleTables = tables.filter(
    (item) =>
      !keywordLower ||
      item.tableName.toLowerCase().includes(keywordLower) ||
      (item.tableChsName ?? '').toLowerCase().includes(keywordLower),
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: CardCodeItem) => {
    setEditing(record);
    form.resetFields();
    form.setFieldsValue({
      DictId: record.dictId ?? '',
      DictValue: record.dictValue ?? '',
      Remark: record.remark ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        TableName: activeTable,
        DictId: values.DictId?.trim() || undefined,
        DictValue: values.DictValue.trim(),
        Remark: values.Remark?.trim(),
      };
      if (editing) {
        await updateCardCodeItem(editing.id, payload);
        message.success('编码已更新');
      } else {
        await createCardCodeItem(payload);
        message.success('编码已新增');
      }
      setModalOpen(false);
      loadItems();
      loadTables();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record: CardCodeItem) => {
    const run = async (confirm: boolean) => {
      try {
        const result = await deleteCardCodeItem(record.id, confirm);
        message.success(result.affectedPersons > 0 ? `编码已删除，影响 ${result.affectedPersons} 名人员` : '编码已删除');
        loadItems();
        loadTables();
      } catch (error) {
        const text = error instanceof Error ? error.message : '删除失败';
        // 已被人员引用时后端返回 40902，二次确认后带 confirm 重试
        if (text.includes('是否继续')) {
          modal.confirm({
            title: '编码已被引用',
            content: text,
            okText: '继续删除',
            okButtonProps: { danger: true },
            onOk: () => run(true),
          });
          return;
        }
        message.error(text);
      }
    };
    modal.confirm({
      title: `确认删除编码「${record.dictValue ?? record.dictId}」？`,
      okButtonProps: { danger: true },
      onOk: () => run(false),
    });
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const result = await importCardCodeItems(file, activeTable);
      Modal.success({
        title: '导入完成',
        content: `新增 ${result.created} 条，更新 ${result.updated} 条，失败 ${result.fail} 条。${
          result.errors.length > 0 ? `首个错误：第 ${result.errors[0].row} 行 ${result.errors[0].message}` : ''
        }`,
      });
      loadItems();
      loadTables();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导入失败');
    } finally {
      setImporting(false);
    }
    return false;
  };

  const handleExport = async () => {
    try {
      await exportCardCodeItems(activeTable);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出失败');
    }
  };

  const columns: ColumnsType<CardCodeItem> = [
    { title: '编码', dataIndex: 'dictId', key: 'dictId', width: 140 },
    { title: '名称', dataIndex: 'dictValue', key: 'dictValue', width: 200 },
    {
      title: '系统列',
      dataIndex: 'sysCol',
      key: 'sysCol',
      width: 100,
      render: (value: boolean | null) => (value ? <Tag color="blue">系统内置</Tag> : <Tag>自定义</Tag>),
    },
    {
      title: refSupported ? '被人员引用' : '说明',
      key: 'refCount',
      width: 130,
      render: (_, record) =>
        refSupported ? (
          record.refCount > 0 ? (
            <Tag color="gold">{record.refCount} 人</Tag>
          ) : (
            <span className="card-muted">未使用</span>
          )
        ) : (
          <span className="card-muted">该表不参与人员字段</span>
        ),
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: (value: string | null) => value || '-' },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          {has('card:code:update') && (
            <Button type="link" size="small" onClick={() => openEdit(record)}>
              编辑
            </Button>
          )}
          {has('card:code:delete') && (
            <Button type="link" size="small" danger disabled={record.sysCol === true} onClick={() => handleDelete(record)}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="system-page">
      <aside>
        <Card size="small" className="system-context-card" title="编码表">
          <Input.Search
            allowClear
            placeholder="搜索编码表"
            style={{ marginBottom: 8 }}
            value={tableKeyword}
            onChange={(event) => setTableKeyword(event.target.value)}
          />
          <div className="system-context-list">
            <Spin spinning={tableLoading}>
              {visibleTables.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无编码表" />
              ) : (
                visibleTables.map((item) => (
                  <button
                    key={item.tableName}
                    type="button"
                    className={`system-context-item${item.tableName === activeTable ? ' is-active' : ''}`}
                    onClick={() => {
                      setPage(1);
                      setKeyword('');
                      setActiveTable(item.tableName);
                    }}
                  >
                    <strong>{item.tableChsName || item.tableName}</strong>
                    <span>
                      {item.tableName} · {item.itemCount} 项
                    </span>
                  </button>
                ))
              )}
            </Spin>
          </div>
          {hint ? <Alert style={{ marginTop: 12 }} type="info" showIcon message={hint} /> : null}
          <p className="system-context-tip">编码写 ST_Dictionary，CS 端同步生效</p>
        </Card>
      </aside>

      <section className="system-workspace">
        <div className="system-toolbar">
          <span className="card-toolbar-label">{activeTableName || '请选择编码表'}</span>
          <Input.Search
            allowClear
            placeholder="搜索编码 / 名称"
            style={{ width: 240 }}
            value={keyword}
            onChange={(event) => {
              setPage(1);
              setKeyword(event.target.value);
            }}
          />
          <Space wrap>
            {has('card:code:create') && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!activeTable}>
                新增编码
              </Button>
            )}
            {has('card:code:create') && (
              <Upload
                accept=".xlsx,.csv"
                showUploadList={false}
                beforeUpload={(file) => handleImport(file as File)}
                disabled={!activeTable}
              >
                <Button icon={<UploadOutlined />} loading={importing} disabled={!activeTable}>
                  导入
                </Button>
              </Upload>
            )}
            {has('card:code:view') && (
              <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={!activeTable}>
                导出
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={loadItems} disabled={!activeTable}>
              刷新
            </Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          columns={columns}
          dataSource={items}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100, 200],
            showTotal: (count) => `共 ${count} 条编码`,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            },
          }}
        />
      </section>

      <Modal
        title={editing ? '编辑编码' : '新增编码'}
        open={modalOpen}
        onOk={handleSave}
        confirmLoading={saving}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        okText="保存"
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="DictId" label="编码" extra="留空则按同表最大整数加一自动生成">
            <Input maxLength={20} placeholder="自动生成" disabled={Boolean(editing)} />
          </Form.Item>
          <Form.Item
            name="DictValue"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }, { max: 40, message: '不超过 40 个字符' }]}
          >
            <Input maxLength={40} />
          </Form.Item>
          <Form.Item name="Remark" label="备注">
            <Input.TextArea rows={2} maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
