import { Location } from '@angular/common';
import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FileSystemService {
  rootFolder = signal<FileSystemDirectoryHandle | undefined>(undefined);
  currentDirHandle = signal<FileSystemDirectoryHandle | undefined>(undefined);
  folderContent = signal<FileSystemHandle[]>([]);
  canGoBack = computed(() => this.historyStack().length > 0);

  historyStack = signal<FileSystemDirectoryHandle[]>([]);

  constructor(private location: Location) {}

  async selectRootFolder(): Promise<void> {
    try {
      this.rootFolder.set(
        await (window as any).showDirectoryPicker({
          mode: 'readwrite',
        }),
      );
    } catch (e) {
      if ((e as DOMException).name !== 'AbortError') throw e;
    }
  }

  async initRoot(root: FileSystemDirectoryHandle): Promise<void> {
    this.historyStack.set([]);
    this.currentDirHandle.set(root);
    await this.loadFolderContent(root);
  }

  async loadFolderContent(folder: FileSystemDirectoryHandle): Promise<void> {
    const content: FileSystemHandle[] = [];
    for await (const item of folder.values()) {
      content.push(item);
    }
    const sortedContent = content.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    this.folderContent.set(sortedContent);
  }

  async navigateTo(dirHandle: FileSystemDirectoryHandle): Promise<void> {
    const current = this.currentDirHandle();
    if (current) this.historyStack.update((s) => [...s, current]);
    this.location.go(this.location.path());
    this.currentDirHandle.set(dirHandle);
    await this.loadFolderContent(dirHandle);
  }

  async navigateBack(): Promise<void> {
    const stack = this.historyStack();
    const previous = stack.at(-1);
    if (previous) {
      this.historyStack.update((s) => s.slice(0, -1));
      this.currentDirHandle.set(previous);
      await this.loadFolderContent(previous);
    }
  }

  async createFolder(name: string): Promise<void> {
    const current = this.currentDirHandle();
    if (!current) throw new Error('Nessuna directory corrente');
    const newHandle = await current.getDirectoryHandle(name, { create: true });
    this.folderContent.update((items) =>
      [...items, newHandle].sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    );
  }

  async navigateToRoot(): Promise<void> {
    this.historyStack.set([]);
    const root = this.rootFolder();
    if (root) {
      this.currentDirHandle.set(root);
      await this.loadFolderContent(root);
    }
  }

  async deleteFileOrDirectory(handle: FileSystemHandle): Promise<boolean> {
    const current = this.currentDirHandle();
    if (!current) throw new Error('Nessuna directory corrente selezionata');
    try {
      await current.removeEntry(handle.name, { recursive: true });
      this.folderContent.update((items) => items.filter((item) => item.name !== handle.name));
      return true;
    } catch (e) {
      console.error('removeEntry fallito:', e);
      throw e;
    }
  }
}
