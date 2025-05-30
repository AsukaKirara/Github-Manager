import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  fetchUserRepositories,
  deleteRepository,
  fetchUserOrganizations,
  transferRepository,
} from '../utils/github';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toaster';
import { GithubAccount } from '../types';

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
}

interface RepoWithAccount extends Repo {
  account: GithubAccount;
}

interface Org {
  id: number;
  login: string;
}

const Repositories: React.FC = () => {
  const { accounts, activeAccountId } = useAppContext();
  const activeAccount = accounts.find(a => a.id === activeAccountId);
  const { addToast } = useToast();
  const [viewMode, setViewMode] = useState<'active' | 'all'>('active');
  const [repos, setRepos] = useState<RepoWithAccount[]>([]);
  const [orgsMap, setOrgsMap] = useState<Record<string, Org[]>>({});
  const [transferTargets, setTransferTargets] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      if (viewMode === 'active') {
        if (!activeAccount) {
          setRepos([]);
          setOrgsMap({});
          return;
        }
        try {
          const [r, o] = await Promise.all([
            fetchUserRepositories(activeAccount.token),
            fetchUserOrganizations(activeAccount.token),
          ]);
          setRepos(r.map((repo: Repo) => ({ ...repo, account: activeAccount })));
          setOrgsMap({ [activeAccount.id]: o });
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          const repoPromises = accounts.map(acc =>
            fetchUserRepositories(acc.token).then(list =>
              list.map((repo: Repo) => ({ ...repo, account: acc }))
            )
          );
          const orgPromises = accounts.map(acc =>
            fetchUserOrganizations(acc.token).then(orgs => [acc.id, orgs] as const)
          );
          const [repoResults, orgResults] = await Promise.all([
            Promise.all(repoPromises),
            Promise.all(orgPromises),
          ]);
          setRepos(repoResults.flat());
          const map: Record<string, Org[]> = {};
          for (const [id, list] of orgResults) {
            map[id] = list;
          }
          setOrgsMap(map);
        } catch (err) {
          console.error(err);
        }
      }
    };

    load();
  }, [viewMode, activeAccount, accounts]);


  if (viewMode === 'active' && !activeAccount) {
    return (
      <div className="container mx-auto max-w-4xl p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">Select an account first.</p>
      </div>
    );
  }

  const handleDelete = async (repo: RepoWithAccount) => {
    try {
      await deleteRepository(repo.account, repo.name);
      setRepos(repos.filter(r => r.id !== repo.id));
      addToast({ title: 'Repository deleted', type: 'info' });
    } catch (error) {
      addToast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    }
  };

  const handleTransfer = async (repo: RepoWithAccount) => {
    const target = transferTargets[repo.full_name];
    if (!target) return;
    try {
      await transferRepository(repo.account, repo.name, target);
      addToast({ title: 'Repository transferred', type: 'success' });
    } catch (error) {
      addToast({
        title: 'Transfer failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    }
  };

  const renderRepoItem = (repo: RepoWithAccount, isCompact: boolean = false) => (
    <li key={repo.id} className={`py-3 ${isCompact ? '' : 'flex flex-col md:flex-row md:justify-between md:items-center gap-2'}`}>
      <div className="flex-1 min-w-0">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium truncate block"
        >
          {isCompact ? repo.name : repo.full_name}
        </a>
        {!isCompact && (
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {repo.account.username}
          </p>
        )}
        {repo.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
            {repo.description}
          </p>
        )}
      </div>
      <div className={`flex ${isCompact ? 'flex-col' : 'flex-row'} items-center gap-2 mt-2 md:mt-0`}>
        <select
          value={transferTargets[repo.full_name] || ''}
          onChange={e =>
            setTransferTargets({
              ...transferTargets,
              [repo.full_name]: e.target.value,
            })
          }
          className="border rounded-md text-xs px-1 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full"
        >
          <option value="">Transfer to...</option>
          {(orgsMap[repo.account.id] || []).map(org => (
            <option key={org.id} value={org.login}>
              {org.login}
            </option>
          ))}
        </select>
        <div className={`flex ${isCompact ? 'w-full' : ''} gap-1`}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTransfer(repo)}
            disabled={!transferTargets[repo.full_name]}
            className={isCompact ? 'flex-1' : ''}
          >
            <span className="text-gray-800 dark:text-gray-200">Transfer</span>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(repo)}
            className={isCompact ? 'flex-1' : ''}
          >
            Delete
          </Button>
        </div>
      </div>
    </li>
  );


  const reposByAccount = repos.reduce<Record<string, RepoWithAccount[]>>(
    (acc, repo) => {
      (acc[repo.account.id] ||= []).push(repo);
      return acc;
    },
    {}
  );

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4">
            <button
              className={`px-3 py-2 text-sm font-medium border-b-2 focus:outline-none ${
                viewMode === 'active'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'
              }`}
              onClick={() => setViewMode('active')}
            >
              Active Account
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium border-b-2 focus:outline-none ${
                viewMode === 'all'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'
              }`}
              onClick={() => setViewMode('all')}
            >
              All Accounts
            </button>
          </nav>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Repositories
        </h2>
        {repos.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">No repositories found.</p>

        ) : viewMode === 'active' ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {repos.map(repo => renderRepoItem(repo))}
          </ul>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(acc => (
              <div key={acc.id} className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 h-full border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-2 text-sm">
                  {acc.username}
                </h3>
                {reposByAccount[acc.id]?.length ? (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {(reposByAccount[acc.id] || []).map(repo => renderRepoItem(repo, true))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-600 dark:text-gray-300">No repositories</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Repositories;
