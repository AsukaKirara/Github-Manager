import React, { createContext, useContext, useState, useEffect } from 'react';
import { encryptData, decryptData } from '../utils/encryption';
import { GithubAccount, Theme } from '../types';

interface AppContextType {
  accounts: GithubAccount[];
  addAccount: (account: GithubAccount) => void;
  removeAccount: (id: string) => void;
  updateAccount: (id: string, account: Partial<GithubAccount>) => void;
  activeAccountId: string | null;
  setActiveAccountId: (id: string | null) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<GithubAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('light');

  // Load accounts from localStorage on init
  useEffect(() => {
    const storedAccounts = localStorage.getItem('github_accounts');
    if (storedAccounts) {
      try {
        const decryptedAccounts = decryptData(storedAccounts);
        setAccounts(JSON.parse(decryptedAccounts));
      } catch (error) {
        console.error('Failed to load accounts:', error);
      }
    }

    const storedActiveId = localStorage.getItem('active_account_id');
    if (storedActiveId) {
      setActiveAccountId(storedActiveId);
    }

    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  // Save accounts to localStorage when they change
  useEffect(() => {
    if (accounts.length > 0) {
      const encryptedAccounts = encryptData(JSON.stringify(accounts));
      localStorage.setItem('github_accounts', encryptedAccounts);
    }
  }, [accounts]);

  // Save active account ID when it changes
  useEffect(() => {
    if (activeAccountId) {
      localStorage.setItem('active_account_id', activeAccountId);
    } else {
      localStorage.removeItem('active_account_id');
    }
  }, [activeAccountId]);

  const addAccount = (account: GithubAccount) => {
    setAccounts((prev) => [...prev, account]);
    // If this is the first account, make it active
    if (accounts.length === 0) {
      setActiveAccountId(account.id);
    }
  };

  const removeAccount = (id: string) => {
    setAccounts((prev) => prev.filter((account) => account.id !== id));
    // If active account is removed, set active to null or first available
    if (activeAccountId === id) {
      const remaining = accounts.filter((account) => account.id !== id);
      setActiveAccountId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const updateAccount = (id: string, updatedData: Partial<GithubAccount>) => {
    setAccounts((prev) =>
      prev.map((account) =>
        account.id === id ? { ...account, ...updatedData } : account
      )
    );
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <AppContext.Provider
      value={{
        accounts,
        addAccount,
        removeAccount,
        updateAccount,
        activeAccountId,
        setActiveAccountId,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};