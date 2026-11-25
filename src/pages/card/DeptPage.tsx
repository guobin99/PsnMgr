import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  TreeSelect,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import {
  createCardDept,
  exportCardDepts,
  fetchCardDept,
  fetchCardDeptPersons,
  fetchCardDeptTree,
  setCardDeptStatus,
  sortCardDepts,
  updateCardDept,
} from '@/services/card';
import type { CardDeptDetail, CardDeptNode, CardPersonBrief } from '@/types/card';
import { CardDeptSearchRow, CardDeptTreePanel, filterCardDeptNodes, formatDateTime, personStatusTag } from './shared';

interface DeptFormValues {
  DeptNo?: string;
  DeptName: string;
  ParentId?: number | null;
  Chief?: string;
  Duty?: string;
  SortNo?: number | null;
  DeptType?: string;
  Remark?: string;
}

/** 上级部门候选：标题带编号，避免同名部门误选 */
interface DeptOption {
  value: number;
  title: string;
  disabled: boolean;
  children: DeptOption[];
  isDel?: boolean | null;
}

function buildDeptOptions(nodes: CardDeptNode[]): DeptOption[] {
  const map = new Map<number, DeptOption>();
  nodes.forEach((node) => {
    map.set(node.deptId, {
      value: node.deptId,
      title: `${node.deptName ?? '未命名部门'}（${node.deptNo ?? '-'}）`,
      disabled: false,
      children: [],
      isDel: node.isDel,
    });
  });
  const roots: DeptOption[] = [];
  nodes.forEach((node) => {
    const current = map.get(node.deptId);
    if (!current) return;
    const parent = node.parentId != null ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(current);
    else roots.push(current);
  });
  // 停用部门及其整棵子树都不可作为上级，否则会建出挂在不显示部门下的孤儿节点
  const walk = (option: DeptOption, ancestorDisabled: boolean) => {
    option.disabled = ancestorDisabled || option.isDel === true;
    option.children.forEach((child) => walk(child, option.disabled));
  };
  roots.forEach((root) => walk(root, false));
  return roots;
}

/** 部门完整路径，形如「总部 / 生产部 / 一车间」 */
function deptPathOf(id: number | null | undefined, byId: Map<number, CardDeptNode>): string {
  if (id == null) return '';
  const names: string[] = [];
  const guard = new Set<number>();
  let cursor: number | null = id ?? null;
  while (cursor != null && byId.has(cursor) && !guard.has(cursor)) {
    guard.add(cursor);
    const node: CardDeptNode = byId.get(cursor)!;
    names.unshift(node.deptName ?? '未命名部门');
    cursor = node.parentId ?? null;
  }
  return names.join(' / ');
}

/** 部门档案：组织树 + 部门详情 + 人员清单，支持新增、修改、停用与同级排序 */
export default function DeptPage() {
  const { message } = App.useApp();
  const { has } = usePermission();

  const [nodes, setNodes] = useState<CardDeptNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [deptKeyword, setDeptKeyword] = useState('');
  // 默认隐藏已停用部门，需要时用搜索框右侧的眼睛按钮临时显示
  const [showDisabled, setShowDisabled] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CardDeptDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [persons, setPersons] = useState<CardPersonBrief[]>([]);
  const [personTotal, setPersonTotal] = useState(0);
  const [personLoading, setPersonLoading] = useState(false);
  const [includeChildren, setIncludeChildren] = useState(true);
  const [personPage, setPersonPage] = useState(1);
  const [personPageSize, setPersonPageSize] = useState(10);

  /** 停用部门默认隐藏，可在搜索框右侧临时打开 */
  const treeNodes = useMemo(
    () => (showDisabled ? nodes : nodes.filter((node) => node.isDel !== true)),
    [nodes, showDisabled],
  );
  const disabledCount = useMemo(() => nodes.filter((node) => node.isDel === true).length, [nodes]);
  const matchedDeptCount = useMemo(
    () => filterCardDeptNodes(treeNodes, deptKeyword).length,
    [treeNodes, deptKeyword],
  );

  // 停用部门被隐藏后，若当前选中的正是被隐藏的那个，自动切到第一个启用部门
  useEffect(() => {
    if (showDisabled || selectedId == null) return;
    const current = nodes.find((node) => node.deptId === selectedId);
    if (current?.isDel) {
      const first = nodes.find((node) => node.isDel !== true);
      setSelectedId(first ? first.deptId : null);
    }
  }, [showDisabled, nodes, selectedId]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'root' | 'child' | 'edit'>('root');
  const [editing, setEditing] = useState<CardDeptDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<DeptFormValues>();
  // 弹窗标题跟随表单里选中的上级，避免出现「新增下级部门：A」却挂到 B 下的错位
  const watchedParentId = Form.useWatch('ParentId', form) as number | null | undefined;

  const [exportOpen, setExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
  const [exporting, setExporting] = useState(false);

  const loadTree = useCallback(
    (keepSelection = true, focusId?: number) => {
      setLoading(true);
      fetchCardDeptTree(true)
        .then((rows) => {
          setNodes(rows);
          if (focusId != null) {
            // 新建后显式选中新部门，避免被「默认选中第一行」覆盖
            setSelectedId(focusId);
            return;
          }
          if (!keepSelection || selectedId == null) {
            const first = rows.find((row) => row.isDel !== true);
            if (first) setSelectedId(first.deptId);
          }
        })
        .catch(() => setNodes([]))
        .finally(() => setLoading(false));
    },
    [selectedId],
  );

  const loadDetail = useCallback((deptId: number) => {
    setDetailLoading(true);
    fetchCardDept(deptId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, []);

  const loadPersons = useCallback(() => {
    if (selectedId == null) {
      setPersons([]);
      setPersonTotal(0);
      return;
    }
    setPersonLoading(true);
    fetchCardDeptPersons(selectedId, {
      includeChildren,
      page: personPage,
      pageSize: personPageSize,
    })
      .then((result) => {
        setPersons(result.items);
        setPersonTotal(result.total);
      })
      .catch((error: unknown) => {
        setPersons([]);
        setPersonTotal(0);
        message.error(error instanceof Error ? error.message : '部门人员加载失败');
      })
      .finally(() => setPersonLoading(false));
  }, [selectedId, includeChildren, personPage, personPageSize, message]);

  useEffect(() => {
    loadTree(false);
    // 只在首次进入时自动选中首个部门
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 详情与人员列表分开取，避免翻页时重复请求详情
  useEffect(() => {
    if (selectedId != null) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  useEffect(() => {
    loadPersons();
  }, [loadPersons]);

  const deptOptions = useMemo(() => buildDeptOptions(nodes), [nodes]);
  const byId = useMemo(() => new Map(nodes.map((node) => [node.deptId, node])), [nodes]);

  const currentNode = selectedId != null ? byId.get(selectedId) ?? null : null;

  /** 新增下级入口的禁用原因 */
  const createChildBlocked = useMemo(() => {
    if (selectedId == null) return '请先在左侧选择部门';
    if (currentNode?.isDel) return '该部门已停用，不能新增下级';
    return '';
  }, [selectedId, currentNode]);

  /** 停用前置校验：与后端口径一致（未停用下级数、含下级在册人数） */
  const disableBlocked = useMemo(() => {
    if (!detail || detail.isDel) return '';
    if (detail.childCount > 0) return `仍有 ${detail.childCount} 个未停用下级部门，需先处理下级`;
    const active = detail.activeCount ?? 0;
    if (active > 0) return `含下级仍有 ${active} 名在册人员，需先调出人员`;
    return '';
  }, [detail]);

  /** 启用前置校验：上级停用时不允许单独启用 */
  const enableBlocked = useMemo(() => {
    if (!detail || !detail.isDel) return '';
    const parent = detail.parentId != null ? byId.get(detail.parentId) : undefined;
    return parent?.isDel ? '上级部门已停用，请先启用上级部门' : '';
  }, [detail, byId]);

  const openCreate = (parent: CardDeptNode | null) => {
    setEditing(null);
    setModalMode(parent ? 'child' : 'root');
    form.resetFields();
    form.setFieldsValue({ ParentId: parent?.deptId ?? null, SortNo: null });
    setModalOpen(true);
  };

  const openEdit = (record: CardDeptDetail) => {
    setEditing(record);
    setModalMode('edit');
    form.resetFields();
    form.setFieldsValue({
      DeptNo: record.deptNo ?? '',
      DeptName: record.deptName ?? '',
      ParentId: record.parentId ?? null,
      Chief: record.chief ?? '',
      Duty: record.duty ?? '',
      SortNo: record.sortNo ?? null,
      DeptType: record.deptType ?? '',
      Remark: record.remark ?? '',
    });
    setModalOpen(true);
  };

  /** 部门编号：留空由服务端生成；根部门 4 位，逐级两位（与现场存量 1001/100101 一致） */
  const validateDeptNo = (_: unknown, value?: string) => {
    const text = (value ?? '').trim();
    if (!text) return Promise.resolve();
    if (text.length < 4 || text.length % 2 !== 0 || text.length > 30 || !/^[0-9A-Za-z]+$/.test(text)) {
      return Promise.reject(new Error('编号最少 4 位、偶数长度（两位一级），仅限数字或字母'));
    }
    const parentId = form.getFieldValue('ParentId') as number | null | undefined;
    const parentNo = parentId != null ? (byId.get(parentId)?.deptNo ?? '') : '';
    if (parentNo) {
      if (!text.startsWith(parentNo)) {
        return Promise.reject(new Error(`必须以父部门编号 ${parentNo} 为前缀`));
      }
      if (text.length !== parentNo.length + 2) {
        return Promise.reject(new Error(`需比父部门编号多两位，即 ${parentNo.length + 2} 位`));
      }
    } else if (text.length !== 4) {
      return Promise.reject(new Error('根部门编号必须为 4 位，如 1001'));
    }
    return Promise.resolve();
  };

  const handleSave = async () => {
    let values: DeptFormValues;
    try {
      values = await form.validateFields();
    } catch {
      // 校验未通过，错误已标在对应字段上，不弹全局提示
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateCardDept(editing.deptId, {
          DeptName: values.DeptName.trim(),
          Chief: values.Chief?.trim(),
          Duty: values.Duty?.trim(),
          SortNo: values.SortNo ?? null,
          DeptType: values.DeptType?.trim(),
          // 扩展列已不在界面展示：编辑时回传原值，避免后端把它们置空
          AddCol1: editing.addCol1 ?? undefined,
          AddCol2: editing.addCol2 ?? undefined,
          Remark: values.Remark?.trim(),
        });
        message.success('部门已更新');
        setModalOpen(false);
        loadDetail(editing.deptId);
        loadTree(true);
      } else {
        const result = await createCardDept({
          DeptNo: values.DeptNo?.trim() || undefined,
          DeptName: values.DeptName.trim(),
          ParentId: values.ParentId ?? null,
          Chief: values.Chief?.trim(),
          Duty: values.Duty?.trim(),
          SortNo: values.SortNo ?? null,
          DeptType: values.DeptType?.trim(),
          Remark: values.Remark?.trim(),
        });
        message.success(`部门已创建，编号 ${result.deptNo}`);
        setModalOpen(false);
        setPersonPage(1);
        loadTree(true, result.deptId);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (disabled: boolean) => {
    if (selectedId == null) return;
    try {
      await setCardDeptStatus(selectedId, disabled);
      message.success(disabled ? '部门已停用' : '部门已启用');
      loadTree(true);
      loadDetail(selectedId);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败');
    }
  };

  const handleSort = async (direction: 'up' | 'down') => {
    if (selectedId == null) return;
    const current = byId.get(selectedId);
    if (!current) return;
    const siblings = nodes
      .filter((node) => (node.parentId ?? null) === (current.parentId ?? null))
      .sort(
        (a, b) =>
          (a.sortNo ?? 2147483647) - (b.sortNo ?? 2147483647) ||
          (a.deptNo ?? '').localeCompare(b.deptNo ?? ''),
      );
    const index = siblings.findIndex((node) => node.deptId === selectedId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
      message.info(direction === 'up' ? '已经是第一个部门' : '已经是最后一个部门');
      return;
    }

    const currentSort = siblings[index].sortNo ?? null;
    const targetSort = siblings[targetIndex].sortNo ?? null;
    let items: Array<{ DeptId: number; SortNo: number }>;
    if (currentSort != null && targetSort != null && currentSort !== targetSort) {
      // 只交换这两条，避免把手工维护的排序号整体重写成 10/20/30
      items = [
        { DeptId: siblings[index].deptId, SortNo: targetSort },
        { DeptId: siblings[targetIndex].deptId, SortNo: currentSort },
      ];
    } else {
      // 存在空排序号或两条同号时，按当前顺序补齐整组后交换位置
      const reordered = [...siblings];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      items = reordered.map((node, order) => ({ DeptId: node.deptId, SortNo: (order + 1) * 10 }));
    }

    try {
      await sortCardDepts(items);
      message.success('排序已保存');
      loadTree(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '排序失败');
    }
  };

  const handleExport = async () => {
    if (exportScope === 'current' && selectedId == null) {
      message.info('请先在左侧选择部门');
      return;
    }
    setExporting(true);
    try {
      await exportCardDepts({
        deptId: exportScope === 'current' ? selectedId : null,
        includeChildren: true,
        includeDisabled: true,
      });
      message.success('部门台账已导出');
      setExportOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const modalParent = watchedParentId != null ? byId.get(watchedParentId) : undefined;
  const modalTitle = editing
    ? `编辑部门：${editing.deptName ?? ''}`
    : modalParent
      ? `新增下级部门：${modalParent.deptName ?? ''}（${modalParent.deptNo ?? '-'}）`
      : '新增部门';

  const editParentPath = editing
    ? editing.parentId != null
      ? deptPathOf(editing.parentId, byId) || editing.parentName || '-'
      : '顶级部门'
    : '';

  const detailParentPath = detail
    ? detail.parentId != null
      ? deptPathOf(detail.parentId, byId) || detail.parentName || '-'
      : '顶级部门'
    : '-';

  const personColumns: ColumnsType<CardPersonBrief> = [
    { title: '人员编号', dataIndex: 'personNo', key: 'personNo', width: 110 },
    { title: '姓名', dataIndex: 'personName', key: 'personName', width: 100 },
    { title: '所属部门', dataIndex: 'deptName', key: 'deptName', width: 160 },
    {
      title: '人员类型',
      key: 'personType',
      width: 110,
      render: (_, record) => record.personTypeName ?? record.personType ?? '-',
    },
    {
      title: '卡号',
      dataIndex: 'cardNo',
      key: 'cardNo',
      width: 120,
      render: (value: string | null) => (value ? value : <span className="card-muted">未发卡</span>),
    },
    { title: '状态', key: 'status', width: 90, render: (_, record) => personStatusTag(record.isDel) },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 150,
      render: (value: string | null) => formatDateTime(value),
    },
  ];

  return (
    <div className="system-page">
      <aside>
        <Card
          size="small"
          className="system-context-card"
          title="组织结构"
          extra={
            <Button size="small" type="text" icon={<ReloadOutlined />} onClick={() => loadTree(true)}>
              刷新
            </Button>
          }
        >
          <CardDeptSearchRow
            keyword={deptKeyword}
            onKeywordChange={setDeptKeyword}
            showDisabled={showDisabled}
            disabledCount={disabledCount}
            onToggleDisabled={() => setShowDisabled((prev) => !prev)}
          />
          <CardDeptTreePanel
            nodes={treeNodes}
            loading={loading}
            selectedKey={selectedId}
            keyword={deptKeyword}
            onSelect={(value) => {
              setPersonPage(1);
              setSelectedId(value);
            }}
          />
          {has('card:dept:create') && (
            <div className="card-tree-footer card-tree-footer-actions">
              <Tooltip title={createChildBlocked || undefined}>
                <span>
                  <Button
                    size="small"
                    block
                    type="primary"
                    icon={<PlusOutlined />}
                    disabled={Boolean(createChildBlocked)}
                    onClick={() => openCreate(currentNode)}
                  >
                    新增下级部门
                  </Button>
                </span>
              </Tooltip>
              <Button size="small" block icon={<PlusOutlined />} onClick={() => openCreate(null)}>
                新增根部门
              </Button>
            </div>
          )}
          <p className="system-context-tip">
            {deptKeyword.trim()
              ? `匹配 ${matchedDeptCount} 个部门`
              : showDisabled && disabledCount > 0
                ? `共 ${treeNodes.length} 个部门（含 ${disabledCount} 个停用）`
                : `共 ${treeNodes.length} 个部门${disabledCount > 0 ? `，已隐藏 ${disabledCount} 个停用` : ''}`}
          </p>
        </Card>
      </aside>

      <section className="system-workspace">
        <Card
          className="filter-card"
          size="small"
          title={detail ? `${detail.deptName ?? ''}（${detail.deptNo ?? ''}）` : '部门详情'}
          extra={
            <Space wrap>
              {has('card:dept:update') && detail && (
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(detail)}>
                  编辑
                </Button>
              )}
              {has('card:dept:delete') && detail &&
                (detail.isDel ? (
                  <Tooltip title={enableBlocked || undefined}>
                    <span>
                      <Popconfirm
                        title="确认启用该部门？"
                        onConfirm={() => handleStatus(false)}
                        disabled={Boolean(enableBlocked)}
                      >
                        <Button size="small" disabled={Boolean(enableBlocked)}>
                          启用
                        </Button>
                      </Popconfirm>
                    </span>
                  </Tooltip>
                ) : (
                  <Tooltip title={disableBlocked || undefined}>
                    <span>
                      <Popconfirm
                        title="停用后不能再新增下级与人员，该部门授权记录也会被清理，确认停用？"
                        onConfirm={() => handleStatus(true)}
                        disabled={Boolean(disableBlocked)}
                      >
                        <Button size="small" danger disabled={Boolean(disableBlocked)}>
                          停用
                        </Button>
                      </Popconfirm>
                    </span>
                  </Tooltip>
                ))}
              {has('card:dept:update') && (
                <>
                  <Button size="small" icon={<ArrowUpOutlined />} onClick={() => handleSort('up')}>
                    上移
                  </Button>
                  <Button size="small" icon={<ArrowDownOutlined />} onClick={() => handleSort('down')}>
                    下移
                  </Button>
                </>
              )}
              {has('card:dept:export') && (
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    setExportScope('current');
                    setExportOpen(true);
                  }}
                >
                  导出
                </Button>
              )}
            </Space>
          }
        >
          {detail ? (
            <Descriptions size="small" column={3} bordered items={[
              { key: 'no', label: '部门编号', children: detail.deptNo ?? '-' },
              { key: 'name', label: '部门名称', children: detail.deptName ?? '-' },
              { key: 'parent', label: '上级部门', children: detailParentPath },
              { key: 'level', label: '层级', children: `${detail.level} 级` },
              { key: 'chief', label: '负责人', children: detail.chief || '-' },
              { key: 'tel', label: '联系电话', children: detail.telphone || '-' },
              { key: 'type', label: '部门类型', children: detail.deptType || '-' },
              { key: 'sort', label: '排序号', children: detail.sortNo ?? '-' },
              {
                key: 'status',
                label: '状态',
                children: detail.isDel ? <Tag color="default">已停用</Tag> : <Tag color="green">启用</Tag>,
              },
              { key: 'active', label: '含下级在册', children: `${detail.activeCount} 人` },
              { key: 'activeDirect', label: '本部门在册', children: `${detail.activeDirect} 人` },
              { key: 'child', label: '下级部门', children: `${detail.childCount} 个` },
              { key: 'deleted', label: '本部门已注销', children: `${detail.deletedCount} 人` },
              { key: 'duty', label: '部门职责', children: detail.duty || '-', span: 3 },
              { key: 'remark', label: '备注', children: detail.remark || '-', span: 3 },
            ]} />
          ) : (
            <span className="card-muted">{detailLoading ? '加载中…' : '请在左侧选择部门'}</span>
          )}
        </Card>

        <div className="system-toolbar">
          <span className="card-toolbar-label">部门人员</span>
          <span className="card-inline-switch">
            含下级部门
            <Switch
              size="small"
              checked={includeChildren}
              onChange={(checked) => {
                setPersonPage(1);
                setIncludeChildren(checked);
              }}
            />
          </span>
          <span style={{ flex: 1 }} />
          <Button icon={<ReloadOutlined />} onClick={loadPersons} disabled={selectedId == null}>
            刷新
          </Button>
        </div>

        <Table
          rowKey="personId"
          size="middle"
          loading={personLoading}
          columns={personColumns}
          dataSource={persons}
          pagination={{
            current: personPage,
            pageSize: personPageSize,
            total: personTotal,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (count) => `共 ${count} 人`,
            onChange: (nextPage, nextSize) => {
              setPersonPage(nextPage);
              setPersonPageSize(nextSize);
            },
          }}
        />
      </section>

      <Modal
        title={modalTitle}
        open={modalOpen}
        onOk={handleSave}
        confirmLoading={saving}
        onCancel={() => setModalOpen(false)}
        width={720}
        forceRender
        maskClosable={false}
        okText="保存"
        styles={{ body: { maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingRight: 8 } }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="上级部门"
                extra={
                  modalMode === 'edit'
                    ? '部门编号决定层级，暂不支持改上级'
                    : '默认带入左侧选中部门，可另选；不选则建为根部门'
                }
              >
                {modalMode === 'edit' ? (
                  <Input value={editParentPath} disabled />
                ) : (
                  <Form.Item name="ParentId" noStyle>
                    <TreeSelect
                      treeData={deptOptions}
                      treeDefaultExpandAll
                      allowClear
                      showSearch
                      treeNodeFilterProp="title"
                      placeholder="顶级部门（不选则建为根部门）"
                    />
                  </Form.Item>
                )}
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="DeptNo"
                label="部门编号"
                extra={modalMode === 'edit' ? '部门编号创建后不可修改' : '留空自动生成：根部门 4 位、下级逐级 +2'}
                rules={modalMode === 'edit' ? [] : [{ validator: validateDeptNo }]}
              >
                <Input maxLength={30} disabled={modalMode === 'edit'} placeholder="自动生成" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="DeptName"
                label="部门名称"
                rules={[
                  { required: true, whitespace: true, message: '请输入部门名称' },
                  { max: 30, message: '不超过 30 个字符' },
                ]}
              >
                <Input maxLength={30} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Chief" label="负责人" rules={[{ max: 20, message: '不超过 20 个字符' }]}>
                <Input maxLength={20} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="DeptType" label="部门类型" rules={[{ max: 20, message: '不超过 20 个字符' }]}>
                <Input maxLength={20} placeholder="如：行政、生产、教学" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="SortNo" label="排序号" extra="同级内由小到大排列，留空排在同级末尾">
                <InputNumber style={{ width: '100%' }} min={0} max={9999} precision={0} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="Duty"
                label="部门职责"
                extra="不超过 40 字（与数据库列宽一致）"
                rules={[{ max: 40, message: '不超过 40 个字符' }]}
              >
                <Input.TextArea rows={2} maxLength={40} showCount />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="Remark"
                label="备注"
                extra="不超过 50 字（与数据库列宽一致）"
                rules={[{ max: 50, message: '不超过 50 个字符' }]}
              >
                <Input.TextArea rows={2} maxLength={50} showCount />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
      <Modal
        title="导出部门台账"
        open={exportOpen}
        onOk={handleExport}
        confirmLoading={exporting}
        onCancel={() => setExportOpen(false)}
        width={480}
        destroyOnClose
        maskClosable={false}
        okText="导出"
      >
        <Radio.Group
          value={exportScope}
          onChange={(event) => setExportScope(event.target.value as 'current' | 'all')}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <Radio value="current" disabled={selectedId == null}>
            当前部门及其下级
            <span className="card-muted">
              （{detail ? `${detail.deptName ?? ''}（${detail.deptNo ?? ''}）` : '请先在左侧选择部门'}）
            </span>
          </Radio>
          <Radio value="all">全部可见部门</Radio>
        </Radio.Group>
        <p className="system-context-tip" style={{ marginTop: 12, marginBottom: 0 }}>
          导出台账包含部门编号、名称、上级部门、层级、负责人、联系电话、部门类型、在册人数、已注销人数、
          下级部门数、状态与备注。含停用部门。
        </p>
      </Modal>
    </div>
  );
}
