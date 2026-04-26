import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { ToastService, Toast } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('toasts$ should be empty initially', (done) => {
    service.toasts$.subscribe(toasts => {
      expect(toasts.length).toBe(0);
      done();
    });
  });

  it('show() should add a toast with generated id', (done) => {
    service.show({ title: 'Test', message: 'Hello', type: 'info', duration: 0 });
    service.toasts$.subscribe(toasts => {
      expect(toasts.length).toBe(1);
      expect(toasts[0].title).toBe('Test');
      expect(toasts[0].message).toBe('Hello');
      expect(toasts[0].type).toBe('info');
      expect(toasts[0].id).toBeTruthy();
      done();
    });
  });

  it('remove() should delete toast by id', (done) => {
    service.show({ title: 'A', message: 'B', type: 'success', duration: 0 });
    service.toasts$.subscribe(toasts => {
      if (toasts.length === 1) {
        const id = toasts[0].id;
        service.remove(id);
      }
    });

    setTimeout(() => {
      service.toasts$.subscribe(toasts => {
        expect(toasts.length).toBe(0);
        done();
      });
    }, 50);
  });

  it('toast should auto-remove after duration', fakeAsync(() => {
    service.show({ title: 'Temp', message: 'Temp msg', type: 'info', duration: 3000 });

    let toastCount = 0;
    service.toasts$.subscribe(t => (toastCount = t.length));

    expect(toastCount).toBe(1);
    tick(3000);
    expect(toastCount).toBe(0);
    discardPeriodicTasks();
  }));

  it('info() should add info toast', (done) => {
    service.info('Info Title', 'Info Message');
    service.toasts$.subscribe(toasts => {
      if (toasts.length > 0) {
        expect(toasts[0].type).toBe('info');
        expect(toasts[0].title).toBe('Info Title');
        done();
      }
    });
  });

  it('success() should add success toast', (done) => {
    service.success('Success', 'Operation complete');
    service.toasts$.subscribe(toasts => {
      if (toasts.length > 0) {
        expect(toasts[0].type).toBe('success');
        done();
      }
    });
  });

  it('error() should add error toast', (done) => {
    service.error('Error', 'Something went wrong');
    service.toasts$.subscribe(toasts => {
      if (toasts.length > 0) {
        expect(toasts[0].type).toBe('error');
        done();
      }
    });
  });

  it('warning() should add warning toast', (done) => {
    service.warning('Warn', 'Be careful');
    service.toasts$.subscribe(toasts => {
      if (toasts.length > 0) {
        expect(toasts[0].type).toBe('warning');
        done();
      }
    });
  });

  it('multiple toasts should accumulate', (done) => {
    service.show({ title: 'A', message: '1', type: 'info', duration: 0 });
    service.show({ title: 'B', message: '2', type: 'error', duration: 0 });
    service.show({ title: 'C', message: '3', type: 'success', duration: 0 });

    service.toasts$.subscribe(toasts => {
      if (toasts.length === 3) {
        expect(toasts.map(t => t.title)).toEqual(['A', 'B', 'C']);
        done();
      }
    });
  });

  it('toast with duration 0 should not auto-remove', fakeAsync(() => {
    service.show({ title: 'Persistent', message: 'Stays', type: 'info', duration: 0 });

    let toastCount = 0;
    service.toasts$.subscribe(t => (toastCount = t.length));

    expect(toastCount).toBe(1);
    tick(10000);
    expect(toastCount).toBe(1);
    discardPeriodicTasks();
  }));
});
