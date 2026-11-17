import { useEffect, useMemo, useState } from 'react';
import { Input, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { filterMenuByPermission, findNodeByPath, getOpenKeys, navigation } from '@/config/menu';
import { useAuth } from '@/store/auth';
import type { NavNode } from '@/types/navigation';

interface SideMenuProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

function filterByKeyword(nodes: NavNode[], keyword: string): NavNode[] {
  const lower = keyword.trim().toLowerCase();
  if (!lower) return nodes;
  return nodes.reduce<NavNode[]>((matched, node) => {
    if (node.children?.length) {
      const children = filterByKeyword(node.children, keyword);
      if (children.length > 0) matched.push({ ...node, children });
      return matched;
    }
    const hit = node.label.toLowerCase().includes(lower) || (node.path ?? '').toLowerCase().includes(lower);
    if (hit) matched.push(node);
    return matched;
  }, []);
}

function collectParentKeys(nodes: NavNode[]): string[] {
  return nodes.flatMap((node) => (node.children?.length ? [node.key, ...collectParentKeys(node.children)] : []));
}

function toMenuItems(nodes: NavNode[]): MenuProps['items'] {
  return nodes.map((node) => ({
    key: node.key,
    icon: node.icon,
    label: <span className="menu-item-label">{node.label}</span>,
    children: node.children?.length ? toMenuItems(node.children) : undefined,
  }));
}

/** 侧边栏菜单：基于权限过滤后的导航树渲染，支持关键词筛选 */
export default function SideMenu({ collapsed = false, onNavigate }: SideMenuProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [openKeys, setOpenKeys] = useState<string[]>(() => getOpenKeys(pathname));

  const permittedTree = useMemo(() => filterMenuByPermission(navigation, permissions), [permissions]);
  const visibleTree = useMemo(() => filterByKeyword(permittedTree, keyword), [permittedTree, keyword]);
  const menuItems = useMemo(() => toMenuItems(visibleTree), [visibleTree]);
  const selectedKey = findNodeByPath(pathname)?.key;

  useEffect(() => {
    if (keyword.trim()) return;
    setOpenKeys((previous) => Array.from(new Set([...previous, ...getOpenKeys(pathname)])));
  }, [pathname, keyword]);

  const onClick: MenuProps['onClick'] = ({ key }) => {
    const target = findNodeByPath(pathname);
    const leaf = (function pick(nodes: NavNode[]): NavNode | undefined {
      for (const node of nodes) {
        if (node.key === key && node.path) return node;
        const hit = node.children ? pick(node.children) : undefined;
        if (hit) return hit;
      }
      return undefined;
    })(visibleTree);
    if (leaf?.path) {
      if (leaf.path !== target?.path) navigate(leaf.path);
      setKeyword('');
      onNavigate?.();
    }
  };

  return (
    <>
      {!collapsed && (
        <div className="sidebar-filter">
          <Input
            size="small"
            allowClear
            value={keyword}
            prefix={<SearchOutlined />}
            placeholder="筛选菜单"
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
      )}
      <Menu
        theme="dark"
        mode="inline"
        items={menuItems}
        selectedKeys={selectedKey ? [selectedKey] : []}
        openKeys={collapsed ? [] : keyword.trim() ? collectParentKeys(visibleTree) : openKeys}
        onOpenChange={(keys) => setOpenKeys(keys as string[])}
        onClick={onClick}
        className="sidebar-menu"
      />
    </>
  );
}
