export interface GitStatus {
  is_repo: boolean;
  branch: string;
  staged: number;
  unstaged: number;
  untracked: number;
  files: string[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
}
