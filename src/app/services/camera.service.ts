import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CameraService {
    
  takePhoto(): Promise<File> {
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

      input.oncancel = () => reject(new Error('Annullato'));
      input.click();
    });
  }

  async savePhoto(
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
