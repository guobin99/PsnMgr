import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  AutoComplete,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  TreeSelect,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { usePermission } from '@/hooks/usePermission';
import { fetchSubsystems } from '@/services/system';
import type { Subsystem } from '@/types/system';
import {
  createCardPerson,
  deleteCardPerson,
  exportCardPersons,
  fetchCardCodeItems,
  fetchCardDeptTree,
  fetchCardPerson,
  fetchCardPersons,
  fetchCardPersonTypes,
  fetchNextPersonNo,
  moveCardPersons,
  restoreCardPerson,
  updateCardPerson,
} from '@/services/card';
import type { CardDeptNode, CardPerson, CardPersonSavePayload, CardPersonSortBy } from '@/types/card';
import {
  CardDeptSearchRow,
  CardDeptTreePanel,
  FaceThumb,
  filterCardDeptNodes,
  formatDateTime,
  personStatusTag,
  sexCode,
  sexText,
} from './shared';

interface PersonFormValues {
  PersonNo?: string;
  PersonName: string;
  DeptId: number;
  PersonType?: string;
  Sex?: '1' | '2';
  Birthday?: Dayjs | null;
  IdNumber?: string;
  Mobile?: string;
  Nationality?: string;
  Duty?: string;
  Title?: string;
  CertName?: string;
  CertCode?: string;
  IsMarry?: boolean;
  NativePlace?: string;
  Address?: string;
  Residence?: string;
  OnWorkDate?: Dayjs | null;
  OffWorkDate?: Dayjs | null;
  Remark?: string;
  Systems?: string[];
}

interface CodeOption {
  value: string;
  label: string;
}

/** 部门扁平表转 TreeSelect */
function buildDeptOptions(nodes: CardDeptNode[]) {
  const map = new Map<
    number,
    { value: number; title: string; deptNo?: string; disabled: boolean; children: unknown[] }
  >();
  nodes.forEach((node) => {
    map.set(node.deptId, {
      value: node.deptId,
      title: node.deptName ?? '未命名部门',
      deptNo: node.deptNo ?? undefined,
      disabled: node.isDel === true,
      children: [],
    });
  });
  const roots: unknown[] = [];
  nodes.forEach((node) => {
    const current = map.get(node.deptId);
    if (!current) return;
    const parent = node.parentId != null ? map.get(node.parentId) : undefined;
    if (parent) (parent.children as unknown[]).push(current);
    else roots.push(current);
  });
  return roots as Array<{
    value: number;
    title: string;
    deptNo?: string;
    disabled: boolean;
    children: unknown[];
  }>;
}

/** 部门下拉搜索：按部门名称或部门编号模糊匹配（不区分大小写）。 */
function matchDeptOption(input: string, node: unknown) {
  const keyword = input.trim().toLowerCase();
  if (!keyword) return false;
  const item = node as { title?: unknown; deptNo?: string | null };
  const name = typeof item.title === 'string' ? item.title : '';
  return name.toLowerCase().includes(keyword) || (item.deptNo ?? '').toLowerCase().includes(keyword);
}

/** 人员档案：左侧组织树 + 右侧人员列表，支持新增、修改、调动、注销与导出 */
export default function PersonPage() {
  const { message, modal } = App.useApp();
  const { has } = usePermission();

  const [deptNodes, setDeptNodes] = useState<CardDeptNode[]>([]);
  const [deptKeyword, setDeptKeyword] = useState('');
  // 与部门档案保持一致：默认隐藏已停用部门，需要时用搜索框右侧的眼睛按钮临时显示
  const [showDisabled, setShowDisabled] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptId, setDeptId] = useState<number | undefined>();
  const [includeChildren, setIncludeChildren] = useState(true);

  const [rows, setRows] = useState<CardPerson[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'normal' | 'deleted' | 'all'>('normal');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'has' | 'none'>('all');
  const [personType, setPersonType] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<CardPersonSortBy>('dept');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 人员类型按 ST_Person 中已存在的取值给出建议，仍允许自由输入
  const [personTypes, setPersonTypes] = useState<string[]>([]);
  const [nationalities, setNationalities] = useState<CodeOption[]>([]);
  const [duties, setDuties] = useState<CodeOption[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CardPerson | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<PersonFormValues>();

  const loadDeptTree = useCallback(() => {
    setDeptLoading(true);
    fetchCardDeptTree(true)
      .then(setDeptNodes)
      .catch(() => setDeptNodes([]))
      .finally(() => setDeptLoading(false));
  }, []);

  const loadList = useCallback(() => {
    setLoading(true);
    fetchCardPersons({
      keyword: keyword || undefined,
      deptId,
      includeChildren,
      personType,
      status: statusFilter,
      hasPhoto: photoFilter === 'all' ? undefined : photoFilter === 'has',
      sortBy,
      page,
      pageSize,
    })
      .then((result) => {
        setRows(result.items);
        setTotal(result.total);
      })
      .catch((error: unknown) => {
        setRows([]);
        setTotal(0);
        message.error(error instanceof Error ? error.message : '人员列表加载失败');
      })
      .finally(() => setLoading(false));
  }, [keyword, deptId, includeChildren, personType, statusFilter, photoFilter, sortBy, page, pageSize, message]);

  const loadPersonTypes = useCallback(() => {
    fetchCardPersonTypes()
      .then((result) => {
        setPersonTypes(
          result.items
            .map((item) => (item.personType ?? '').trim())
            .filter((value, index, list) => value.length > 0 && list.indexOf(value) === index),
        );
      })
      .catch(() => setPersonTypes([]));
  }, []);

  useEffect(() => {
    loadDeptTree();
    loadPersonTypes();
    fetchSubsystems()
      .then(setSubsystems)
      .catch(() => setSubsystems([]));
    const loadCodes = (tableName: string, setter: (options: CodeOption[]) => void) => {
      fetchCardCodeItems({ tableName, pageSize: 200 })
        .then((result) => {
          setter(
            result.items
              .filter((item) => item.dictId)
              .map((item) => ({ value: item.dictId ?? '', label: item.dictValue ?? item.dictId ?? '' })),
          );
        })
        .catch(() => setter([]));
    };
    loadCodes('BM_NATIONALITY', setNationalities);
    loadCodes('BM_DUTY', setDuties);
  }, [loadDeptTree, loadPersonTypes]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const deptOptions = useMemo(() => buildDeptOptions(deptNodes), [deptNodes]);
  const treeDeptNodes = useMemo(
    () => (showDisabled ? deptNodes : deptNodes.filter((node) => node.isDel !== true)),
    [deptNodes, showDisabled],
  );
  const disabledCount = useMemo(() => deptNodes.filter((node) => node.isDel === true).length, [deptNodes]);
  const matchedDeptCount = useMemo(
    () => filterCardDeptNodes(treeDeptNodes, deptKeyword).length,
    [treeDeptNodes, deptKeyword],
  );

  // 停用部门被隐藏后，若当前选中的正是被隐藏的那个，自动切到第一个启用部门
  useEffect(() => {
    if (showDisabled || deptId == null) return;
    const current = deptNodes.find((node) => node.deptId === deptId);
    if (current?.isDel) {
      const first = deptNodes.find((node) => node.isDel !== true);
      setDeptId(first ? first.deptId : undefined);
      setPage(1);
    }
  }, [showDisabled, deptNodes, deptId]);

  const openCreate = async () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ DeptId: deptId, Systems: ['ST'], IsMarry: false });
    setDrawerOpen(true);
    if (has('card:person:create')) {
      try {
        const result = await fetchNextPersonNo();
        form.setFieldsValue({ PersonNo: result.personNo });
      } catch {
        /* 预取失败时留空，由后端发号 */
      }
    }
  };

  const openEdit = async (record: CardPerson) => {
    setEditing(record);
    form.resetFields();
    setDrawerOpen(true);
    try {
      const detail = await fetchCardPerson(record.personId);
      const person = detail.person;
      form.setFieldsValue({
        PersonNo: person.personNo ?? '',
        PersonName: person.personName ?? '',
        DeptId: person.deptId ?? undefined,
        PersonType: person.personType ?? undefined,
        Sex: sexCode(person.sex),
        Birthday: person.birthday ? dayjs(person.birthday) : null,
        IdNumber: person.idNumber ?? '',
        Mobile: person.mobile ?? '',
        Nationality: person.nationality ?? undefined,
        Duty: person.duty ?? undefined,
        Title: person.title ?? '',
        CertName: person.certName ?? '',
        CertCode: person.certCode ?? '',
        IsMarry: person.isMarry ?? false,
        NativePlace: person.nativePlace ?? '',
        Address: person.address ?? '',
        Residence: person.residence ?? '',
        OnWorkDate: person.onWorkDate ? dayjs(person.onWorkDate) : null,
        OffWorkDate: person.offWorkDate ? dayjs(person.offWorkDate) : null,
        Remark: person.remark ?? '',
        Systems: detail.systems.length > 0 ? detail.systems : ['ST'],
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取人员详情失败');
    }
  };

  const closeEditor = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  const toPayload = (values: PersonFormValues): CardPersonSavePayload => ({
    PersonNo: values.PersonNo?.trim() || undefined,
    PersonName: values.PersonName.trim(),
    DeptId: Number(values.DeptId),
    PersonType: values.PersonType || undefined,
    CertName: values.CertName?.trim() || undefined,
    CertCode: values.CertCode?.trim() || undefined,
    Duty: values.Duty || undefined,
    Title: values.Title?.trim() || undefined,
    Nationality: values.Nationality || undefined,
    Sex: values.Sex || undefined,
    Birthday: values.Birthday ? values.Birthday.format('YYYY-MM-DD') : undefined,
    IsMarry: values.IsMarry ?? false,
    NativePlace: values.NativePlace?.trim() || undefined,
    Address: values.Address?.trim() || undefined,
    Residence: values.Residence?.trim() || undefined,
    OnWorkDate: values.OnWorkDate ? values.OnWorkDate.format('YYYY-MM-DD') : undefined,
    OffWorkDate: values.OffWorkDate ? values.OffWorkDate.format('YYYY-MM-DD') : undefined,
    Remark: values.Remark?.trim() || undefined,
    Mobile: values.Mobile?.trim() || undefined,
    IdNumber: values.IdNumber?.trim() || undefined,
    Systems: values.Systems,
  });

  const handleSave = async () => {
    let values: PersonFormValues;
    try {
      values = await form.validateFields();
    } catch {
      // 校验失败：表单项已高亮，保持抽屉打开
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateCardPerson(editing.personId, toPayload(values));
        message.success('人员信息已保存');
      } else {
        const result = await createCardPerson(toPayload(values));
        message.success(`人员已创建，编号 ${result.personNo}`);
      }
      setDrawerOpen(false);
      loadList();
      loadDeptTree();
      // 可能录入新的类型，刷新下拉建议
      loadPersonTypes();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: CardPerson) => {
    try {
      await deleteCardPerson(record.personId);
      message.success('人员已注销');
      loadList();
      loadDeptTree();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '注销失败');
    }
  };

  const handleRestore = async (record: CardPerson) => {
    try {
      await restoreCardPerson(record.personId);
      message.success('人员已恢复');
      loadList();
      loadDeptTree();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '恢复失败');
    }
  };

  const handleMove = (record?: CardPerson) => {
    const ids = record ? [record.personId] : selectedIds;
    if (ids.length === 0) {
      message.warning('请先选择需要调动的人员');
      return;
    }
    let targetDept: number | undefined;
    modal.confirm({
      title: `调动 ${ids.length} 名人员`,
      content: (
        <TreeSelect
          style={{ width: '100%', marginTop: 12 }}
          treeData={deptOptions as never}
          treeDefaultExpandAll
          showSearch
          filterTreeNode={(input, node) => matchDeptOption(input, node)}
          placeholder="选择目标部门（可输入名称/编号）"
          onChange={(value: number) => {
            targetDept = value;
          }}
        />
      ),
      onOk: async () => {
        if (!targetDept) {
          message.warning('请选择目标部门');
          throw new Error('未选择部门');
        }
        await moveCardPersons(ids, targetDept);
        message.success('人员已调动');
        setSelectedIds([]);
        loadList();
        loadDeptTree();
      },
    });
  };

  const handleExport = async () => {
    try {
      await exportCardPersons({
        keyword: keyword || undefined,
        deptId,
        includeChildren,
        personType,
        status: statusFilter,
        hasPhoto: photoFilter === 'all' ? undefined : photoFilter === 'has',
      });
      message.success('导出已开始，请稍候查看下载文件');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出失败');
    }
  };

  const columns: ColumnsType<CardPerson> = [
    {
      title: '照片',
      key: 'photo',
      width: 72,
      render: (_, record) => <FaceThumb personId={record.personId} hasPhoto={record.hasPhoto} size={44} />,
    },
    { title: '人员编号', dataIndex: 'personNo', key: 'personNo', width: 110 },
    { title: '姓名', dataIndex: 'personName', key: 'personName', width: 100 },
    {
      title: '性别',
      dataIndex: 'sex',
      key: 'sex',
      width: 70,
      render: (value: string | null) => sexText(value),
    },
    {
      title: '部门',
      dataIndex: 'deptName',
      key: 'deptName',
      width: 180,
      render: (value: string | null, record) => value ?? record.deptNo ?? '-',
    },
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
    { title: '手机', dataIndex: 'mobile', key: 'mobile', width: 130, render: (value: string | null) => value || '-' },
    {
      title: '状态',
      key: 'status',
      width: 90,
      render: (_, record) => personStatusTag(record.isDel),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 150,
      render: (value: string | null) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 190,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          {has('card:person:update') && !record.isDel && (
            <Button type="link" size="small" onClick={() => openEdit(record)}>
              编辑
            </Button>
          )}
          {has('card:person:update') && !record.isDel && (
            <Button type="link" size="small" icon={<SwapOutlined />} onClick={() => handleMove(record)}>
              调动
            </Button>
          )}
          {has('card:person:delete') && !record.isDel && (
            <Popconfirm
              title="确认注销该人员？注销后需在账户与卡模块完成销户。"
              onConfirm={() => handleDelete(record)}
            >
              <Button type="link" size="small" danger>
                注销
              </Button>
            </Popconfirm>
          )}
          {has('card:person:delete') && record.isDel && (
            <Button type="link" size="small" onClick={() => handleRestore(record)}>
              恢复
            </Button>
          )}
        </Space>
      ),
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
            <Button size="small" type="text" icon={<ReloadOutlined />} onClick={loadDeptTree}>
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
            nodes={treeDeptNodes}
            loading={deptLoading}
            selectedKey={deptId}
            keyword={deptKeyword}
            onSelect={(value) => {
              setPage(1);
              setDeptId(value);
            }}
          />
          <div className="card-tree-footer">
            <span className="card-muted">
              {deptKeyword.trim()
                ? `匹配 ${matchedDeptCount} 个部门`
                : showDisabled && disabledCount > 0
                  ? `共 ${treeDeptNodes.length} 个部门（含 ${disabledCount} 个停用）`
                  : `共 ${treeDeptNodes.length} 个部门${disabledCount > 0 ? `，已隐藏 ${disabledCount} 个停用` : ''}`}
            </span>
            <Button
              size="small"
              type="link"
              disabled={!deptId}
              onClick={() => {
                setDeptId(undefined);
                setPage(1);
              }}
            >
              查看全部部门
            </Button>
          </div>
        </Card>
      </aside>

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
          <Select
            allowClear
            showSearch
            style={{ width: 140 }}
            placeholder="人员类型"
            value={personType}
            options={personTypes.map((value) => ({ value, label: value }))}
            onChange={(value) => {
              setPage(1);
              setPersonType(value ?? undefined);
            }}
          />
          <Radio.Group
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value);
            }}
            options={[
              { label: '在册', value: 'normal' },
              { label: '已注销', value: 'deleted' },
              { label: '全部', value: 'all' },
            ]}
            optionType="button"
            buttonStyle="solid"
          />
          <Select
            style={{ width: 130 }}
            value={photoFilter}
            onChange={(value) => {
              setPage(1);
              setPhotoFilter(value);
            }}
            options={[
              { label: '照片：全部', value: 'all' },
              { label: '已有照片', value: 'has' },
              { label: '缺照片', value: 'none' },
            ]}
          />
          <Select
            style={{ width: 150 }}
            value={sortBy}
            onChange={(value: CardPersonSortBy) => {
              setPage(1);
              setSortBy(value);
            }}
            options={[
              { label: '按部门排序', value: 'dept' },
              { label: '按人员编号', value: 'personNo' },
              { label: '按人员姓名', value: 'personName' },
              { label: '按卡号', value: 'cardNo' },
              { label: '按更新时间', value: 'update' },
            ]}
          />
          <span className="card-inline-switch">
            含下级部门
            <Switch
              size="small"
              checked={includeChildren}
              onChange={(checked) => {
                setPage(1);
                setIncludeChildren(checked);
              }}
            />
          </span>
          <span style={{ flex: 1 }} />
          <Button icon={<ReloadOutlined />} onClick={loadList}>
            刷新
          </Button>
          {has('card:person:update') && selectedIds.length > 0 && (
            <Button icon={<SwapOutlined />} onClick={() => handleMove()}>
              批量调动（{selectedIds.length}）
            </Button>
          )}
          {has('card:person:export') && (
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
          )}
          {has('card:person:create') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增人员
            </Button>
          )}
        </div>

        <Table
          rowKey="personId"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 1280 }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as number[]),
            getCheckboxProps: (record) => ({ disabled: record.isDel }),
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (count) => `共 ${count} 名人员`,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            },
          }}
        />
      </section>

      <Drawer
        title={editing ? `编辑人员：${editing.personName ?? ''}` : '新增人员'}
        width={760}
        open={drawerOpen}
        onClose={closeEditor}
        maskClosable={false}
        forceRender
        extra={
          <Space>
            <Button onClick={closeEditor}>取消</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Tabs
            items={[
              {
                key: 'base',
                label: '基本信息',
                forceRender: true,
                children: (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="PersonNo" label="人员编号" extra="留空由系统按 CS 规则自动发号">
                        <Input placeholder="自动生成" maxLength={20} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="PersonName"
                        label="姓名"
                        rules={[{ required: true, message: '请输入姓名' }, { max: 20, message: '不超过 20 个字符' }]}
                      >
                        <Input placeholder="请输入姓名" maxLength={20} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="DeptId" label="所属部门" rules={[{ required: true, message: '请选择部门' }]}>
                        <TreeSelect
                          treeData={deptOptions as never}
                          treeDefaultExpandAll
                          showSearch
                          filterTreeNode={(input, node) => matchDeptOption(input, node)}
                          placeholder="请选择部门（可输入名称/编号）"
                          allowClear
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="PersonType"
                        label="人员类型"
                        extra="可直接输入新类型，也可从已有类型中选择"
                        rules={[{ max: 20, message: '不超过 20 个字符' }]}
                      >
                        <AutoComplete
                          allowClear
                          placeholder="输入或选择"
                          options={personTypes.map((value) => ({ value }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="Sex" label="性别">
                        <Select
                          allowClear
                          placeholder="请选择"
                          options={[
                            { value: '1', label: '男' },
                            { value: '2', label: '女' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="Birthday" label="出生日期">
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="IdNumber"
                        label="身份证号"
                        rules={[{ pattern: /^$|^(\d{15}|\d{17}[\dXx])$/, message: '身份证号需为 15 或 18 位' }]}
                      >
                        <Input placeholder="18 位身份证号" maxLength={18} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="Mobile"
                        label="手机号"
                        rules={[{ pattern: /^$|^1\d{10}$/, message: '手机号格式不正确' }]}
                      >
                        <Input placeholder="11 位手机号" maxLength={11} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="Nationality" label="民族">
                        <Select allowClear showSearch options={nationalities} placeholder="请选择" />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'work',
                label: '工作与证件',
                forceRender: true,
                children: (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="Duty" label="职务">
                        <Select allowClear showSearch options={duties} placeholder="请选择" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="Title" label="职称">
                        <Input maxLength={20} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="CertName" label="证件名称">
                        <Input maxLength={20} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="CertCode" label="证件号码">
                        <Input maxLength={20} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="IsMarry" label="婚姻状况">
                        <Select
                          options={[
                            { value: false, label: '未婚' },
                            { value: true, label: '已婚' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="NativePlace" label="籍贯">
                        <Input maxLength={50} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="OnWorkDate" label="参加工作时间">
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="OffWorkDate" label="离职时间">
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="Residence" label="户籍地址">
                        <Input maxLength={30} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="Address" label="现住址">
                        <Input maxLength={50} />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'extra',
                label: '系统与备注',
                forceRender: true,
                children: (
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="Systems" label="可用子系统" extra="ST 为卡务系统，默认始终启用">
                        <Select
                          mode="multiple"
                          allowClear
                          placeholder="不选则仅开通 ST"
                          options={[
                            { value: 'ST', label: 'ST 卡务系统' },
                            ...subsystems
                              .filter((item) => item.systemNo !== 'ST')
                              .map((item) => ({ value: item.systemNo, label: `${item.systemNo} ${item.systemName}` })),
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="Remark" label="备注">
                        <Input.TextArea rows={3} maxLength={50} showCount />
                      </Form.Item>
                    </Col>
                    {editing?.cardNo ? (
                      <Col span={24}>
                        <Tag color="blue">当前卡号：{editing.cardNo}（开户与销户请在「账户与卡」模块操作）</Tag>
                      </Col>
                    ) : null}
                  </Row>
                ),
              },
            ]}
          />
        </Form>
      </Drawer>
    </div>
  );
}
