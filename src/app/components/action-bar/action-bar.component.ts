import { Component, computed, inject } from '@angular/core';

// Material Component
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { CameraService } from '../../services/camera.service';
import { FileSystemService } from '../../services/file-system.service';
import { FolderDialogComponent } from '../folder-dialog/folder-dialog.component';
@Component({
  selector: 'app-action-bar',
  imports: [MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './action-bar.component.html',
  styleUrl: './action-bar.component.scss',
})
export class ActionBarComponent {
  private fileSystemService = inject(FileSystemService);
  private cameraService = inject(CameraService);

  private dialog = inject(MatDialog);

  root = computed(() => this.fileSystemService.rootFolder());
  currentDir = computed(() => this.fileSystemService.currentDirHandle());

  async selectRootFolder() {
    await this.fileSystemService.selectRootFolder();
    var rootHandle = this.root();

    if (rootHandle) {
      await this.fileSystemService.loadFolderContent(rootHandle);
    }
  }

  async openCamera() {
    try {
      const file = await this.cameraService.takePhoto();

      const dirHandle = this.currentDir();
      if (dirHandle) {
        const folderName = dirHandle.name;
        await this.cameraService.savePhoto(file, dirHandle, folderName);
        await this.fileSystemService.loadFolderContent(dirHandle);
      }
    } catch (err) {
      console.error('Foto annullata o errore:', err);
    }
  }

  async openDialog() {
    const dialogRef = this.dialog.open(FolderDialogComponent, {
      width: '400px',
      disableClose: true,
    });
    const name = await firstValueFrom(dialogRef.afterClosed());
    if (name) {
      await this.fileSystemService.createFolder(name);
    }
  }
}
