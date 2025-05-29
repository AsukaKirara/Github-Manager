export const getFilesFromDataTransfer = async (items: DataTransferItemList): Promise<File[]> => {
  const files: File[] = [];

  const traverseEntry = async (entry: any, path: string): Promise<void> => {
    if (entry.isFile) {
      const file: File = await new Promise((resolve) => {
        (entry as FileSystemFileEntry).file(resolve);
      });
      Object.defineProperty(file, 'webkitRelativePath', { value: path + file.name });
      files.push(file);
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const readEntries = async (): Promise<void> => {
        const entries: any[] = await new Promise((resolve) => reader.readEntries(resolve));
        if (entries.length === 0) return;
        for (const e of entries) {
          await traverseEntry(e, path + entry.name + '/');
        }
        await readEntries();
      };
      await readEntries();
    }
  };

  const tasks: Promise<void>[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const entry = (item as any).webkitGetAsEntry?.();
    if (entry) {
      tasks.push(traverseEntry(entry, ''));
    }
  }

  await Promise.all(tasks);
  return files;
};
