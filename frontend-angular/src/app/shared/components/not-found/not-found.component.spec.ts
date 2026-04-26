import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotFoundComponent } from './not-found.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display 404 error code', () => {
    const element = fixture.nativeElement.querySelector('.error-code');
    expect(element.textContent).toBe('404');
  });

  it('should display error title', () => {
    const element = fixture.nativeElement.querySelector('.error-title');
    expect(element.textContent).toContain('Clinical Path Not Found');
  });

  it('should display error message', () => {
    const element = fixture.nativeElement.querySelector('.error-msg');
    expect(element.textContent).toContain('restricted clinical resource');
  });

  it('should have return to dashboard link', () => {
    const link = fixture.nativeElement.querySelector('a[routerLink="/"]');
    expect(link).toBeTruthy();
    expect(link.textContent).toContain('Return to Dashboard');
  });

  it('should have report issue button', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Report System Anomaly');
  });

  it('should call reportIssue when button clicked', () => {
    spyOn(window, 'alert');
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(window.alert).toHaveBeenCalledWith('System anomaly report generated. Diagnostic packet sent to clinical IT operations.');
  });

  it('should display internal reference', () => {
    const footer = fixture.nativeElement.querySelector('.error-footer');
    expect(footer.textContent).toContain('ERR_PATH_INVALID');
  });

  it('should display system integrity status', () => {
    const footer = fixture.nativeElement.querySelector('.error-footer');
    expect(footer.textContent).toContain('OPTIMAL');
  });
});
