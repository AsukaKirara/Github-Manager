import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppContext } from '../../context/AppContext';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { theme } = useAppContext();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/accounts':
        return 'Manage Accounts';
      case '/new-repository':
        return 'Create Repository';
      case '/starred-projects':
        return 'Starred Projects';
      case '/settings':
        return 'Settings';
      default:
        return 'GitHub Account Manager';
    }
  };

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={getPageTitle()} />
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;