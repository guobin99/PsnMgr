import { useEffect, useMemo, useRef, useState, type Key, type ReactNode } from 'react';
import { Button, Empty, Input, List, Spin, Tag, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { SearchOutlined } from '@ant-design/icons';
import { fetchOperators } from '@/services/system';
import type { DepartmentTreeNode, MenuTreeNode, Operator } from '@/types/system';

/** TreeSelect 专用节点（含 value） */
export interface TreeSelectNode {
  key: number;
  value: number;
  title: string;
  /** 部门编号，用于下拉搜索定位 */
  deptNo?: string;
  children: TreeSelectNode[];
}

/** 部门下拉搜索：按部门名称或部门编号模糊匹配（不区分大小写）。 */
export function matchDepartmentTreeNode(input: string, node: unknown) {
  const keyword = input.trim().toLowerCase();
  if (!keyword) return false;
  const item = node as { title?: unknown; deptNo?: string | null };
  const title = typeof item.title === 'string' ? item.title : '';
  return title.toLowerCase().includes(keyword) || (item.deptNo ?? '').toLowerCase().includes(keyword);
}

/** 部门扁平数据转 AntD 树，层级由后端按 Dept_No 推导后返回。 */
export function buildDepartmentTree(
  nodes: DepartmentTreeNode[],
  countMode?: 'active',
): DataNode[] {
  const map = new Map<number, DataNode & { children: DataNode[] }>();
  nodes.forEach((node) => {
    map.set(node.deptId, {
      key: node.deptId,
      title: (
        <span>
          {node.deptName ?? '未命名部门'}
          <span style={{ marginLeft: 8, color: '#98a2b3', fontSize: 10 }}>
            {countMode === 'active' && node.activeCount != null
              ? `${node.activeCount} 人在册`
              : `${node.personCount} 人`}
          </span>
        </span>
      ),
      children: [],
    });
  });

  const roots: DataNode[] = [];
  nodes.forEach((node) => {
    const current = map.get(node.deptId);
    if (!current) return;
    const parent = node.parentId != null ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(current);
    else roots.push(current);
  });
  return roots;
}

/** 部门树转 TreeSelect 数据。 */
export function buildDepartmentTreeSelect(nodes: DepartmentTreeNode[]): TreeSelectNode[] {
  const map = new Map<number, TreeSelectNode>();
  nodes.forEach((node) => {
    map.set(node.deptId, {
      key: node.deptId,
      value: node.deptId,
      title: node.deptName ?? '未命名部门',
      deptNo: node.deptNo,
      children: [],
    });
  });
  const roots: TreeSelectNode[] = [];
  nodes.forEach((node) => {
    const current = map.get(node.deptId);
    if (!current) return;
    const parent = node.parentId != null ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(current);
    else roots.push(current);
  });
  return roots;
}

/** 菜单扁平数据转树节点，根节点仅作分组，不可勾选。 */
export function buildMenuTree(nodes: MenuTreeNode[], assignableOnly = false): DataNode[] {
  const map = new Map<number, DataNode & { children: DataNode[]; selectable?: boolean }>();
  nodes.forEach((node) => {
    map.set(node.menuId, {
      key: node.menuId,
      title: (
        <span>
          {node.menuName}
          <span style={{ marginLeft: 8, color: '#98a2b3', fontSize: 10 }}>{node.menuNo}</span>
        </span>
      ),
      selectable: assignableOnly ? node.assignable : true,
      children: [],
    });
  });

  const roots: DataNode[] = [];
  nodes.forEach((node) => {
    const current = map.get(node.menuId);
    if (!current) return;
    const parent = node.parentId != null ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(current);
    else roots.push(current);
  });
  return roots;
}

/** 左侧操作员上下文列表：供部门权限、设备权限、子系统权限复用。 */
export function OperatorContextList({
  selectedUserNo,
  onSelect,
  title = '操作员',
}: {
  selectedUserNo?: string;
  onSelect: (operator: Operator) => void;
  title?: string;
}) {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Operator[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchOperators({ keyword, page: 1, pageSize: 50, status: 'normal' })
      .then((result) => {
        if (!cancelled) setRows(result.items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [keyword]);

  return (
    <div className="system-context-card ant-card ant-card-bordered">
      <div className="ant-card-body">
        <h3 className="system-context-title">{title}</h3>
        <Input
          className="system-context-search"
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索编号或姓名"
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Spin spinning={loading}>
          <div className="system-context-list">
            {rows.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无操作员" />
            ) : (
              <List
                dataSource={rows}
                renderItem={(item) => (
                  <button
                    type="button"
                    className={`system-context-item${item.userNo === selectedUserNo ? ' is-active' : ''}`}
                    onClick={() => onSelect(item)}
                  >
                    <strong>{item.userName}</strong>
                    <span>
                      {item.userNo}
                      {item.roleName ? ` · ${item.roleName}` : ''}
                    </span>
                  </button>
                )}
              />
            )}
          </div>
        </Spin>
      </div>
    </div>
  );
}

/** 默认展开：节点较少时全展开，较多时只展开前两级，与部门档案口径一致。 */
function defaultExpandedKeys(nodes: DepartmentTreeNode[]): Key[] {
  if (nodes.length === 0) return [];
  if (nodes.length <= 60) return nodes.map((node) => node.deptId);
  return nodes.filter((node) => (node.level ?? 1) <= 2).map((node) => node.deptId);
}

/** 通用部门树面板：带「展开全部 / 收起全部」工具条与内部滚动区，与部门档案的树保持同一形态。 */
export function DepartmentTreePanel({
  nodes,
  loading,
  selectedKey,
  onSelect,
  checkable,
  checkedKeys,
  onCheck,
  disabled,
  countMode,
  compact,
  keyword = '',
}: {
  nodes: DepartmentTreeNode[];
  loading?: boolean;
  selectedKey?: Key | null;
  onSelect?: (selectedKeys: Key[]) => void;
  checkable?: boolean;
  checkedKeys?: Key[];
  onCheck?: (checkedKeys: Key[]) => void;
  disabled?: boolean;
  countMode?: 'active';
  /** 嵌在其他容器里时用紧凑高度，不撑满视口 */
  compact?: boolean;
  /** 部门的搜索词：变化时自动展开命中路径，与部门档案一致 */
  keyword?: string;
}) {
  const treeData = useMemo(() => buildDepartmentTree(nodes, countMode), [nodes, countMode]);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  // 用户手动展开/收起后不再套用默认策略，避免每次数据刷新被重置
  const userTouched = useRef(false);
  const lastKeyword = useRef<string | null>(null);

  useEffect(() => {
    if (nodes.length === 0) return;
    const keywordChanged = lastKeyword.current !== keyword;
    lastKeyword.current = keyword;
    if (keywordChanged) {
      // 搜索时展开全部命中路径，否则深层命中会被折叠藏住
      setExpandedKeys(nodes.map((node) => node.deptId));
      return;
    }
    if (userTouched.current) {
      const valid = new Set(nodes.map((node) => node.deptId));
      setExpandedKeys((prev) => {
        const next = prev.filter((key) => valid.has(Number(key)));
        return next.length === prev.length ? prev : next;
      });
      return;
    }
    setExpandedKeys(defaultExpandedKeys(nodes));
  }, [nodes, keyword]);

  const expandAll = () => {
    userTouched.current = true;
    setExpandedKeys(nodes.map((node) => node.deptId));
  };

  const collapseAll = () => {
    userTouched.current = true;
    setExpandedKeys([]);
  };

  return (
    <div className={`system-tree-panel card-tree-panel${compact ? ' is-compact' : ''}`}>
      <div className="card-tree-tools">
        <div className="card-tree-tools-left">
          <Button
            type="link"
            size="small"
            onClick={expandAll}
            disabled={nodes.length === 0 || expandedKeys.length >= nodes.length}
          >
            展开全部
          </Button>
          <Button type="link" size="small" onClick={collapseAll} disabled={expandedKeys.length === 0}>
            收起全部
          </Button>
        </div>
      </div>
      <div className="card-tree-scroll">
        <Spin spinning={Boolean(loading)}>
          {nodes.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无部门" />
          ) : (
            <Tree
              blockNode
              treeData={treeData}
              expandedKeys={expandedKeys}
              onExpand={(keys) => {
                userTouched.current = true;
                setExpandedKeys(keys);
              }}
              selectedKeys={selectedKey != null ? [selectedKey] : []}
              onSelect={onSelect}
              checkable={checkable}
              checkStrictly={checkable}
              checkedKeys={checkedKeys}
              onCheck={(checked) => {
                // checkStrictly 模式下回调参数为 { checked, halfChecked }
                const keys = Array.isArray(checked) ? checked : checked.checked;
                onCheck?.(keys);
              }}
              disabled={disabled}
            />
          )}
        </Spin>
      </div>
    </div>
  );
}

export function operatorTypeLabel(userType?: number | null): ReactNode {
  if (userType === 1) return <Tag color="purple">管理员</Tag>;
  if (userType === 2) return <Tag color="gold">出纳员</Tag>;
  return <Tag>普通操作员</Tag>;
}

export function operatorStatusLabel(item: Operator): ReactNode {
  if (item.status === 'deleted') return <Tag color="default">已注销</Tag>;
  if (item.csOnline) return <Tag color="success">CS 在线</Tag>;
  return <Tag color="green">正常</Tag>;
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const pad = (input: number) => input.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
