import React from 'react';
import { Folder, FileText } from 'lucide-react';
import { FileEntry } from '../types';

interface FileTreeProps {
  entries: FileEntry[];
  onSelectFile?: (file: FileEntry) => void;
  selectedPaths?: string[];
  onToggleSelect?: (path: string, checked: boolean) => void;
  level?: number;
}

const FileTree: React.FC<FileTreeProps> = ({
  entries,
  onSelectFile,
  selectedPaths = [],
  onToggleSelect,
  level = 0,
}) => {
  return (
    <ul className={level === 0 ? 'space-y-1' : 'space-y-1 pl-4'}>
      {entries.map((entry, idx) => (
        <li key={idx}>
          <div className="flex items-center">
            {entry.type === 'directory' ? (
              <Folder className="h-4 w-4 mr-1 text-gray-500" />
            ) : (
              <FileText className="h-4 w-4 mr-1 text-gray-500" />
            )}
            {entry.type === 'file' && onToggleSelect && (
              <input
                type="checkbox"
                className="mr-1 h-3 w-3"
                checked={selectedPaths.includes(entry.path)}
                onChange={(e) => onToggleSelect(entry.path, e.target.checked)}
              />
            )}
            <span
              className={`text-sm ${
                entry.type === 'file' && onSelectFile ? 'cursor-pointer hover:underline' : ''
              }`}
              onClick={() => entry.type === 'file' && onSelectFile?.(entry)}
            >
              {entry.path}
            </span>
          </div>
          {entry.children && entry.children.length > 0 && (
            <FileTree
              entries={entry.children}
              onSelectFile={onSelectFile}
              selectedPaths={selectedPaths}
              onToggleSelect={onToggleSelect}
              level={level + 1}
            />
          )}
        </li>
      ))}
    </ul>
  );
};

export default FileTree;
