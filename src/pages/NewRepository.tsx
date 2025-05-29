import React, { useState, useCallback } from 'react';
import { useDropzone, DropEvent } from 'react-dropzone';
import { getFilesFromDataTransfer } from '../utils/dropHelpers';
import { GitBranch, Upload, Eye, FolderOpen, FileText, Lock, Unlock, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAppContext } from '../context/AppContext';
import FileTree from '../components/FileTree';
import { useToast } from '../components/ui/Toaster';
import { FileEntry, Repository } from '../types';
import { processUploadedFiles } from '../utils/fileProcessor';
import { validateRepositoryName } from '../utils/validation';
import { createRepository, createCommit } from '../utils/github';
import { useLocation } from 'react-router-dom';

const NewRepository: React.FC = () => {
  const { accounts, activeAccountId, setActiveAccountId } = useAppContext();
  const { addToast } = useToast();
  const location = useLocation();
  const activeAccount = accounts.find(account => account.id === activeAccountId);
  
  const [creationMode, setCreationMode] = useState<'empty' | 'fromFiles' | null>(() => {
    return location.state?.initialMode || null;
  });
  const [step, setStep] = useState<'upload' | 'configure' | 'commit' | 'preview' | 'configureSimple' | 'previewSimple'>(
    () => {
      const initialMode = location.state?.initialMode;
      if (initialMode === 'empty') return 'configureSimple';
      if (initialMode === 'fromFiles') return 'upload';
      return 'upload'; // Default if no mode or unknown mode
    }
  );
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);
  
  // Repository configuration
  const [repoName, setRepoName] = useState('');
  const [repoDescription, setRepoDescription] = useState('');
  const [repoVisibility, setRepoVisibility] = useState<'public' | 'private'>('private');
  const [branchName, setBranchName] = useState('main');
  const [withReadme, setWithReadme] = useState(false);
  
  // Commit configuration
  const [commitMessage, setCommitMessage] = useState('Initial commit');
  const [commitDescription, setCommitDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [ignorePatterns, setIgnorePatterns] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const selectedTree = React.useMemo(() => {
    const filterEntries = (entries: FileEntry[], base = ''): FileEntry[] => {
      const result: FileEntry[] = [];
      for (const entry of entries) {
        const fullPath = base ? `${base}/${entry.path}` : entry.path;
        if (entry.type === 'file') {
          if (selectedFiles.includes(fullPath)) {
            result.push(entry);
          }
        } else if (entry.children) {
          const children = filterEntries(entry.children, fullPath);
          if (children.length > 0) {
            result.push({ ...entry, children });
          }
        }
      }
      return result;
    };
    return filterEntries(files);
  }, [files, selectedFiles]);

  const resetForm = () => {
    setCreationMode(null);
    setStep('upload'); // Default step for 'fromFiles', will be adjusted if 'empty' is chosen again
    setFiles([]);
    setRepoName('');
    setRepoDescription('');
    setRepoVisibility('private');
    setBranchName('main');
    setCommitMessage('Initial commit');
    setCommitDescription('');
    setSelectedFiles([]);
    setIgnorePatterns([]);
    setWithReadme(false);
  };

  const toggleAllFiles = () => {
    const fileEntries = files.filter(file => file.type === 'file');
    if (selectedFiles.length === fileEntries.length) {
      // If all files are selected, deselect all
      setSelectedFiles([]);
    } else {
      // Otherwise, select all files
      setSelectedFiles(fileEntries.map(file => file.path));
    }
  };
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const filesToProcess = acceptedFiles;

    setIsProcessing(true);
    setPreviewFile(null);
    try {
      const processedFiles = await processUploadedFiles(filesToProcess);
      setFiles(processedFiles);
      setStep('configure');

      // Set all files as selected by default
      const allFilePaths = processedFiles
        .filter(file => file.type === 'file')
        .map(file => file.path);
      setSelectedFiles(allFilePaths);
      
      addToast({
        title: 'Files uploaded',
        description: `${acceptedFiles.length} files have been processed successfully`,
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Upload failed',
        description: 'There was an error processing your files',
        type: 'error',
      });
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [addToast]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: isProcessing,
    getFilesFromEvent: (event) => {
      const items = (event as any).dataTransfer?.items;
      if (items && Array.from(items).some((i: any) => i.webkitGetAsEntry?.())) {
        return getFilesFromDataTransfer(items);
      }
      return (event as any).target?.files ? Promise.resolve(Array.from((event as any).target.files)) : Promise.resolve([]);
    }
  });
  
  const handleConfigureNext = () => {
    if (!validateRepositoryName(repoName)) {
      addToast({
        title: 'Invalid repository name',
        description: 'Repository name can only contain alphanumeric characters, hyphens, underscores, and periods',
        type: 'error',
      });
      return;
    }
    
    if (!repoName) {
      addToast({
        title: 'Repository name required',
        description: 'Please enter a name for your repository',
        type: 'warning',
      });
      return;
    }
    
    if (creationMode === 'empty') {
      setStep('previewSimple');
    } else {
      setStep('commit');
    }
  };
  
  const handleCommitNext = () => {
    if (!commitMessage) {
      addToast({
        title: 'Commit message required',
        description: 'Please enter a message for your initial commit',
        type: 'warning',
      });
      return;
    }
    
    setStep('preview');
  };
  
  const handleCreateRepository = async () => {
    if (!activeAccount) {
      addToast({
        title: 'No active account',
        description: 'Please select an active GitHub account first',
        type: 'error',
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const repositoryData = {
        name: repoName,
        description: repoDescription,
        visibility: repoVisibility,
        // For empty repo, auto_init handles readme. For fromFiles, branchName is used.
        auto_init: creationMode === 'empty' ? withReadme : false, 
      };

      // Create repository on GitHub
      // For the 'empty' mode, we pass slightly different data to createRepository
      // and we don't create an initial commit with files here.
      if (creationMode === 'empty') {
        await createRepository(activeAccount, {
          name: repoName,
          description: repoDescription,
          visibility: repoVisibility,
          defaultBranch: branchName, // This might be ignored if auto_init is true, GitHub uses main
          files: [], // No files for empty repo creation via this specific call
        }, withReadme); // Pass withReadme to createRepository
      } else {
        // Existing flow for creating from files
        const repositoryObject: Repository = {
          name: repoName,
          description: repoDescription,
          visibility: repoVisibility,
          defaultBranch: branchName,
          files: files
        };
        await createRepository(activeAccount, repositoryObject, false);
        await createCommit(
          activeAccount,
          repoName,
          branchName,
          commitMessage,
          files.filter(file => selectedFiles.includes(file.path))
        );
      }
      
      addToast({
        title: 'Repository created',
        description: `Repository ${repoName} has been created successfully`,
        type: 'success',
      });
      
      resetForm();
    } catch (error) {
      addToast({
        title: 'Repository creation failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        type: 'error',
      });
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };
  
  if (!activeAccount) {
    return (
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <GitBranch className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No active account</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please add and select an active GitHub account to create a repository
          </p>
          <Button 
            className="mt-4"
            onClick={() => window.location.href = '/accounts'}
          >
            Manage Accounts
          </Button>
        </div>
      </div>
    );
  }
  
  if (!creationMode) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <GitBranch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
            Create a New Repository
          </h2>
          <div className="flex flex-col sm:flex-row sm:justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              onClick={() => {
                setCreationMode('empty');
                setStep('configureSimple');
              }}
              className="w-full sm:w-auto"
            >
              <FileText className="mr-2 h-4 w-4" /> Create Empty Repository
            </Button>
            <Button 
              onClick={() => {
                setCreationMode('fromFiles');
                setStep('upload');
              }}
              className="w-full sm:w-auto"
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" /> Create From Existing Files
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Progress Steps */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className={`px-6 py-4 ${creationMode === 'empty' ? 'justify-center' : 'justify-between'}`}>
            {creationMode === 'fromFiles' && (
              <>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step === 'upload' ? 'bg-blue-500 text-white' : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                  }`}>
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      step === 'upload' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      Upload Files
                    </p>
                  </div>
                </div>
                <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
              </>
            )}
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                (step === 'configure' || step === 'configureSimple') ? 'bg-blue-500 text-white' : 
                (creationMode === 'fromFiles' && (step === 'commit' || step === 'preview')) || (creationMode === 'empty' && step === 'previewSimple') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 
                'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}>
                <GitBranch className="h-4 w-4" />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  (step === 'configure' || step === 'configureSimple') ? 'text-gray-900 dark:text-gray-100' : 
                  (creationMode === 'fromFiles' && (step === 'commit' || step === 'preview')) || (creationMode === 'empty' && step === 'previewSimple') ? 'text-gray-500 dark:text-gray-400' : 
                  'text-gray-400 dark:text-gray-500'
                }`}>
                  Configure Repository
                </p>
              </div>
            </div>

            {creationMode === 'fromFiles' && (
              <>
                <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step === 'commit' ? 'bg-blue-500 text-white' : 
                    step === 'preview' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 
                    'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  }`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      step === 'commit' ? 'text-gray-900 dark:text-gray-100' : 
                      step === 'preview' ? 'text-gray-500 dark:text-gray-400' : 
                      'text-gray-400 dark:text-gray-500'
                    }`}>
                      Commit Settings
                    </p>
                  </div>
                </div>
              </>
            )}
            
            <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                (step === 'preview' || step === 'previewSimple') ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}>
                <Eye className="h-4 w-4" />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  (step === 'preview' || step === 'previewSimple') ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  Preview & Create
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Upload Step */}
          {step === 'upload' && creationMode === 'fromFiles' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Upload Repository Files
              </h2>
              
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                  isDragActive ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20' : 
                  'border-gray-300 dark:border-gray-700'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <input {...getInputProps({ webkitdirectory: 'true', directory: '', multiple: true })} />
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {isDragActive ? 'Drop the files here...' : 'Drag and drop files or folders here'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    You can upload individual files, entire folders, or ZIP archives
                  </p>
                  {!isDragActive && !isProcessing && (
                    <Button className="mt-4" size="sm">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Browse Files
                    </Button>
                  )}
                  {isProcessing && (
                    <p className="mt-4 text-sm text-blue-600 dark:text-blue-400">
                      Processing files...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Configure Step (fromFiles) */}
          {step === 'configure' && creationMode === 'fromFiles' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Configure Repository
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Uploaded Files</h3>
                  <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800">
                    <FileTree entries={files} onSelectFile={setPreviewFile} />
                  </div>
                  {previewFile && previewFile.content !== undefined && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Preview: {previewFile.path}
                      </h4>
                      <pre className="text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 rounded-md p-2 overflow-x-auto">
                        {previewFile.content}
                      </pre>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="repoName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Repository Name *
                  </label>
                  <input
                    type="text"
                    id="repoName"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="repoDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="repoDescription"
                    value={repoDescription}
                    onChange={(e) => setRepoDescription(e.target.value)}
                    placeholder="A short description of your project"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:space-x-4">
                  <div className="flex-1 mb-4 sm:mb-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Visibility
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setRepoVisibility('private')}
                        className={`flex-1 flex items-center justify-center space-x-2 rounded-md px-4 py-2 text-sm font-medium ${
                          repoVisibility === 'private' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700' 
                            : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Lock className="h-4 w-4" />
                        <span>Private</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepoVisibility('public')}
                        className={`flex-1 flex items-center justify-center space-x-2 rounded-md px-4 py-2 text-sm font-medium ${
                          repoVisibility === 'public' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700' 
                            : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Unlock className="h-4 w-4" />
                        <span>Public</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Branch
                    </label>
                    <input
                      type="text"
                      id="branchName"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Account
                  </label>
                  <select
                    value={activeAccountId || ''}
                    onChange={(e) => setActiveAccountId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name || acc.username} (@{acc.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Back
                </Button>
                <Button onClick={handleConfigureNext}>
                  Next
                </Button>
              </div>
            </div>
          )}
          
          {/* Configure Simple Step (empty) */}
          {step === 'configureSimple' && creationMode === 'empty' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Configure New Repository
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="repoName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Repository Name *
                  </label>
                  <input
                    type="text"
                    id="repoName"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="repoDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="repoDescription"
                    value={repoDescription}
                    onChange={(e) => setRepoDescription(e.target.value)}
                    placeholder="A short description of your project"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="withReadme"
                    checked={withReadme}
                    onChange={(e) => setWithReadme(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="withReadme" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Initialize this repository with a README
                  </label>
                </div>
                {/* Visibility and Target Account can be reused or simplified as needed */}
                <div className="flex flex-col sm:flex-row sm:space-x-4">
                  <div className="flex-1 mb-4 sm:mb-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Visibility
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setRepoVisibility('private')}
                        className={`flex-1 flex items-center justify-center space-x-2 rounded-md px-4 py-2 text-sm font-medium ${
                          repoVisibility === 'private' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700' 
                            : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Lock className="h-4 w-4" />
                        <span>Private</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepoVisibility('public')}
                        className={`flex-1 flex items-center justify-center space-x-2 rounded-md px-4 py-2 text-sm font-medium ${
                          repoVisibility === 'public' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700' 
                            : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Unlock className="h-4 w-4" />
                        <span>Public</span>
                      </button>
                    </div>
                  </div>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Account
                  </label>
                  <div className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
                    {activeAccount.avatarUrl ? (
                      <img 
                        src={activeAccount.avatarUrl} 
                        alt={activeAccount.username} 
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {activeAccount.username.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activeAccount.name || activeAccount.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{activeAccount.username}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleConfigureNext}>
                  Next
                </Button>
              </div>
            </div>
          )}
          
          {/* Commit Step (fromFiles) */}
          {step === 'commit' && creationMode === 'fromFiles' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Commit Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="commitMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Commit Message *
                  </label>
                  <input
                    type="text"
                    id="commitMessage"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Initial commit"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="commitDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Extended Description (optional)
                  </label>
                  <textarea
                    id="commitDescription"
                    value={commitDescription}
                    onChange={(e) => setCommitDescription(e.target.value)}
                    placeholder="Additional details about this commit"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Files to Include
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAllFiles}
                      className="text-xs"
                    >
                      {selectedFiles.length === files.filter(f => f.type === 'file').length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-800">
                    <FileTree
                      entries={files}
                      selectedPaths={selectedFiles}
                      onToggleSelect={(path, checked) => {
                        if (checked) {
                          setSelectedFiles([...selectedFiles, path]);
                        } else {
                          setSelectedFiles(selectedFiles.filter(f => f !== path));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep('configure')}>
                  Back
                </Button>
                <Button onClick={handleCommitNext}>
                  Preview
                </Button>
              </div>
            </div>
          )}
          
          {/* Preview Step (fromFiles) */}
          {step === 'preview' && creationMode === 'fromFiles' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Preview & Create Repository
              </h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
                    Repository Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{repoName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Visibility</p>
                      <div className="flex items-center">
                        {repoVisibility === 'private' ? (
                          <>
                            <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                            <span className="text-sm text-gray-800 dark:text-gray-200">Private</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                            <span className="text-sm text-gray-800 dark:text-gray-200">Public</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Default Branch</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{branchName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">@{activeAccount.username}</p>
                    </div>
                    
                    {repoDescription && (
                      <div className="col-span-full">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{repoDescription}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
                    Initial Commit
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Commit Message</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{commitMessage}</p>
                    </div>
                    
                    {commitDescription && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Extended Description</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{commitDescription}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Files ({selectedFiles.length})
                      </p>
                      <div className="mt-1 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800">
                        <FileTree entries={selectedTree} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep('commit')}>
                  Back
                </Button>
                <Button 
                  onClick={handleCreateRepository}
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Repository'}
                </Button>
              </div>
            </div>
          )}

          {/* Preview Simple Step (empty) */}
          {step === 'previewSimple' && creationMode === 'empty' && (
             <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Preview & Create Repository
              </h2>
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
                    Repository Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{repoName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Visibility</p>
                      <div className="flex items-center">
                        {repoVisibility === 'private' ? (
                          <><Lock className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" /><span>Private</span></>
                        ) : (
                          <><Unlock className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" /><span>Public</span></>
                        )}
                      </div>
                    </div>
                    {repoDescription && (
                      <div className="col-span-full">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{repoDescription}</p>
                      </div>
                    )}
                     <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Initialize with README</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{withReadme ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">@{activeAccount.username}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep('configureSimple')}>
                  Back
                </Button>
                <Button onClick={handleCreateRepository} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Repository'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewRepository;