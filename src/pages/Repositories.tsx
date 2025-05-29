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

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
}

interface Org {
  id: number;
  login: string;
}

const Repositories: React.FC = () => {
  const { accounts, activeAccountId } = useAppContext();
  const activeAccount = accounts.find(a => a.id === activeAccountId);
  const { addToast } = useToast();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [transferTargets, setTransferTargets] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!activeAccount) return;
    fetchUserRepositories(activeAccount.token)
      .then(setRepos)
      .catch(err => console.error(err));
    fetchUserOrganizations(activeAccount.token)
      .then(setOrgs)
      .catch(err => console.error(err));
  }, [activeAccount]);

  if (!activeAccount) {
    return (
      <div className="container mx-auto max-w-4xl p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">Select an account first.</p>
      </div>
    );
  }

  const handleDelete = async (name: string) => {
    try {
      await deleteRepository(activeAccount, name);
      setRepos(repos.filter(r => r.name !== name));
      addToast({ title: 'Repository deleted', type: 'info' });
    } catch (error) {
      addToast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    }
  };

  const handleTransfer = async (name: string) => {
    const target = transferTargets[name];
    if (!target) return;
    try {
      await transferRepository(activeAccount, name, target);
      addToast({ title: 'Repository transferred', type: 'success' });
    } catch (error) {
      addToast({
        title: 'Transfer failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    }
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Repositories
        </h2>
        {repos.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No repositories found.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {repos.map(repo => (
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
                  {repo.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {repo.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={transferTargets[repo.name] || ''}
                    onChange={e =>
                      setTransferTargets({
                        ...transferTargets,
                        [repo.name]: e.target.value,
                      })
                    }
                    className="border rounded-md text-sm px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Transfer to...</option>
                    {orgs.map(org => (
                      <option key={org.id} value={org.login}>
                        {org.login}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTransfer(repo.name)}
                    disabled={!transferTargets[repo.name]}
                  >
                    Transfer
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(repo.name)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Repositories;
