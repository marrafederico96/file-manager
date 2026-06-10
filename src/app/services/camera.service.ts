import { inject, Injectable } from '@angular/core';
import { FileSystemService } from './file-system.service';

@Injectable({ providedIn: 'root' })
export class CameraService {
  private fileSystemService = inject(FileSystemService);

  private takePhoto(): Promise<File> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';

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

  async openCamera(handle: FileSystemDirectoryHandle) {
    try {
      const file = await this.takePhoto();

      if (handle) {
        const folderName = handle.name;
        await this.savePhoto(file, handle, folderName);
        await this.fileSystemService.loadFolderContent(handle);
      }
    } catch (err: any) {
      if (err?.cause === 'USER_CANCELED') {
        console.log("L'utente ha annullato l'operazione.");
        return;
      }

      console.error(err);
      alert('Errore nel salvataggio della foto');
    }
  }

  private async savePhoto(
    file: File,
    dirHandle: FileSystemDirectoryHandle,
    folderName: string,
  ): Promise<void> {
    let count = 0;
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') count++;
    }

    const ext = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${folderName.replaceAll(' ', '_')}_${count + 1}.${ext}`;

    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();
  }
}
