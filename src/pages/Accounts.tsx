import React, { useState } from 'react';
import { Plus, Trash2, Check, X, RefreshCw, Key } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAppContext } from '../context/AppContext';
import { validateGithubToken } from '../utils/validation';
import { GithubAccount } from '../types';
import { useToast } from '../components/ui/Toaster';

const Accounts: React.FC = () => {
  const { accounts, addAccount, removeAccount, activeAccountId, setActiveAccountId } = useAppContext();
  const { addToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddAccount = async () => {
    if (!tokenInput.trim()) {
      setValidationError('Please enter a valid GitHub token');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await validateGithubToken(tokenInput);
      
      if (!result.valid || !result.userData) {
        setValidationError(result.error || 'Invalid token or unable to authenticate');
        return;
      }

      // Check for duplicate accounts
      const existingAccount = accounts.find(
        account => account.username === result.userData!.username
      );

      if (existingAccount) {
        setValidationError(`Account for ${result.userData.username} already exists`);
        return;
      }

      // Create new account
      const newAccount: GithubAccount = {
        id: crypto.randomUUID(),
        username: result.userData.username,
        token: tokenInput,
        avatarUrl: result.userData.avatarUrl,
        name: result.userData.name,
        email: result.userData.email,
        validated: true,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      };

      addAccount(newAccount);
      addToast({
        title: 'Account added successfully',
        description: `GitHub account for ${result.userData.username} has been added`,
        type: 'success',
      });

      // Clear form and close
      setTokenInput('');
      setIsAdding(false);
    } catch (error) {
      setValidationError('An error occurred while validating the token');
      console.error(error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveAccount = (id: string, username: string) => {
    removeAccount(id);
    addToast({
      title: 'Account removed',
      description: `GitHub account for ${username} has been removed`,
      type: 'info',
    });
  };

  const handleSetActive = (id: string, username: string) => {
    setActiveAccountId(id);
    addToast({
      title: 'Active account changed',
      description: `${username} is now your active GitHub account`,
      type: 'success',
    });
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            GitHub Accounts
          </h2>
          <Button onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </>
            )}
          </Button>
        </div>

        {isAdding && (
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-3">
              Add GitHub Account
            </h3>
            <div className="mb-4">
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Personal Access Token
              </label>
              <div className="flex">
                <input
                  type="password"
                  id="token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxx"
                  className="flex-1 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isValidating}
                />
                <Button 
                  onClick={handleAddAccount}
                  disabled={isValidating || !tokenInput.trim()}
                  className="rounded-l-none"
                >
                  {isValidating ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="mr-2 h-4 w-4" />
                  )}
                  Validate & Add
                </Button>
              </div>
              {validationError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {validationError}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                The token needs <code>repo</code> and <code>user</code> scopes. <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Create a new token</a>
              </p>
            </div>
          </div>
        )}

        {accounts.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {accounts.map((account) => (
              <li key={account.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {account.avatarUrl ? (
                      <img 
                        src={account.avatarUrl} 
                        alt={account.username} 
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {account.username.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {account.name || account.username}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{account.username}
                      </p>
                    </div>
                    {account.validated && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <Check className="mr-1 h-3 w-3" />
                        Validated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {account.id === activeAccountId ? (
                      <Button variant="secondary\" disabled>
                        <Check className="mr-2 h-4 w-4" />
                        Active
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={() => handleSetActive(account.id, account.username)}
                      >
                        Set Active
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      onClick={() => handleRemoveAccount(account.id, account.username)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <Key className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No accounts added</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add your first GitHub account to get started
            </p>
            {!isAdding && (
              <Button className="mt-4" onClick={() => setIsAdding(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add GitHub Account
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounts;