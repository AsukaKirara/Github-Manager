import React from 'react';

import { FileEntry } from '../types';
import { Folder, File as FileIcon } from 'lucide-react';

export interface FileTreeProps {
  entries: FileEntry[];
  basePath?: string;
  showCheckboxes?: boolean;
  selectedFiles?: string[];
  onToggleFile?: (path: string, checked: boolean) => void;
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
                  onChange={(e) => onToggleFile?.(fullPath, e.target.checked)}
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

