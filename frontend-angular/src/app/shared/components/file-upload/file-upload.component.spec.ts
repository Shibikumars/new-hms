import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUploadComponent } from './file-upload.component';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set accept attribute', () => {
    component.accept = 'image/*';
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="file"]');
    expect(input.accept).toBe('image/*');
  });

  it('should set multiple attribute', () => {
    component.multiple = true;
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="file"]');
    expect(input.multiple).toBeTrue();
  });

  it('should display hint when provided', () => {
    component.hint = 'Upload images only';
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('.upload-hint');
    expect(hint.textContent).toBe('Upload images only');
  });

  it('should set dragging state on dragover', () => {
    const event = new DragEvent('dragover', { bubbles: true });
    spyOn(event, 'preventDefault');
    component.onDragOver(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isDragging).toBeTrue();
  });

  it('should clear dragging state on dragleave', () => {
    component.isDragging = true;
    const event = new DragEvent('dragleave', { bubbles: true });
    spyOn(event, 'preventDefault');
    component.onDragLeave(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isDragging).toBeFalse();
  });

  it('should handle file drop', () => {
    spyOn(component.filesChanged, 'emit');
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const event = {
      preventDefault: jasmine.createSpy('preventDefault'),
      dataTransfer: { files: [file] }
    } as any;
    component.onDrop(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isDragging).toBeFalse();
    expect(component.files.length).toBe(1);
    expect(component.filesChanged.emit).toHaveBeenCalled();
  });

  it('should handle file selection', () => {
    spyOn(component.filesChanged, 'emit');
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [file] } };
    component.onFileSelected(event);
    expect(component.files.length).toBe(1);
    expect(component.filesChanged.emit).toHaveBeenCalled();
  });

  it('should add multiple files when multiple is true', () => {
    component.multiple = true;
    component.files = [new File(['a'], 'a.txt', { type: 'text/plain' })];
    const newFiles = [new File(['b'], 'b.txt', { type: 'text/plain' })];
    component['addFiles'](newFiles);
    expect(component.files.length).toBe(2);
  });

  it('should replace file when multiple is false', () => {
    component.multiple = false;
    component.files = [new File(['a'], 'a.txt', { type: 'text/plain' })];
    const newFiles = [new File(['b'], 'b.txt', { type: 'text/plain' })];
    component['addFiles'](newFiles);
    expect(component.files.length).toBe(1);
    expect(component.files[0].name).toBe('b.txt');
  });

  it('should remove file by index', () => {
    spyOn(component.filesChanged, 'emit');
    component.files = [
      new File(['a'], 'a.txt', { type: 'text/plain' }),
      new File(['b'], 'b.txt', { type: 'text/plain' })
    ];
    component.removeFile(0);
    expect(component.files.length).toBe(1);
    expect(component.files[0].name).toBe('b.txt');
    expect(component.filesChanged.emit).toHaveBeenCalled();
  });

  it('should format file size in bytes', () => {
    expect(component.formatSize(0)).toBe('0 Bytes');
    expect(component.formatSize(500)).toBe('500 Bytes');
  });

  it('should format file size in KB', () => {
    expect(component.formatSize(1024)).toBe('1 KB');
    expect(component.formatSize(2048)).toBe('2 KB');
  });

  it('should format file size in MB', () => {
    expect(component.formatSize(1048576)).toBe('1 MB');
    expect(component.formatSize(2097152)).toBe('2 MB');
  });

  it('should format file size in GB', () => {
    expect(component.formatSize(1073741824)).toBe('1 GB');
  });

  it('should display file list when files exist', () => {
    component.files = [new File(['content'], 'test.txt', { type: 'text/plain' })];
    fixture.detectChanges();
    const fileList = fixture.nativeElement.querySelector('.file-list');
    expect(fileList).toBeTruthy();
  });

  it('should not display file list when no files', () => {
    component.files = [];
    fixture.detectChanges();
    const fileList = fixture.nativeElement.querySelector('.file-list');
    expect(fileList).toBeFalsy();
  });
});
