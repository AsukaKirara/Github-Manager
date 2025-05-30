import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, GitBranch, Upload, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAppContext } from '../context/AppContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { accounts, activeAccountId } = useAppContext();
  
  const hasAccounts = accounts.length > 0;
  const activeAccount = accounts.find(account => account.id === activeAccountId);

  return (
    <div className="container mx-auto max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Welcome to GitHub Account Manager
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Manage multiple GitHub accounts, upload repositories, and streamline your workflow.
          </p>
          
          {!hasAccounts && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md p-4 mb-4">
              <p className="text-blue-800 dark:text-blue-300 text-sm">
                Get started by adding your first GitHub account with a Personal Access Token.
              </p>
              <Button 
                className="mt-3"
                onClick={() => navigate('/accounts')}
              >
                Add GitHub Account
              </Button>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="col-span-full md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">
            Quick Actions
          </h3>
          
          <div className="space-y-3">
            <Button 
              className="w-full justify-start" 
              onClick={() => navigate('/accounts')}
              disabled={false}
            >
              <Users className="mr-2 h-5 w-5" />
              Manage GitHub Accounts
            </Button>
            
            <Button 
              className="w-full justify-start" 
              onClick={() => navigate('/new-repository', { state: { initialMode: 'empty' } })}
              disabled={!hasAccounts}
            >
              <FileText className="mr-2 h-5 w-5" />
              Create Empty Repository
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/new-repository', { state: { initialMode: 'fromFiles' } })}
              disabled={!hasAccounts}
            >
              <Upload className="mr-2 h-5 w-5" />
              <span className="text-gray-800 dark:text-gray-200">Create From Existing Files</span>
            </Button>
          </div>
        </div>
        
        {/* Active Account */}
        <div className="col-span-full md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">
            Active Account
          </h3>
          
          {activeAccount ? (
            <div className="flex items-center space-x-4">
              {activeAccount.avatarUrl ? (
                <img 
                  src={activeAccount.avatarUrl} 
                  alt={activeAccount.username} 
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    {activeAccount.username.slice(0, 1).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {activeAccount.name || activeAccount.username}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{activeAccount.username}
                </p>
                <div className="mt-1 flex items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Token Validated
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No active account selected
              </p>
              <Button
                onClick={() => navigate('/accounts')}
                disabled={!hasAccounts}
              >
                <Plus className="mr-2 h-4 w-4" />
                {hasAccounts ? 'Select Account' : 'Add Account'}
              </Button>
            </div>
          )}
        </div>
        
        {/* Recently Used Accounts */}
        <div className="col-span-full md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">
            Your Accounts
          </h3>
          
          {accounts.length > 0 ? (
            <ul className="space-y-3">
              {accounts.map(account => (
                <li key={account.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {account.avatarUrl ? (
                      <img 
                        src={account.avatarUrl} 
                        alt={account.username} 
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {account.username.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-gray-700 dark:text-gray-300">
                      {account.username}
                    </span>
                  </div>
                  
                  {account.id === activeAccountId ? (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Active
                    </span>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => navigate('/accounts')}
                    >
                      <span className="text-gray-700 dark:text-gray-200">Switch</span>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 mb-3">
                No GitHub accounts added yet
              </p>
              <Button
                onClick={() => navigate('/accounts')}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;