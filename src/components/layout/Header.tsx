import React from 'react';
import { Moon, Sun, Github } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAppContext } from '../../context/AppContext';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { theme, toggleTheme, accounts, activeAccountId } = useAppContext();
  
  const activeAccount = accounts.find(account => account.id === activeAccountId);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Github className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {activeAccount && (
          <div className="flex items-center space-x-2">
            {activeAccount.avatarUrl ? (
              <img 
                src={activeAccount.avatarUrl} 
                alt={activeAccount.username} 
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {activeAccount.username.slice(0, 1).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {activeAccount.username}
            </span>
          </div>
        )}
        
        <Button 
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
};

export default Header;