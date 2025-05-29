export type Theme = 'light' | 'dark';

export interface GithubAccount {
  id: string;
  username: string;
  token: string;
  avatarUrl?: string;
  name?: string;
  email?: string;
  validated: boolean;
  createdAt: string;
  lastUsed?: string;
}

export interface Repository {
  name: string;
  description: string;
  visibility: 'public' | 'private';
  defaultBranch: string;
  files: FileEntry[];
}

export interface FileEntry {
  path: string;
  type: 'file' | 'directory';
  content?: string;
  size?: number;
  children?: FileEntry[];
}

export interface CommitDetails {
  message: string;
  description?: string;
  files: string[];
  ignore: string[];
}

export type Toast = {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
};

export interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
}

export interface AuthContextType extends AuthState {
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  initialize: (password: string) => Promise<void>;
  isInitialized: boolean;
}