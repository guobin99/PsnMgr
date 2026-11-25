import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Empty, Input, Spin, Tag, Tooltip, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  PictureOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { fetchCardFaceImageUrl } from '@/services/card';
import type { CardDeptNode } from '@/types/card';

/** 统一时间展示：yyyy-MM-dd HH:mm */
export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const pad = (input: number) => input.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 只保留日期部分 */
export function formatDate(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

/** 部门扁平表转 AntD 树，节点显示「部门名 + 含下级在册人数」 */
export function buildCardDeptTree(nodes: CardDeptNode[], showDisabled = true): DataNode[] {
  const visible = showDisabled ? nodes : nodes.filter((node) => node.isDel !== true);
  const map = new Map<number, DataNode & { children: DataNode[] }>();
  visible.forEach((node) => {
    map.set(node.deptId, {
      key: node.deptId,
      title: (
        <span className="card-dept-node">
          <span className="card-dept-node-name">
            {node.deptName ?? '未命名部门'}
            {node.isDel ? <Tag color="default">已停用</Tag> : null}
          </span>
          <span className="card-dept-node-meta">
            {node.activeDirect ?? 0} 人 · 含下级 {node.activeCount ?? 0} 人
          </span>
        </span>
      ),
      children: [],
    });
  });

  const roots: DataNode[] = [];
  visible.forEach((node) => {
    const current = map.get(node.deptId);
    if (!current) return;
    const parent = node.parentId != null ? map.get(node.parentId) : undefined;
    if (parent) parent.children.push(current);
    else roots.push(current);
  });
  return roots;
}

/**
 * 按关键字筛选部门节点：命中的节点及其祖先链都保留，保证树的层级完整。
 */
export function filterCardDeptNodes(nodes: CardDeptNode[], keyword: string): CardDeptNode[] {
  const key = keyword.trim().toLowerCase();
  if (!key) return nodes;

  const byId = new Map<number, CardDeptNode>();
  const childrenOf = new Map<number, CardDeptNode[]>();
  nodes.forEach((node) => {
    byId.set(node.deptId, node);
    const parentKey = node.parentId ?? -1;
    const list = childrenOf.get(parentKey) ?? [];
    list.push(node);
    childrenOf.set(parentKey, list);
  });

  const keep = new Set<number>();
  const visited = new Set<number>();
  const visit = (node: CardDeptNode): boolean => {
    if (visited.has(node.deptId)) return keep.has(node.deptId);
    visited.add(node.deptId);
    const self =
      (node.deptName ?? '').toLowerCase().includes(key) || (node.deptNo ?? '').toLowerCase().includes(key);
    let childKeep = false;
    (childrenOf.get(node.deptId) ?? []).forEach((child) => {
      if (visit(child)) childKeep = true;
    });
    if (self || childKeep) {
      keep.add(node.deptId);
      return true;
    }
    return false;
  };

  nodes.forEach((node) => {
    if (node.parentId == null || !byId.has(node.parentId)) visit(node);
  });
  return nodes.filter((node) => keep.has(node.deptId));
}

/**
 * 默认展开的节点：搜索时展开全部命中路径；
 * 未搜索时部门较少（<=60）全部展开，较多时只展开前两级，避免树面板被压成一长条。
 */
export function cardDeptExpandedKeys(nodes: CardDeptNode[], keyword = ''): number[] {
  if (nodes.length === 0) return [];
  if (keyword.trim()) return nodes.map((node) => node.deptId);

  const parentOf = new Map<number, number | null>();
  nodes.forEach((node) => parentOf.set(node.deptId, node.parentId ?? null));

  const depthOf = (id: number): number => {
    let depth = 0;
    let cursor = parentOf.get(id) ?? null;
    const guard = new Set<number>();
    while (cursor != null && !guard.has(cursor)) {
      guard.add(cursor);
      depth += 1;
      cursor = parentOf.get(cursor) ?? null;
    }
    return depth;
  };

  if (nodes.length <= 60) return nodes.map((node) => node.deptId);
  return nodes.filter((node) => depthOf(node.deptId) <= 1).map((node) => node.deptId);
}

/**
 * 部门树搜索行：搜索框 + 可选的「显示停用」图标开关。
 * 两者同一行，不占额外高度；不传 onToggleDisabled 时只渲染搜索框。
 */
export function CardDeptSearchRow({
  keyword,
  onKeywordChange,
  placeholder = '搜索部门名称 / 编号',
  showDisabled,
  onToggleDisabled,
  disabledCount = 0,
}: {
  keyword: string;
  onKeywordChange: (value: string) => void;
  placeholder?: string;
  showDisabled?: boolean;
  onToggleDisabled?: () => void;
  disabledCount?: number;
}) {
  return (
    <div className="card-tree-search-row">
      <Input
        allowClear
        prefix={<SearchOutlined />}
        className="card-tree-search"
        placeholder={placeholder}
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
      />
      {onToggleDisabled ? (
        <Tooltip
          title={
            disabledCount === 0
              ? '暂无已停用部门'
              : showDisabled
                ? `正在显示 ${disabledCount} 个已停用部门，点击隐藏`
                : `已隐藏 ${disabledCount} 个已停用部门，点击显示`
          }
        >
          {/* 禁用态的按钮不派发鼠标事件，需用 span 包一层 Tooltip 才能弹出 */}
          <span className="card-tree-filter-wrap">
            <Button
              size="small"
              className={`card-tree-filter-btn${showDisabled ? ' is-active' : ''}`}
              icon={showDisabled ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              disabled={disabledCount === 0}
              onClick={onToggleDisabled}
            />
          </span>
        </Tooltip>
      ) : null}
    </div>
  );
}

/**
 * 部门树面板：选中节点用于右侧列表或详情筛选。
 * 自带「展开全部 / 收起全部」工具条与滚动区，树体高度随视口伸缩。
 */
export function CardDeptTreePanel({
  nodes,
  loading,
  selectedKey,
  onSelect,
  emptyText = '暂无部门',
  keyword = '',
  extraTools,
}: {
  nodes: CardDeptNode[];
  loading?: boolean;
  selectedKey?: number | null;
  onSelect: (deptId: number) => void;
  emptyText?: string;
  keyword?: string;
  /** 工具条右侧的附加控件，如「显示已停用」开关 */
  extraTools?: ReactNode;
}) {
  const visibleNodes = useMemo(() => filterCardDeptNodes(nodes, keyword), [nodes, keyword]);
  const treeData = useMemo(() => buildCardDeptTree(visibleNodes), [visibleNodes]);
  const [expandedKeys, setExpandedKeys] = useState<number[]>([]);
  // 用户手动展开/收起后不再套用默认展开策略，仅搜索词变化时重新展开命中路径
  const userTouched = useRef(false);
  const lastKeyword = useRef<string | null>(null);

  useEffect(() => {
    if (visibleNodes.length === 0) return;
    const keywordChanged = lastKeyword.current !== keyword;
    lastKeyword.current = keyword;
    if (keywordChanged || !userTouched.current) {
      setExpandedKeys(cardDeptExpandedKeys(visibleNodes, keyword));
      return;
    }
    // 数据刷新（新增/改名/排序）后保留用户的展开状态，仅剔除已消失的节点
    const valid = new Set(visibleNodes.map((node) => node.deptId));
    setExpandedKeys((prev) => {
      const next = prev.filter((key) => valid.has(key));
      return next.length === prev.length ? prev : next;
    });
  }, [visibleNodes, keyword]);

  const expandAll = () => {
    userTouched.current = true;
    setExpandedKeys(visibleNodes.map((node) => node.deptId));
  };

  const collapseAll = () => {
    userTouched.current = true;
    setExpandedKeys([]);
  };

  return (
    <div className="system-tree-panel card-tree-panel">
      <div className="card-tree-tools">
        <div className="card-tree-tools-left">
          <Button
            type="link"
            size="small"
            onClick={expandAll}
            disabled={visibleNodes.length === 0 || expandedKeys.length >= visibleNodes.length}
          >
            展开全部
          </Button>
          <Button type="link" size="small" onClick={collapseAll} disabled={expandedKeys.length === 0}>
            收起全部
          </Button>
        </div>
        {extraTools ? <div className="card-tree-tools-right">{extraTools}</div> : null}
      </div>
      <div className="card-tree-scroll">
        <Spin spinning={Boolean(loading)}>
          {visibleNodes.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={keyword.trim() ? '没有匹配的部门' : emptyText}
            />
          ) : (
            <Tree
              blockNode
              treeData={treeData}
              expandedKeys={expandedKeys}
              onExpand={(keys) => {
                userTouched.current = true;
                setExpandedKeys(keys as number[]);
              }}
              selectedKeys={selectedKey != null ? [selectedKey] : []}
              onSelect={(keys) => {
                const key = Number(keys[0]);
                if (!Number.isNaN(key) && key > 0) onSelect(key);
              }}
            />
          )}
        </Spin>
      </div>
    </div>
  );
}

/** 照片状态：0 未采集、1 待审核、2 已通过、3 已驳回 */
export function faceStatusTag(status?: number | null) {
  if (status === 1) return <Tag color="gold">待审核</Tag>;
  if (status === 2) return <Tag color="green">已通过</Tag>;
  if (status === 3) return <Tag color="red">已驳回</Tag>;
  return <Tag>未采集</Tag>;
}

/** 导入批次状态：0 待预演、1 已上传、2 已预演、3 提交中、4 成功、5 部分失败、6 异常 */
export function importStatusTag(status?: number | null) {
  switch (status) {
    case 1:
      return <Tag color="blue">待预演</Tag>;
    case 2:
      return <Tag color="gold">已预演</Tag>;
    case 3:
      return <Tag color="processing">提交中</Tag>;
    case 4:
      return <Tag color="green">已成功</Tag>;
    case 5:
      return <Tag color="red">部分失败</Tag>;
    case 6:
      return <Tag color="red">执行异常</Tag>;
    default:
      return <Tag>待处理</Tag>;
  }
}

/** 人员状态标签 */
export function personStatusTag(isDel?: boolean | null) {
  return isDel ? <Tag color="default">已注销</Tag> : <Tag color="green">在册</Tag>;
}

/** 性别码转文案：现场库存 1/2，少量历史行存中文字面，两种都要认 */
export function sexText(value?: string | null) {
  const sex = (value ?? '').trim();
  if (!sex) return '-';
  if (sex === '1' || sex.startsWith('男')) return '男';
  if (sex === '2' || sex.startsWith('女')) return '女';
  return '-';
}

/** 性别归一为码值，用于回填表单：1=男、2=女 */
export function sexCode(value?: string | null): '1' | '2' | undefined {
  const sex = (value ?? '').trim();
  if (!sex) return undefined;
  if (sex === '1' || sex.startsWith('男')) return '1';
  if (sex === '2' || sex.startsWith('女')) return '2';
  return undefined;
}

const faceCache = new Map<string, string>();

/** 照片缩略图：接口需要鉴权，改用 Blob 拉取后转对象地址 */
export function FaceThumb({
  personId,
  hasPhoto,
  size = 56,
  thumb = true,
}: {
  personId: number;
  hasPhoto?: number | boolean | null;
  size?: number;
  thumb?: boolean;
}) {
  const cacheKey = `${personId}-${thumb ? 't' : 'f'}`;
  const [url, setUrl] = useState<string | undefined>(() => faceCache.get(cacheKey));
  const [loading, setLoading] = useState(false);

  const present = Boolean(hasPhoto && Number(hasPhoto) > 0);

  useEffect(() => {
    if (!present) {
      setUrl(undefined);
      return;
    }
    const cached = faceCache.get(cacheKey);
    if (cached) {
      setUrl(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCardFaceImageUrl(personId, { thumb })
      .then((value) => {
        faceCache.set(cacheKey, value);
        if (!cancelled) setUrl(value);
      })
      .catch(() => {
        if (!cancelled) setUrl(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, personId, present, thumb]);

  const style = { width: size, height: size } as const;
  if (!present) {
    return (
      <div className="card-face-thumb is-empty" style={style}>
        <UserOutlined />
      </div>
    );
  }
  if (loading && !url) {
    return (
      <div className="card-face-thumb" style={style}>
        <Spin size="small" />
      </div>
    );
  }
  if (!url) {
    return (
      <div className="card-face-thumb is-empty" style={style}>
        <PictureOutlined />
      </div>
    );
  }
  return <img className="card-face-thumb" style={style} src={url} alt="人员照片" />;
}

/** 清理照片缓存：重新上传后需要拿到新图 */
export function invalidateFaceCache(personId: number) {
  ['t', 'f'].forEach((flag) => {
    const key = `${personId}-${flag}`;
    const url = faceCache.get(key);
    if (url) URL.revokeObjectURL(url);
    faceCache.delete(key);
  });
}
