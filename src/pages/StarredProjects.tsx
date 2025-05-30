import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  fetchStarredRepositories,
  fetchUserOrganizations,
  forkRepository,
} from '../utils/github';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toaster';
import { GithubAccount } from '../types';

interface StarRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  owner: { login: string };
}

interface StarRepoWithAccount extends StarRepo {
  account: GithubAccount;
}

interface Org {
  id: number;
  login: string;
}

const StarredProjects: React.FC = () => {
  const { accounts } = useAppContext();
  const { addToast } = useToast();
  const [repos, setRepos] = useState<StarRepoWithAccount[]>([]);
  const [orgsMap, setOrgsMap] = useState<Record<string, Org[]>>({});
  const [targets, setTargets] = useState<Record<number, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const repoPromises = accounts.map(acc =>
          fetchStarredRepositories(acc.token).then(list =>
            list.map((r: StarRepo) => ({ ...r, account: acc }))
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
    };
    load();
  }, [accounts]);

  const handleFork = async (repo: StarRepoWithAccount) => {
    const value = targets[repo.id];
    if (!value) return;
    const [accountId, org] = value.split(':');
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    try {
      await forkRepository(account, repo.owner.login, repo.name, org || undefined);
      addToast({ title: 'Fork initiated', type: 'success' });
    } catch (error) {
      addToast({
        title: 'Fork failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    }
  };

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Starred Projects
        </h2>
        {repos.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">No starred repositories found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Account Owner
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Repository
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Link
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Fork Target
                  </th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {repos.map(repo => (
                  <tr key={`${repo.account.id}-${repo.id}`}>
                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                      {repo.account.username}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                      {repo.full_name}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View
                      </a>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <select
                        value={targets[repo.id] || ''}
                        onChange={e =>
                          setTargets({ ...targets, [repo.id]: e.target.value })
                        }
                        className="border rounded-md text-xs px-1 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Select...</option>
                        {accounts.map(acc => (
                          <React.Fragment key={acc.id}>
                            <option value={acc.id}>{acc.username}</option>
                            {(orgsMap[acc.id] || []).map(org => (
                              <option
                                key={`${acc.id}:${org.login}`}
                                value={`${acc.id}:${org.login}`}
                              >
                                {acc.username}/{org.login}
                              </option>
                            ))}
                          </React.Fragment>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <Button
                        size="sm"
                        onClick={() => handleFork(repo)}
                        disabled={!targets[repo.id]}
                      >
                        Fork
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StarredProjects;
