import React, { useState } from 'react';
import { Shield, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/ui/Toaster';

const Settings: React.FC = () => {
  const { toggleTheme, theme } = useAppContext();
  const { addToast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);
  
  const clearAllData = () => {
    // Clear all local storage data
    localStorage.clear();
    
    // Show success message
    addToast({
      title: 'Data cleared',
      description: 'All application data has been removed. The page will reload.',
      type: 'info',
    });
    
    // Reload the page after a brief delay
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Settings
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">
              Appearance
            </h3>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Theme
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose between light and dark theme
                </p>
              </div>
              <div>
                <Button 
                  variant="outline"
                  onClick={toggleTheme}
                >
                  {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                </Button>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">
              Security
            </h3>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Security Information
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      This application stores your GitHub Personal Access Tokens locally in your browser's storage.
                      While we encrypt this data, it's important to:
                    </p>
                    <ul className="list-disc list-inside mt-2">
                      <li>Use tokens with minimal required permissions</li>
                      <li>Regularly rotate your tokens for better security</li>
                      <li>Remove accounts when no longer needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">
              Data Management
            </h3>
            
            <div className="py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Clear All Data
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Remove all accounts and application data
                  </p>
                </div>
                <div>
                  {!confirmClear ? (
                    <Button 
                      variant="destructive"
                      onClick={() => setConfirmClear(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Data
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline"
                        onClick={() => setConfirmClear(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={clearAllData}
                      >
                        Confirm Clear
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {confirmClear && (
                <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        This will permanently remove all your GitHub accounts and settings from this application.
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">
              About
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
              <p className="text-sm text-gray-800 dark:text-gray-200">
                GitHub Account Manager v0.1.0
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                A local web application for managing multiple GitHub accounts and repository operations.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                Built with React, TypeScript, and Tailwind CSS.
                Your data never leaves your browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;