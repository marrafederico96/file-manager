import { computed, Service, signal } from '@angular/core';

@Service()
export class FileSystemService {
  rootFolder = signal<FileSystemDirectoryHandle | undefined>(undefined);
  currentDirHandle = signal<FileSystemDirectoryHandle | undefined>(undefined);
  folderContent = signal<FileSystemHandle[]>([]);
  canGoBack = computed(() => this.historyStack().length > 0);

  private historyStack = signal<FileSystemDirectoryHandle[]>([]);

  async selectRootFolder() {
    this.rootFolder.set(
      await window.showDirectoryPicker({
        mode: 'readwrite',
      }),
    );
  }

  async initRoot(root: FileSystemDirectoryHandle): Promise<void> {
    this.historyStack.set([]);
    this.currentDirHandle.set(root);
    await this.loadFolderContent(root);
  }

  async loadFolderContent(folder: FileSystemDirectoryHandle) {
    const content: FileSystemHandle[] = [];

    for await (var item of folder.values()) {
      content.push(item);
    }

    const sortedContent = content.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return 0;
    });

    this.folderContent.set(sortedContent);
  }

  async navigateTo(dirHandle: FileSystemDirectoryHandle): Promise<void> {
    const current = this.currentDirHandle();
    if (current) this.historyStack.update((s) => [...s, current]);
    history.pushState({ inApp: true }, '');
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

  async createFolder(name: string) {
    const current = this.currentDirHandle();
    if (!current) throw new Error('Nessuna directory corrente');
    await current.getDirectoryHandle(name, { create: true });
    await this.loadFolderContent(current);
  }

  async navigateToRoot(): Promise<void> {
    this.historyStack.set([]);
    const root = this.rootFolder();
    if (root) {
      this.currentDirHandle.set(root);
      await this.loadFolderContent(root);
    }
  }

  async deleteFileOrDirectory(handle: FileSystemHandle): Promise<void> {
    const current = this.currentDirHandle();

    if (!current) throw new Error('Nessuna directory corrente selezionata');

    const confirmed = confirm(`Sei sicuro di voler eliminare ${handle.name}?`);
    if (!confirmed) return;

    try {
      await current.removeEntry(handle.name, { recursive: true });
      await this.loadFolderContent(current);
    } catch (error) {
      alert(
        "Impossibile eliminare l'elemento. Potrebbe essere aperto in un altro programma o non avere i permessi necessari.",
      );
    }
  }
}
