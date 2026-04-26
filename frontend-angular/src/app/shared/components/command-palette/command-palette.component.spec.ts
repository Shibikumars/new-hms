import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { CommandPaletteComponent } from './command-palette.component';
import { RouterTestingModule } from '@angular/router/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CommandPaletteComponent', () => {
  let component: CommandPaletteComponent;
  let fixture: ComponentFixture<CommandPaletteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent, RouterTestingModule, OverlayModule, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle isOpen on toggle()', () => {
    expect(component.isOpen).toBeFalse();
    component.toggle();
    expect(component.isOpen).toBeTrue();
    component.toggle();
    expect(component.isOpen).toBeFalse();
  });

  it('should reset query and results on open', () => {
    component.query = 'test';
    component.results = [{ type: 'ACTION', title: 'Test', icon: 'ph-test' }];
    component.toggle();
    expect(component.isOpen).toBeTrue();
    expect(component.query).toBe('');
    expect(component.results).toEqual([]);
  });

  it('should close on close()', () => {
    component.isOpen = true;
    component.close();
    expect(component.isOpen).toBeFalse();
  });

  it('should trigger search on input with debounce', fakeAsync(() => {
    component.query = 'test';
    component.onSearch();
    tick(300);
    expect(component.results.length).toBeGreaterThan(0);
    discardPeriodicTasks();
  }));

  it('should not search for query < 2 characters', fakeAsync(() => {
    component.query = 't';
    component.onSearch();
    tick(300);
    expect(component.results.length).toBe(0);
    discardPeriodicTasks();
  }));

  it('should group results by type', () => {
    component.results = [
      { type: 'ACTION', title: 'Action 1', icon: 'ph-test' },
      { type: 'ACTION', title: 'Action 2', icon: 'ph-test' },
      { type: 'PATIENT', title: 'Patient 1', icon: 'ph-user' },
    ];
    const grouped = component.groupedResults;
    expect(grouped['ACTION'].length).toBe(2);
    expect(grouped['PATIENT'].length).toBe(1);
  });

  it('should navigate and close on execute', () => {
    const routerSpy = spyOn(component['router'], 'navigate');
    component.isOpen = true;
    const item = { type: 'ACTION' as const, title: 'Test', route: '/test', icon: 'ph-test' };
    component.execute(item);
    expect(routerSpy).toHaveBeenCalledWith(['/test']);
    expect(component.isOpen).toBeFalse();
  });

  it('should handle keyboard event for Cmd+K', () => {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    spyOn(event, 'preventDefault');
    component.handleKeyboardEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isOpen).toBeTrue();
  });

  it('should handle keyboard event for Ctrl+K', () => {
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    spyOn(event, 'preventDefault');
    component.handleKeyboardEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isOpen).toBeTrue();
  });

  it('should handle keyboard event for Alt+K', () => {
    const event = new KeyboardEvent('keydown', { key: 'k', altKey: true });
    spyOn(event, 'preventDefault');
    component.handleKeyboardEvent(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isOpen).toBeTrue();
  });

  it('should close on Escape key when open', () => {
    component.isOpen = true;
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    component.handleKeyboardEvent(event);
    expect(component.isOpen).toBeFalse();
  });

  it('should unsubscribe on destroy', () => {
    const subSpy = spyOn(component['sub'], 'unsubscribe');
    component.ngOnDestroy();
    expect(subSpy).toHaveBeenCalled();
  });
});
