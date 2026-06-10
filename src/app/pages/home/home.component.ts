import { Component, computed, effect, inject } from '@angular/core';
import { FileSystemService } from '../../services/file-system.service';

// Material component
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-home',
  imports: [MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private fileSystemService = inject(FileSystemService);

  folderContent = computed(() => this.fileSystemService.folderContent());
  canGoBack = computed(() => this.fileSystemService.canGoBack());

  constructor() {
    effect(async () => {
      const root = this.fileSystemService.rootFolder();
      if (root) await this.fileSystemService.initRoot(root);
    });
    window.addEventListener('popstate', async (event: PopStateEvent) => {
      if (this.canGoBack()) {
        await this.goBack();
      }
    });
  }

  async deleteItem(event: MouseEvent, handle: FileSystemHandle) {
    event.stopPropagation();
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
}
