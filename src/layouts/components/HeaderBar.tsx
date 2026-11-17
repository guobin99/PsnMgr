import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Drawer, Dropdown, Tag, Tooltip } from 'antd';
import {
  AppstoreOutlined,
  BellOutlined,
  CheckOutlined,
  DownOutlined,
  ExpandOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildDomainEntries, filterMenuByPermission, getDomainOf, navigation } from '@/config/menu';
import { useAuth } from '@/store/auth';
import { useTabs } from '@/store/tabs';
import AppBreadcrumb from './AppBreadcrumb';
import GlobalSearch from './GlobalSearch';
import UserMenu from './UserMenu';

interface HeaderBarProps {
  collapsed: boolean;
  isMobile: boolean;
  onToggle: () => void;
}

interface NoticeItem {
  id: number;
  title: string;
  description: string;
  time: string;
  category: string;
  read: boolean;
}

const initialNotices: NoticeItem[] = [
  { id: 1, title: '访客预约待审批', description: '李明提交的访客预约等待您审批', time: '10 分钟前', category: '访客', read: false },
  { id: 2, title: '门禁异常事件提醒', description: '东门控制器发生 1 次未授权通行尝试', time: '32 分钟前', category: '门禁', read: false },
  { id: 3, title: '考勤数据计算完成', description: '昨日每日考勤数据已完成计算', time: '1 小时前', category: '考勤', read: false },
  { id: 4, title: '消费终端恢复在线', description: '二食堂 03 号消费机已恢复连接', time: '2 小时前', category: '设备', read: true },
];

/** 顶栏内容行：折叠开关、业务域切换、面包屑、搜索、刷新、全屏、通知与用户菜单 */
export default function HeaderBar({ collapsed, isMobile, onToggle }: HeaderBarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { permissions } = useAuth();
  const { refresh } = useTabs();
  const [searchOpen, setSearchOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [notices, setNotices] = useState(initialNotices);

  const visibleDomains = useMemo(
    () => buildDomainEntries(filterMenuByPermission(navigation, permissions)),
    [permissions],
  );
  const currentDomain = getDomainOf(pathname);
  const unreadCount = notices.filter((notice) => !notice.read).length;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const domainItems = visibleDomains.map((domain) => ({
    key: domain.key,
    icon: domain.icon,
    label: (
      <span className={`domain-switch-item ${domain.key === currentDomain?.key ? 'is-active' : ''}`}>
        <span>{domain.label}</span>
        {domain.key === currentDomain?.key ? <CheckOutlined className="domain-switch-check" /> : null}
      </span>
    ),
  }));

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen();
    }
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <Button
          type="text"
          className="header-icon-button"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          aria-label="切换导航"
        />
        <Dropdown
          trigger={['click']}
          placement="bottomLeft"
          overlayClassName="domain-switch-overlay"
          menu={{
            items: domainItems,
            onClick: ({ key }) => {
              const entry = visibleDomains.find((domain) => domain.key === key);
              if (entry) navigate(entry.entryPath);
            },
          }}
        >
          <button className="domain-switch" aria-label="业务域切换">
            <AppstoreOutlined className="domain-switch-icon" />
            <span className="domain-switch-text">{currentDomain?.label ?? '业务域切换'}</span>
            <DownOutlined className="domain-switch-chevron" />
          </button>
        </Dropdown>
        <AppBreadcrumb />
      </div>

      <div className="header-actions">
        <button className="global-search" onClick={() => setSearchOpen(true)}>
          <SearchOutlined className="global-search-icon" />
          <span className="global-search-text">搜索菜单与功能</span>
          <kbd>Ctrl K</kbd>
        </button>
        {!isMobile && (
          <>
            <Tooltip title="刷新当前页">
              <Button type="text" className="header-icon-button desktop-action" icon={<ReloadOutlined />} onClick={refresh} />
            </Tooltip>
            <Tooltip title="全屏显示">
              <Button
                type="text"
                className="header-icon-button desktop-action"
                icon={<ExpandOutlined />}
                onClick={toggleFullscreen}
              />
            </Tooltip>
          </>
        )}
        <Tooltip title="消息通知">
          <Badge count={unreadCount} size="small" offset={[-3, 5]}>
            <Button
              type="text"
              className="header-icon-button"
              icon={<BellOutlined />}
              onClick={() => setNoticeOpen(true)}
            />
          </Badge>
        </Tooltip>
        <span className="header-divider" />
        <UserMenu />
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      <Drawer
        title="消息通知"
        open={noticeOpen}
        onClose={() => setNoticeOpen(false)}
        width={400}
        extra={
          <Button type="link" onClick={() => setNotices((previous) => previous.map((item) => ({ ...item, read: true })))}>
            全部已读
          </Button>
        }
      >
        <div className="notice-list">
          {notices.map((notice) => (
            <button
              key={notice.id}
              className={`notice-item ${notice.read ? 'is-read' : ''}`}
              onClick={() =>
                setNotices((previous) => previous.map((item) => (item.id === notice.id ? { ...item, read: true } : item)))
              }
            >
              <span className="notice-icon">
                <BellOutlined />
              </span>
              <span className="notice-body">
                <span className="notice-title">
                  <strong>{notice.title}</strong>
                  {!notice.read && <i />}
                </span>
                <span>{notice.description}</span>
                <small>
                  <Tag>{notice.category}</Tag>
                  {notice.time}
                </small>
              </span>
            </button>
          ))}
        </div>
      </Drawer>
    </header>
  );
}
