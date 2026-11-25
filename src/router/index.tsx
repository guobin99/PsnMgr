import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spin } from 'antd';
import AdminLayout from '@/layouts/AdminLayout';
import LoginPage from '@/pages/LoginPage';
import ForbiddenPage from '@/pages/ForbiddenPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { buildDomainEntries, flattenLeaves, navigation } from '@/config/menu';
import RequireAuth from './RequireAuth';
import PermissionGate from './PermissionGate';
import { resolvePage } from './pageRegistry';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ModulePage = lazy(() => import('@/pages/ModulePage'));

function RouteFallback() {
  return (
    <div className="route-loading">
      <Spin size="large" />
      <span>页面加载中…</span>
    </div>
  );
}

function boundary(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

/** 业务页面由导航树派生，路由文件不重复声明路径与权限码 */
const pageRoutes = flattenLeaves(navigation)
  .filter((node) => node.path && node.path !== '/dashboard')
  .map((node) => {
    const RealPage = resolvePage(node.path);
    return (
      <Route
        key={node.path}
        path={node.path}
        element={boundary(
          <PermissionGate permission={node.permission}>
            {RealPage ? <RealPage /> : <ModulePage />}
          </PermissionGate>,
        )}
      />
    );
  });

/** 业务域根路径重定向到域内第一个页面 */
const domainRedirects = buildDomainEntries(navigation).map((domain) => (
  <Route key={domain.key} path={`/${domain.key}`} element={<Navigate to={domain.entryPath} replace />} />
));

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={<PermissionGate permission="dashboard:view">{boundary(<DashboardPage />)}</PermissionGate>}
        />
        {domainRedirects}
        {pageRoutes}
        <Route path="403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
