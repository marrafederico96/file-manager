import { Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

// Material component
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FileSystemService } from '../../services/file-system.service';

@Component({
  selector: 'app-folder-dialog',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatDialogModule,
  ],
  templateUrl: './folder-dialog.component.html',
  styleUrl: './folder-dialog.component.scss',
})
export class FolderDialogComponent {
  private dialogRef = inject(MatDialogRef<FolderDialogComponent>);
  private fileSystemService = inject(FileSystemService);

  folderName = new FormControl('', Validators.required);
  currentDir = computed(() => this.fileSystemService.currentDirHandle());

  close() {
    this.dialogRef.close();
  }

  async create() {
    if (this.folderName.valid) {
      const name = this.folderName.value;
      const current = this.currentDir();

      if (current && name) {
        try {
          await current.getDirectoryHandle(name, { create: false });
          this.folderName.setErrors({ alreadyExists: true });
          return;
        } catch (err: any) {
          if (err.name !== 'NotFoundError') throw err;
        }
      }
      this.dialogRef.close(name);
    }
  }
}
