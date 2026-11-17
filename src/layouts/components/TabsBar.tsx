import { Button, Dropdown } from 'antd';
import { CloseOutlined, HomeOutlined, MoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTabs } from '@/store/tabs';

/** 多页签栏：页签集合来自页签上下文，关闭策略由上下文统一实现 */
export default function TabsBar() {
  const navigate = useNavigate();
  const { tabs, activePath, closeTab, closeOthers, closeAll, refresh } = useTabs();

  const onMenuClick = ({ key }: { key: string }) => {
    if (key === 'refresh') refresh();
    if (key === 'others') closeOthers();
    if (key === 'all') closeAll();
  };

  return (
    <div className="workspace-tabs">
      <div className="tabs-scroll">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`workspace-tab ${activePath === tab.path ? 'is-active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            {tab.path === '/dashboard' ? <HomeOutlined /> : <span className="tab-dot" />}
            <span>{tab.title}</span>
            {tab.closable && (
              <span
                role="button"
                className="tab-close"
                aria-label={`关闭${tab.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  closeTab(tab.path);
                }}
              >
                <CloseOutlined />
              </span>
            )}
          </button>
        ))}
      </div>
      <Dropdown
        menu={{
          items: [
            { key: 'refresh', label: '刷新当前页' },
            { key: 'others', label: '关闭其他页签' },
            { key: 'all', label: '关闭全部页签' },
          ],
          onClick: onMenuClick,
        }}
      >
        <Button type="text" className="tabs-more" icon={<MoreOutlined />} />
      </Dropdown>
    </div>
  );
}
