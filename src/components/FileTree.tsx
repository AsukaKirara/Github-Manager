import React from 'react';

import { FileEntry } from '../types';
import { Folder, File as FileIcon } from 'lucide-react';

export interface FileTreeProps {
  entries: FileEntry[];
  basePath?: string;
  showCheckboxes?: boolean;
  selectedFiles?: string[];
  onToggleFile?: (path: string, checked: boolean, isDir?: boolean) => void;
  highlightSelected?: boolean;
}

const FileTree: React.FC<FileTreeProps> = ({
  entries,
  basePath = '',
  showCheckboxes = false,
  selectedFiles = [],
  onToggleFile,
  highlightSelected = false,
}) => {
  const gatherFilePaths = (entry: FileEntry, base = ''): string[] => {
    const full = base ? `${base}/${entry.path}` : entry.path;
    if (entry.type === 'file') return [full];
    let paths: string[] = [];
    if (entry.children) {
      for (const child of entry.children) {
        paths = paths.concat(gatherFilePaths(child, full));
      }
    }
    return paths;
  };

  const isDirChecked = (entry: FileEntry, base = '') => {
    const paths = gatherFilePaths(entry, base);
    return paths.length > 0 && paths.every((p) => selectedFiles.includes(p));
  };

  return (
    <ul className="ml-4 space-y-1">
      {entries.map((entry) => {
        const fullPath = basePath ? `${basePath}${entry.path}` : entry.path;
        if (entry.type === 'file') {
          return (
            <li
              key={fullPath}
              className={`flex items-center space-x-1 ${
                highlightSelected && selectedFiles.includes(fullPath)
                  ? 'text-blue-600'
                  : ''
              }`}
            >
              {showCheckboxes && (
                <input
                  type="checkbox"
                  className="h-4 w-4 mr-1"
                  checked={selectedFiles.includes(fullPath)}
                  onChange={(e) =>
                    onToggleFile?.(fullPath, e.target.checked, false)
                  }
                />
              )}
              <FileIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{entry.path}</span>
            </li>
          );
        }
        return (
          <li key={fullPath} className="space-y-1">
            <div className="flex items-center space-x-1">
              {showCheckboxes && (
                <input
                  type="checkbox"
                  className="h-4 w-4 mr-1"
                  checked={isDirChecked(entry, basePath?.replace(/\/$/, ''))}
                  onChange={(e) =>
                    onToggleFile?.(fullPath, e.target.checked, true)
                  }
                />
              )}
              <Folder className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">{entry.path}</span>
            </div>
            {entry.children && (
              <FileTree
                entries={entry.children}
                basePath={`${fullPath}/`}
                showCheckboxes={showCheckboxes}
                selectedFiles={selectedFiles}
                onToggleFile={onToggleFile}
                highlightSelected={highlightSelected}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default FileTree;

