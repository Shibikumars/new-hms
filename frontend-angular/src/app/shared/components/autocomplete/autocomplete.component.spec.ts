import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { AutocompleteComponent, AutocompleteItem } from './autocomplete.component';

describe('AutocompleteComponent', () => {
  let component: AutocompleteComponent;
  let fixture: ComponentFixture<AutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutocompleteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display placeholder', () => {
    component.placeholder = 'Search items...';
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    expect(input.placeholder).toBe('Search items...');
  });

  it('should emit search event on input with debounce', fakeAsync(() => {
    spyOn(component.search, 'emit');
    component.query = 'test';
    component.onInput();
    tick(300);
    expect(component.search.emit).toHaveBeenCalledWith('test');
    discardPeriodicTasks();
  }));

  it('should not emit search for query < 2 characters', fakeAsync(() => {
    spyOn(component.search, 'emit');
    component.query = 't';
    component.onInput();
    tick(300);
    expect(component.search.emit).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should show dropdown on focus when query >= 2', () => {
    component.query = 'test';
    component.onFocus();
    expect(component.showDropdown).toBeTrue();
  });

  it('should not show dropdown on focus when query < 2', () => {
    component.query = 't';
    component.onFocus();
    expect(component.showDropdown).toBeFalse();
  });

  it('should hide dropdown on blur after delay', fakeAsync(() => {
    component.query = 'test';
    component.showDropdown = true;
    component.onBlur();
    tick(200);
    expect(component.showDropdown).toBeFalse();
    discardPeriodicTasks();
  }));

  it('should clear query and results on clear()', () => {
    component.query = 'test';
    component.results = [{ id: 1, label: 'Test' }];
    component.showDropdown = true;
    component.clear();
    expect(component.query).toBe('');
    expect(component.results).toEqual([]);
    expect(component.showDropdown).toBeFalse();
  });

  it('should emit selected event when item selected', () => {
    spyOn(component.selected, 'emit');
    const item: AutocompleteItem = { id: 1, label: 'Test Item' };
    component.selectItem(item);
    expect(component.query).toBe('Test Item');
    expect(component.showDropdown).toBeFalse();
    expect(component.selected.emit).toHaveBeenCalledWith(item);
  });

  it('should emit selected event when suggestion selected', () => {
    spyOn(component.selected, 'emit');
    component.selectSuggestion('Test Suggestion');
    expect(component.query).toBe('Test Suggestion');
    expect(component.showDropdown).toBeFalse();
    expect(component.selected.emit).toHaveBeenCalledWith('Test Suggestion');
  });

  it('should set noResults when results empty and query >= 2', () => {
    component.query = 'test';
    component.results = [];
    component.suggestions = [];
    component.ngOnChanges({ results: {} as any, suggestions: {} as any });
    expect(component.noResults).toBeTrue();
  });

  it('should not set noResults when results exist', () => {
    component.query = 'test';
    component.results = [{ id: 1, label: 'Test' }];
    component.ngOnChanges({ results: {} as any });
    expect(component.noResults).toBeFalse();
  });

  it('should unsubscribe on destroy', () => {
    const subSpy = spyOn(component['sub'], 'unsubscribe');
    component.ngOnDestroy();
    expect(subSpy).toHaveBeenCalled();
  });

  it('should have disabled input property', () => {
    component.disabled = true;
    expect(component.disabled).toBeTrue();
  });

  it('should show spinner when loading', () => {
    component.loading = true;
    component.query = 'test';
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('.spinner');
    expect(spinner).toBeTruthy();
  });

  it('should show clear button when query exists and not loading', () => {
    component.query = 'test';
    component.loading = false;
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('.clear-btn');
    expect(clearBtn).toBeTruthy();
  });

  it('should hide dropdown when loading changes to true', () => {
    component.query = 'test';
    component.loading = false;
    component.showDropdown = true;
    component.ngOnChanges({ loading: {} as any });
    expect(component.showDropdown).toBeTrue();
  });

  it('should show dropdown when loading changes to false with query >= 2', () => {
    component.query = 'test';
    component.loading = true;
    component.ngOnChanges({ loading: {} as any });
    expect(component.showDropdown).toBeFalse();
  });
});
