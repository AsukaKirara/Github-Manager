import { GithubAccount } from '../types';

export const validateGithubToken = async (token: string): Promise<{ 
  valid: boolean; 
  userData?: { 
    username: string; 
    name?: string; 
    email?: string; 
    avatarUrl?: string; 
  }; 
  error?: string 
}> => {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { valid: false, error: 'Invalid authentication token' };
      }
      return { valid: false, error: `GitHub API error: ${response.statusText}` };
    }

    const data = await response.json();
    
    return {
      valid: true,
      userData: {
        username: data.login,
        name: data.name,
        email: data.email,
        avatarUrl: data.avatar_url,
      },
    };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

export const validateRepositoryName = (name: string): boolean => {
  // GitHub repository naming rules
  const regex = /^[a-zA-Z0-9._-]+$/;
  return regex.test(name) && name.length > 0 && name.length <= 100;
};

export const findDuplicateAccount = (
  accounts: GithubAccount[], 
  username: string
): GithubAccount | undefined => {
  return accounts.find(account => account.username === username);
};