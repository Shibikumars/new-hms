import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-zone" 
         [class.dragging]="isDragging"
         (dragover)="onDragOver($event)"
         (dragleave)="onDragLeave($event)"
         (drop)="onDrop($event)"
         (click)="fileInput.click()">
      
      <input type="file" #fileInput 
             [multiple]="multiple" 
             [accept]="accept" 
             (change)="onFileSelected($event)" 
             hidden />

      <div class="upload-content">
        <i class="ph ph-cloud-arrow-up icon-huge"></i>
        <div class="upload-text">
          <strong>Click to upload</strong> or drag and drop
        </div>
        <div class="upload-hint" *ngIf="hint">{{ hint }}</div>
      </div>
    </div>

    <div class="file-list" *ngIf="files.length > 0">
      <div class="file-item" *ngFor="let file of files; let i = index">
        <div class="file-info">
          <i class="ph ph-file-text"></i>
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">({{ formatSize(file.size) }})</span>
        </div>
        <button class="remove-btn" (click)="removeFile(i)">
          <i class="ph ph-trash"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .upload-zone {
      border: 2px dashed var(--border-strong);
      border-radius: var(--radius-md);
      padding: 2.5rem;
      text-align: center;
      background: var(--surface);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .upload-zone:hover, .upload-zone.dragging {
      border-color: var(--primary);
      background: var(--surface-soft);
    }
    .icon-huge {
      font-size: 2.5rem;
      color: var(--primary);
      margin-bottom: 1rem;
    }
    .upload-text {
      font-size: 1rem;
      color: var(--text-soft);
      margin-bottom: 0.25rem;
    }
    .upload-text strong {
      color: var(--primary);
    }
    .upload-hint {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .file-list {
      margin-top: 1rem;
      display: grid;
      gap: 0.5rem;
    }
    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--surface-strong);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }
    .file-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text);
      font-size: 0.9rem;
    }
    .file-name {
      font-weight: 500;
    }
    .file-size {
      color: var(--text-muted);
      font-size: 0.8rem;
    }
    .remove-btn {
      background: transparent;
      color: var(--error);
      padding: 0.5rem;
      min-height: auto;
      border-radius: 50%;
    }
    .remove-btn:hover {
      background: rgba(220, 38, 38, 0.1);
      box-shadow: none;
      transform: none;
    }
  `]
})
export class FileUploadComponent {
  @Input() accept = '*/*';
  @Input() multiple = false;
  @Input() hint = '';
  
  @Output() filesChanged = new EventEmitter<File[]>();

  files: File[] = [];
  isDragging = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles) {
      this.addFiles(Array.from(droppedFiles));
    }
  }

  onFileSelected(event: any) {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      this.addFiles(Array.from(selectedFiles));
    }
  }

  private addFiles(newFiles: File[]) {
    if (this.multiple) {
      this.files = [...this.files, ...newFiles];
    } else {
      this.files = newFiles.slice(0, 1);
    }
    this.filesChanged.emit(this.files);
  }

  removeFile(index: number) {
    this.files.splice(index, 1);
    this.filesChanged.emit(this.files);
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
