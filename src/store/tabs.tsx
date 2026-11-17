import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { dashboardNode, findNodeByPath } from '@/config/menu';
import { useAuth } from '@/store/auth';
import { hasPermission } from '@/utils/permission';
import type { PageTab } from '@/types/navigation';

export const DASHBOARD_PATH = '/dashboard';

function dashboardTab(): PageTab {
  return { key: DASHBOARD_PATH, path: DASHBOARD_PATH, title: dashboardNode.label, closable: false };
}

interface TabsContextValue {
  tabs: PageTab[];
  activePath: string;
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  closeOthers: () => void;
  closeAll: () => void;
  refresh: () => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function TabsProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [tabs, setTabs] = useState<PageTab[]>([dashboardTab()]);

  const openTab = useCallback(
    (path: string) => {
      if (path === DASHBOARD_PATH) return;
      const node = findNodeByPath(path);
      if (!node?.path) return;
      // 无页面权限的直连不开页签，避免页签里出现只能看到 403 的入口
      if (!hasPermission(permissions, node.permission)) return;
      setTabs((previous) => {
        const exists = previous.some((tab) => tab.path === path);
        if (exists) {
          return previous.map((tab) => (tab.path === path ? { ...tab, title: node.label } : tab));
        }
        return [...previous, { key: path, path, title: node.label, closable: true }];
      });
    },
    [permissions],
  );

  useEffect(() => {
    openTab(location.pathname);
  }, [location.pathname, openTab]);

  /** 关闭激活页签时按「右侧相邻 → 左侧相邻 → 工作台」回退 */
  const closeTab = useCallback(
    (path: string) => {
      setTabs((previous) => {
        const index = previous.findIndex((tab) => tab.path === path);
        if (index < 0) return previous;
        const next = previous.filter((tab) => tab.path !== path);
        if (path === location.pathname) {
          const fallback = previous[index + 1] ?? previous[index - 1] ?? dashboardTab();
          navigate(fallback.path, { replace: true });
        }
        return next.length > 0 ? next : [dashboardTab()];
      });
    },
    [location.pathname, navigate],
  );

  const closeOthers = useCallback(() => {
    setTabs((previous) => {
      const current = previous.find((tab) => tab.path === location.pathname);
      return [dashboardTab(), ...(current && current.path !== DASHBOARD_PATH ? [current] : [])];
    });
  }, [location.pathname]);

  const closeAll = useCallback(() => {
    setTabs([dashboardTab()]);
    navigate(DASHBOARD_PATH, { replace: true });
  }, [navigate]);

  const refresh = useCallback(() => {
    navigate(0);
  }, [navigate]);

  const value = useMemo<TabsContextValue>(
    () => ({ tabs, activePath: location.pathname, openTab, closeTab, closeOthers, closeAll, refresh }),
    [tabs, location.pathname, openTab, closeTab, closeOthers, closeAll, refresh],
  );

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

export function useTabs(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error('useTabs 必须在 TabsProvider 内使用');
  return context;
}
