import { useEffect, useState } from 'react';
import { Drawer, Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { STORAGE_KEYS, readStorage, writeStorage } from '@/utils/storage';
import BrandLogo from './components/BrandLogo';
import HeaderBar from './components/HeaderBar';
import SideMenu from './components/SideMenu';
import TabsBar from './components/TabsBar';

const { Sider, Content } = Layout;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() => readStorage<boolean>(STORAGE_KEYS.collapsed) ?? false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 992px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.collapsed, collapsed);
  }, [collapsed]);

  const sidebarFooter = (collapsedState: boolean) => (
    <div className={`sidebar-status ${collapsedState ? 'is-collapsed' : ''}`}>
      <span className="status-dot" />
      {!collapsedState ? (
        <div>
          <strong>服务运行正常</strong>
          <span>SQL Server · 硬件通讯服务</span>
        </div>
      ) : null}
    </div>
  );

  return (
    <Layout className="admin-shell">
      {!isMobile && (
        <Sider width={248} collapsedWidth={80} collapsed={collapsed} trigger={null} className="admin-sider">
          <BrandLogo collapsed={collapsed} />
          <div className="sidebar-section-title">{collapsed ? '···' : '业务导航'}</div>
          <div className="sidebar-menu-scroll">
            <SideMenu collapsed={collapsed} />
          </div>
          {sidebarFooter(collapsed)}
        </Sider>
      )}

      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        width={280}
        closable={false}
        className="mobile-navigation"
        styles={{ body: { padding: 0, background: '#0c1729' } }}
      >
        <BrandLogo />
        <div className="sidebar-section-title">业务导航</div>
        <div className="sidebar-menu-scroll">
          <SideMenu onNavigate={() => setMobileOpen(false)} />
        </div>
        {sidebarFooter(false)}
      </Drawer>

      <Layout className="admin-main-layout">
        <HeaderBar
          collapsed={collapsed}
          isMobile={isMobile}
          onToggle={() => (isMobile ? setMobileOpen(true) : setCollapsed(!collapsed))}
        />
        <TabsBar />
        <Content className="admin-content">
          <Outlet />
        </Content>
        <footer className="admin-footer">
          <span>人脸通 BS 一体化管理平台</span>
          <span>数据同源 · CS / BS 平滑共存</span>
        </footer>
      </Layout>
    </Layout>
  );
}
