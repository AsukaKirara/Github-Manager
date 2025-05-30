import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users,
  GitBranch,
  Star,
  Settings,
  Github
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const Sidebar: React.FC = () => {
  const { accounts } = useAppContext();
  
  const navItems = [
    { to: '/', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
    { to: '/accounts', icon: <Users className="h-5 w-5" />, label: 'Accounts' },
    { to: '/repositories', icon: <Github className="h-5 w-5" />, label: 'Repositories' },
    { to: '/starred-projects', icon: <Star className="h-5 w-5" />, label: 'Starred Projects' },
    { to: '/new-repository', icon: <GitBranch className="h-5 w-5" />, label: 'New Repository' },
    { to: '/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-gray-900 dark:bg-gray-950 text-white flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Github className="h-8 w-8" />
          <h1 className="text-xl font-bold">GitHub Manager</h1>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => 
                  `flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-gray-800 dark:bg-gray-800 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 dark:hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-800 dark:border-gray-700">
        <div className="text-sm text-gray-400 mb-2">Accounts ({accounts.length})</div>
        {accounts.length > 0 ? (
          <ul className="space-y-1">
            {accounts.slice(0, 3).map((account) => (
              <li key={account.id} className="flex items-center space-x-2">
                {account.avatarUrl ? (
                  <img 
                    src={account.avatarUrl} 
                    alt={account.username} 
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-xs text-white">
                      {account.username.slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm text-gray-300 truncate">
                  {account.username}
                </span>
              </li>
            ))}
            {accounts.length > 3 && (
              <li className="text-xs text-gray-400 pl-8">
                +{accounts.length - 3} more
              </li>
            )}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">No accounts added</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
