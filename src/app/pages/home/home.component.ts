import { Component, computed, effect, inject } from '@angular/core';
import { FileSystemService } from '../../services/file-system.service';
// Material component
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { CameraService } from '../../services/camera.service';

@Component({
  selector: 'app-home',
  imports: [MatListModule, MatMenuModule, MatIconModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private fileSystemService = inject(FileSystemService);
  private cameraService = inject(CameraService);

  folderContent = computed(() => this.fileSystemService.folderContent());
  canGoBack = computed(() => this.fileSystemService.canGoBack());

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

  async deleteItem(event: MouseEvent, handle: FileSystemHandle) {
    event.stopPropagation();
    const confirmed = confirm(`Sei sicuro di voler eliminare "${handle.name}"?`);
    if (!confirmed) return;
    await this.fileSystemService.deleteFileOrDirectory(handle);
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

  async openCamera(event: MouseEvent, handle: FileSystemHandle) {
    const dirHandle = handle as FileSystemDirectoryHandle;
    await this.cameraService.openCamera(dirHandle);
  }
}
