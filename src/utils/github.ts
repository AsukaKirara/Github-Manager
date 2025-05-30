import { GithubAccount, Repository, FileEntry } from '../types';

export const fetchUserData = async (token: string) => {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return response.json();
};

export const fetchUserRepositories = async (token: string) => {
  const response = await fetch('https://api.github.com/user/repos', {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return response.json();
};

export const createRepository = async (
  account: GithubAccount,
  repository: Repository,
  autoInit = false
) => {
  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `token ${account.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repository.name,
      description: repository.description,
      private: repository.visibility === 'private',
      auto_init: autoInit,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `GitHub API error: ${response.statusText}`
    );
  }

  return response.json();
};

const toBase64 = (content: string): string => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(content, 'utf-8').toString('base64');
  }
  // Browser fallback
  return btoa(unescape(encodeURIComponent(content)));
};

export const createCommit = async (
  account: GithubAccount,
  repoName: string,
  branch: string,
  message: string,
  files: FileEntry[]
) => {
  const encodedRepo = encodeURIComponent(repoName);
  const encodedBranch = encodeURIComponent(branch);
  // This is a simplified version - in a real app this would be more complex
  // as it would need to handle multiple files, directories, etc.
  
  // First, check if the repository exists
  const repoResponse = await fetch(`https://api.github.com/repos/${account.username}/${encodedRepo}`, {
    headers: {
      Authorization: `token ${account.token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!repoResponse.ok) {
    throw new Error(`Repository not found: ${repoName}`);
  }

  // Create a new tree with the files
  const treeItems = await Promise.all(
    files
      .filter(file => file.type === 'file')
      .map(async file => {
        // Create a blob for the file
        const blobResponse = await fetch(`https://api.github.com/repos/${account.username}/${encodedRepo}/git/blobs`, {
          method: 'POST',
          headers: {
            Authorization: `token ${account.token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: toBase64(typeof file.content === 'string' ? file.content : ''),
            encoding: 'base64',
          }),
        });

        if (!blobResponse.ok) {
          const errorText = await blobResponse.text();
          throw new Error(`Failed to create blob for ${file.path}: ${errorText}`);
        }

        const blobData = await blobResponse.json();

        return {
          path: file.path,
          mode: '100644', // Regular file
          type: 'blob',
          sha: blobData.sha,
        };
      })
  );

  // Get the SHA of the current branch
  const refResponse = await fetch(
    `https://api.github.com/repos/${account.username}/${encodedRepo}/git/refs/heads/${encodedBranch}`,
    {
      headers: {
        Authorization: `token ${account.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  // If the branch doesn't exist yet, we'll create it based on the default branch
  let baseSha: string | undefined;
  if (!refResponse.ok) {
    // Get the default branch
    const defaultBranchResponse = await fetch(
      `https://api.github.com/repos/${account.username}/${encodedRepo}`,
      {
        headers: {
          Authorization: `token ${account.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    
    if (!defaultBranchResponse.ok) {
      throw new Error(`Failed to get repository information`);
    }
    
    const repoInfo = await defaultBranchResponse.json();
    const defaultBranch = repoInfo.default_branch;
    
    // Get the SHA of the default branch
    const defaultBranchResponse2 = await fetch(
      `https://api.github.com/repos/${account.username}/${encodedRepo}/git/refs/heads/${defaultBranch}`,
      {
        headers: {
          Authorization: `token ${account.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    

    if (!defaultBranchResponse2.ok) {
      baseSha = undefined;
    } else {
      const defaultBranchData = await defaultBranchResponse2.json();
      baseSha = defaultBranchData.object.sha;
    }
  } else {
    const refData = await refResponse.json();
    baseSha = refData.object.sha;
  }

  // Create a new tree
  const treeBody: any = { tree: treeItems };
  if (baseSha) treeBody.base_tree = baseSha;

  const treeResponse = await fetch(
    `https://api.github.com/repos/${account.username}/${encodedRepo}/git/trees`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${account.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(treeBody),
    }
  );

  if (!treeResponse.ok) {
    throw new Error(`Failed to create tree`);
  }

  const treeData = await treeResponse.json();

  // Create a commit
  const commitBody: any = { message, tree: treeData.sha };
  if (baseSha) commitBody.parents = [baseSha];

  const commitResponse = await fetch(
    `https://api.github.com/repos/${account.username}/${encodedRepo}/git/commits`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${account.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commitBody),
    }
  );

  if (!commitResponse.ok) {
    throw new Error(`Failed to create commit`);
  }

  const commitData = await commitResponse.json();

  // Update or create the reference
  const updateRefUrl = refResponse.ok
    ? `https://api.github.com/repos/${account.username}/${encodedRepo}/git/refs/heads/${encodedBranch}`
    : `https://api.github.com/repos/${account.username}/${encodedRepo}/git/refs`;
  const updateRefMethod = refResponse.ok ? 'PATCH' : 'POST';
  const updateRefBody = refResponse.ok
    ? { sha: commitData.sha, force: false }
    : { ref: `refs/heads/${branch}`, sha: commitData.sha };

  const updateRefResponse = await fetch(updateRefUrl, {
    method: updateRefMethod,
    headers: {
      Authorization: `token ${account.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateRefBody),
  });

  if (!updateRefResponse.ok) {
    throw new Error(`Failed to update reference`);
  }

  return updateRefResponse.json();
};

export const fetchUserOrganizations = async (token: string) => {
  const response = await fetch('https://api.github.com/user/orgs', {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return response.json();
};

export const deleteRepository = async (
  account: GithubAccount,
  repoName: string
) => {
  const encodedRepo = encodeURIComponent(repoName);
  const response = await fetch(
    `https://api.github.com/repos/${account.username}/${encodedRepo}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `token ${account.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `GitHub API error: ${response.statusText}`);
  }

  return true;
};

export const transferRepository = async (
  account: GithubAccount,
  repoName: string,
  newOwner: string
) => {
  const encodedRepo = encodeURIComponent(repoName);
  const response = await fetch(
    `https://api.github.com/repos/${account.username}/${encodedRepo}/transfer`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${account.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ new_owner: newOwner }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `GitHub API error: ${response.statusText}`);
  }

  return response.json();
};
