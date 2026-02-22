import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';

const Layout = lazy(() => import('./components/layout/Layout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Settings = lazy(() => import('./pages/Settings'));
const ApiProxy = lazy(() => import('./pages/ApiProxy'));
const Monitor = lazy(() => import('./pages/Monitor'));
import ThemeManager from './components/common/ThemeManager';
import { useConfigStore } from './stores/useConfigStore';
import { useAccountStore } from './stores/useAccountStore';
import { useTranslation } from 'react-i18next';
import { listen } from '@tauri-apps/api/event';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'accounts',
        element: <Accounts />,
      },
      {
        path: 'api-proxy',
        element: <ApiProxy />,
      },
      {
        path: 'monitor',
        element: <Monitor />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

function App() {
  const { config } = useConfigStore();
  const { fetchCurrentAccount, fetchAccounts } = useAccountStore();
  const { i18n } = useTranslation();

  // Sync language from config
  useEffect(() => {
    if (config?.language) {
      i18n.changeLanguage(config.language);
    }
  }, [config?.language, i18n]);

  // Listen for tray events
  useEffect(() => {
    const refreshFromTray = () => {
      console.log('[App] Tray event received, refreshing account state...');
      void Promise.all([
        fetchCurrentAccount(),
        fetchAccounts(),
      ]);
    };

    const unlistenPromises: Promise<() => void>[] = [];

    // 监听托盘切换账号事件
    unlistenPromises.push(
      listen('tray://account-switched', refreshFromTray)
    );

    // 监听托盘刷新事件
    unlistenPromises.push(
      listen('tray://refresh-current', refreshFromTray)
    );

    // Cleanup
    return () => {
      void Promise.allSettled(unlistenPromises).then(results => {
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            result.value();
          }
        });
      });
    };
  }, [fetchCurrentAccount, fetchAccounts]);

  return (
    <>
      <ThemeManager />
      <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-sm text-gray-500">Loading...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </>
  );
}

export default App;
