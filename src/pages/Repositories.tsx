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
          setRepos(r.map(repo => ({ ...repo, account: activeAccount })));
          setOrgsMap({ [activeAccount.id]: o });
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          const repoPromises = accounts.map(acc =>
            fetchUserRepositories(acc.token).then(list =>
              list.map(repo => ({ ...repo, account: acc }))
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

  const renderRepoItem = (repo: RepoWithAccount) => (
    <li key={repo.id} className="py-4 flex justify-between items-center">
      <div>
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {repo.full_name}
        </a>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {repo.account.username}
        </p>
        {repo.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {repo.description}
          </p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <select
          value={transferTargets[repo.full_name] || ''}
          onChange={e =>
            setTransferTargets({
              ...transferTargets,
              [repo.full_name]: e.target.value,
            })
          }
          className="border rounded-md text-sm px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">Transfer to...</option>
          {(orgsMap[repo.account.id] || []).map(org => (
            <option key={org.id} value={org.login}>
              {org.login}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleTransfer(repo)}
          disabled={!transferTargets[repo.full_name]}
        >
          Transfer
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleDelete(repo)}
        >
          Delete
        </Button>
      </div>
    </li>
  );

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4">
            <button
              className={`px-3 py-2 text-sm font-medium border-b-2 focus:outline-none ${
                viewMode === 'active'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setViewMode('active')}
            >
              Active Account
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium border-b-2 focus:outline-none ${
                viewMode === 'all'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
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
          <p className="text-gray-500 dark:text-gray-400">No repositories found.</p>
        ) : viewMode === 'all' ? (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${accounts.length}, minmax(0, 1fr))` }}
          >
            {accounts.map(acc => {
              const list = repos.filter(r => r.account.id === acc.id);
              return (
                <div key={acc.id} className="border rounded-md p-4">
                  <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">
                    {acc.username}
                  </h3>
                  {list.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No repositories</p>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {list.map(renderRepoItem)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {repos.map(renderRepoItem)}

          </ul>
        )}
      </div>
    </div>
  );
};

export default Repositories;
