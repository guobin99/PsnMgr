import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import AppRouter from '@/router';
import { AuthProvider } from '@/store/auth';
import { TabsProvider } from '@/store/tabs';

dayjs.locale('zh-cn');

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#3568ed',
          colorInfo: '#3568ed',
          colorSuccess: '#17a673',
          colorWarning: '#ed9b32',
          colorError: '#e25151',
          colorText: '#1d2939',
          colorTextSecondary: '#667085',
          colorBorderSecondary: '#e8edf4',
          borderRadius: 8,
          fontFamily: "Inter, 'PingFang SC', 'Microsoft YaHei', system-ui, -apple-system, sans-serif",
          controlHeight: 36,
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#0c1729',
          },
          Menu: {
            darkItemBg: '#0c1729',
            darkSubMenuItemBg: '#091321',
            darkItemSelectedBg: '#3568ed',
            darkItemColor: '#9aaac0',
            darkItemHoverColor: '#ffffff',
          },
          Table: {
            headerBg: '#f7f9fc',
            headerColor: '#475467',
          },
          Card: {
            boxShadowTertiary: 'none',
          },
        },
      }}
    >
      <AntdApp>
        <AuthProvider>
          <TabsProvider>
            <AppRouter />
          </TabsProvider>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
