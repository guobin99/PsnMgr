import { Breadcrumb } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { getBreadcrumbs } from '@/config/menu';

/** 面包屑：链路由当前路径反查导航树，末项不可点击 */
export default function AppBreadcrumb() {
  const { pathname } = useLocation();
  const items = getBreadcrumbs(pathname).map((crumb) => ({
    title: crumb.path ? <Link to={crumb.path}>{crumb.label}</Link> : <span>{crumb.label}</span>,
  }));

  return <Breadcrumb className="header-breadcrumb" items={items} />;
}
