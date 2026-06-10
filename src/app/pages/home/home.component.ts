import { Component, computed, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { CameraService } from '../../services/camera.service';
import { FileSystemService } from '../../services/file-system.service';
@Component({
  selector: 'app-home',
  imports: [
    MatListModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private fileSystemService = inject(FileSystemService);
  private cameraService = inject(CameraService);
  private dialog = inject(MatDialog);

  folderContent = computed(() => this.fileSystemService.folderContent());
  canGoBack = computed(() => this.fileSystemService.canGoBack());
  breadcrumb = computed(
    () =>
      [...this.fileSystemService.historyStack(), this.fileSystemService.currentDirHandle()].filter(
        Boolean,
      ) as FileSystemDirectoryHandle[],
  );

  constructor() {
    effect(async () => {
      const root = this.fileSystemService.rootFolder();
      if (root) await this.fileSystemService.initRoot(root);
    });

    window.addEventListener('popstate', async () => {
      if (this.canGoBack()) {
        await this.goBack();
      }
    });
  }

  async deleteItem(handle: FileSystemHandle) {
    const confirmed: boolean = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: { message: `Sei sicuro di voler eliminare "${handle.name}"?` },
        })
        .afterClosed(),
    );
    if (!confirmed) return;
    try {
      await this.fileSystemService.deleteFileOrDirectory(handle);
    } catch (e) {
      console.error('Errore durante la delete:', e);
      alert(`Impossibile eliminare "${handle.name}": ${(e as Error).message}`);
    }
  }

  async openItem(handle: FileSystemHandle) {
    if (handle.kind === 'directory') {
      await this.fileSystemService.navigateTo(handle as FileSystemDirectoryHandle);
    }
  }

  async navigateTo(handle: FileSystemHandle) {
    const dirHandle = handle as FileSystemDirectoryHandle;
    await this.fileSystemService.navigateTo(dirHandle);
  }

  async goBack() {
    await this.fileSystemService.navigateBack();
  }

  async navigateToBreadcrumb(index: number) {
    const stack = this.fileSystemService.historyStack();
    if (index === stack.length) return;
    const target = stack[index];
    this.fileSystemService.historyStack.set(stack.slice(0, index));
    this.fileSystemService.currentDirHandle.set(target);
    await this.fileSystemService.loadFolderContent(target);
  }

  async openCamera(handle: FileSystemHandle) {
    const dirHandle = handle as FileSystemDirectoryHandle;
    await this.cameraService.openCamera(dirHandle);
  }
}
