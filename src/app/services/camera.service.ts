import { computed, inject, Injectable } from '@angular/core';
import { FileSystemService } from './file-system.service';

@Injectable({ providedIn: 'root' })
export class CameraService {
  private fileSystemService = inject(FileSystemService);

  currentDir = computed(() => this.fileSystemService.currentDirHandle());

  private takePhoto(): Promise<File> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) resolve(file);
        else reject(new Error('Nessuna foto selezionata'));
      };
      input.oncancel = () => {
        reject(new Error('Input annullato', { cause: 'USER_CANCELED' }));
      };
      input.click();
    });
  }

  async openCamera(handle: FileSystemDirectoryHandle): Promise<void> {
    try {
      const file = await this.takePhoto();
      await this.savePhoto(file, handle);
      const current = this.currentDir();
      if (current && (await current.isSameEntry(handle))) {
        await this.fileSystemService.loadFolderContent(handle);
      }
    } catch (err) {
      if (err instanceof Error && err.cause === 'USER_CANCELED') {
        console.log("L'utente ha annullato l'operazione.");
        return;
      }
      throw err;
    }
  }

  private async savePhoto(file: File, dirHandle: FileSystemDirectoryHandle): Promise<void> {
    const existingNames = new Set<string>();
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') existingNames.add(entry.name);
    }

    const ext = file.name.split('.').pop() ?? 'jpg';
    const base = dirHandle.name.replaceAll(' ', '_');
    let index = existingNames.size + 1;
    while (existingNames.has(`${base}_${index}.${ext}`)) index++;
    const fileName = `${base}_${index}.${ext}`;

    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    try {
      await writable.write(file);
      await writable.close();
    } catch (e) {
      await writable.abort();
      throw e;
    }
  }
}
