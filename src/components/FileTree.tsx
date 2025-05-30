import React, { useState } from 'react';

import { FileEntry } from '../types';
import { Folder, File as FileIcon, ChevronRight, ChevronDown } from 'lucide-react';

export interface FileTreeProps {
  entries: FileEntry[];
  basePath?: string;
  showCheckboxes?: boolean;
  selectedFiles?: string[];
  onToggleFile?: (path: string, checked: boolean, isDir?: boolean) => void;
  highlightSelected?: boolean;
  onSelectFile?: (file: FileEntry) => void;
  initiallyCollapsed?: boolean;
}

const FileTree: React.FC<FileTreeProps> = ({
  entries,
  basePath = '',
  showCheckboxes = false,
  selectedFiles = [],
  onToggleFile,
  highlightSelected = false,
  onSelectFile,
  initiallyCollapsed = true,
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

  // Sort entries: directories first, then files, both alphabetically
  const sortedEntries = React.useMemo(() => {
    return [...entries].sort((a, b) => {
      // If types are different, directories come first
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      // If types are the same, sort alphabetically
      return a.path.localeCompare(b.path);
    });
  }, [entries]);

  return (
    <ul className="space-y-1">
      {sortedEntries.map((entry) => {
        const fullPath = basePath ? `${basePath}/${entry.path}` : entry.path;
        
        if (entry.type === 'file') {
          return (
            <li
              key={fullPath}
              className={`flex items-center space-x-1 py-1 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                highlightSelected && selectedFiles.includes(fullPath)
                  ? 'text-blue-600 dark:text-blue-400'
                  : ''
              }`}
              onClick={() => onSelectFile && onSelectFile(entry)}
            >
              {showCheckboxes && (
                <input
                  type="checkbox"
                  className="h-4 w-4 mr-1 text-blue-600 focus:ring-blue-500"
                  checked={selectedFiles.includes(fullPath)}
                  onChange={(e) =>
                    onToggleFile?.(fullPath, e.target.checked, false)
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <FileIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="text-sm truncate">{entry.path}</span>
            </li>
          );
        }
        
        return <FolderItem 
          key={fullPath}
          entry={entry}
          fullPath={fullPath}
          basePath={basePath}
          showCheckboxes={showCheckboxes}
          selectedFiles={selectedFiles}
          onToggleFile={onToggleFile}
          highlightSelected={highlightSelected}
          onSelectFile={onSelectFile}
          isDirChecked={() => isDirChecked(entry, basePath?.replace(/\/$/, ''))}
          initiallyCollapsed={initiallyCollapsed}
        />;
      })}
    </ul>
  );
};

interface FolderItemProps {
  entry: FileEntry;
  fullPath: string;
  basePath: string;
  showCheckboxes: boolean;
  selectedFiles: string[];
  onToggleFile?: (path: string, checked: boolean, isDir?: boolean) => void;
  highlightSelected: boolean;
  onSelectFile?: (file: FileEntry) => void;
  isDirChecked: () => boolean;
  initiallyCollapsed: boolean;
}

const FolderItem: React.FC<FolderItemProps> = ({
  entry,
  fullPath,
  basePath,
  showCheckboxes,
  selectedFiles,
  onToggleFile,
  highlightSelected,
  onSelectFile,
  isDirChecked,
  initiallyCollapsed,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);
  
  return (
    <li className="space-y-1">
      <div 
        className="flex items-center space-x-1 py-1 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="text-gray-500 dark:text-gray-400">
          {isCollapsed ? 
            <ChevronRight className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
          }
        </span>
        
        {showCheckboxes && (
          <input
            type="checkbox"
            className="h-4 w-4 mr-1 text-blue-600 focus:ring-blue-500"
            checked={isDirChecked()}
            onChange={(e) =>
              onToggleFile?.(fullPath, e.target.checked, true)
            }
            onClick={(e) => e.stopPropagation()}
          />
        )}
        
        <Folder className="h-4 w-4 text-gray-600 dark:text-gray-300 flex-shrink-0" />
        <span className="text-sm font-medium truncate">{entry.path}</span>
      </div>
      
      {!isCollapsed && entry.children && (
        <div className="ml-6">
          <FileTree
            entries={entry.children}
            basePath={`${fullPath}`}
            showCheckboxes={showCheckboxes}
            selectedFiles={selectedFiles}
            onToggleFile={onToggleFile}
            highlightSelected={highlightSelected}
            onSelectFile={onSelectFile}
            initiallyCollapsed={initiallyCollapsed}
          />
        </div>
      )}
    </li>
  );
};

export default FileTree;

