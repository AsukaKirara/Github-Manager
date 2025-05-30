import JSZip from 'jszip';
import { FileEntry } from '../types';

declare const Buffer: any;

export const processUploadedFiles = async (
  files: File[]
): Promise<FileEntry[]> => {
  const result: FileEntry[] = [];

  for (const file of files) {
    // Handle ZIP files
    if (file.name.endsWith('.zip')) {
      const zipEntries = await processZipFile(file);
      result.push(...zipEntries);
    } else {
      // Handle regular files and directories
      const path = file.webkitRelativePath || file.name;
      // Read content for regular files
      let content: string | undefined = undefined;
      let isBinary = false;
      if (!file.webkitRelativePath?.endsWith('/')) {
        try {
          const buffer = await file.arrayBuffer();
          try {
            content = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
          } catch {
            content = Buffer.from(buffer).toString('base64');
            isBinary = true;
          }
        } catch (e) {
          console.warn(`Could not read content for file: ${path}`, e);
        }
      }
      const entry = createFileEntry(file, path, content, isBinary);
      
      // Add to result, handling nested paths
      addFileToHierarchy(result, entry);
    }
  }

  return result;
};

const processZipFile = async (zipFile: File): Promise<FileEntry[]> => {
  const result: FileEntry[] = [];
  
  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(await zipFile.arrayBuffer());
    
    // Process each file in the zip
    for (const [path, file] of Object.entries(contents.files)) {
      if (file.dir) {
        // Create directory entry
        const dirEntry: FileEntry = {
          path,
          type: 'directory',
          children: []
        };
        addFileToHierarchy(result, dirEntry);
      } else {
        let content: string | undefined;
        let isBinary = false;
        const buffer = await file.async('uint8array');
        try {
          content = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
        } catch {
          content = Buffer.from(buffer).toString('base64');
          isBinary = true;
        }
        const fileEntry: FileEntry = {
          path,
          type: 'file',
          content,
          size: buffer.length,
          isBinary
        };
        addFileToHierarchy(result, fileEntry);
      }
    }
  } catch (error) {
    console.error('Error processing ZIP file:', error);
  }
  
  return result;
};

const createFileEntry = (
  file: File,
  path: string,
  content?: string,
  isBinary = false
): FileEntry => {
  // Directories often have an empty type string or specific indicators like a trailing slash in webkitRelativePath.
  // Files usually have a non-empty type or a name containing a dot (unless it's a dotfile like .gitignore).
  const isDirectory = file.webkitRelativePath?.endsWith('/') || (!file.type && file.size === 0 && !path.includes('.'));
  
  // Treat dotfiles specifically as files if not otherwise identified as directory
  const isDotFile = path.startsWith('.') && !path.includes('/', 1);

  if (isDotFile && isDirectory) { // If it's a dotfile but looks like a directory by other heuristics, it's a file.
    return {
      path,
      type: 'file',
      content: content,
      size: file.size,
      isBinary
    };
  }

  return {
    path,
    type: isDirectory ? 'directory' : 'file',
    size: isDirectory ? undefined : file.size,
    content: isDirectory ? undefined : content,
    isBinary: isDirectory ? undefined : isBinary,
    children: isDirectory ? [] : undefined
  };
};

const addFileToHierarchy = (hierarchy: FileEntry[], entry: FileEntry): void => {
  const pathParts = entry.path.split('/');
  
  // If it's a top-level entry
  if (pathParts.length === 1) {
    hierarchy.push(entry);
    return;
  }
  
  // Handle nested paths
  let currentLevel = hierarchy;
  
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!part) continue; // Skip empty parts
    
    // Find or create the directory at this level
    let dir = currentLevel.find(item => item.path === part && item.type === 'directory');
    
    if (!dir) {
      dir = {
        path: part,
        type: 'directory',
        children: []
      };
      currentLevel.push(dir);
    }
    
    currentLevel = dir.children!;
  }
  
  // Add the actual file at the final level
  const filename = pathParts[pathParts.length - 1];
  if (filename) {
    currentLevel.push({
      ...entry,
      path: filename // Update path to just the filename at this level
    });
  }
};

export const getFilesForCommit = (
  files: FileEntry[],
  ignorePatterns: string[] = []
): string[] => {
  const result: string[] = [];
  
  const processEntry = (entry: FileEntry, currentPath: string = '') => {
    const fullPath = currentPath ? `${currentPath}/${entry.path}` : entry.path;
    
    // Check if this file should be ignored
    if (shouldIgnore(fullPath, ignorePatterns)) {
      return;
    }
    
    if (entry.type === 'file') {
      result.push(fullPath);
    } else if (entry.children) {
      for (const child of entry.children) {
        processEntry(child, fullPath);
      }
    }
  };
  
  for (const entry of files) {
    processEntry(entry);
  }
  
  return result;
};

const shouldIgnore = (path: string, ignorePatterns: string[]): boolean => {
  for (const pattern of ignorePatterns) {
    // Simple wildcard matching for now
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (path.startsWith(prefix)) {
        return true;
      }
    } else if (path === pattern) {
      return true;
    }
  }
  return false;
};

export const flattenFileTree = (entries: FileEntry[]): FileEntry[] => {
  const result: FileEntry[] = [];

  const walk = (entry: FileEntry, currentPath: string = '') => {
    const cleanPath = entry.path.replace(/\/$/, '');
    const fullPath = currentPath ? `${currentPath}/${cleanPath}` : cleanPath;

    if (entry.type === 'file') {
      result.push({ ...entry, path: fullPath });
    } else if (entry.children) {
      for (const child of entry.children) {
        walk(child, fullPath);
      }
    }
  };

  for (const entry of entries) {
    walk(entry);
  }

  return result;
};