import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { IdleService } from './idle.service';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NgZone } from '@angular/core';
import { take } from 'rxjs/operators';

describe('IdleService', () => {
  let service: IdleService;
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);

    TestBed.configureTestingModule({
      providers: [
        IdleService,
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    service = TestBed.inject(IdleService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('countdownState$ should emit 0 initially', (done) => {
    service.countdownState$.pipe(take(1)).subscribe(val => {
      expect(val).toBe(0);
      done();
    });
  });

  it('idleState$ should be defined', () => {
    expect(service.idleState$).toBeTruthy();
  });

  it('stopTracking() should reset countdown to 0', fakeAsync(() => {
    service.startTracking();
    service.stopTracking();

    let countdown = -1;
    service.countdownState$.pipe(take(1)).subscribe(v => (countdown = v));
    tick(0);

    expect(countdown).toBe(0);
    discardPeriodicTasks();
  }));

  it('ngOnDestroy() should call stopTracking', () => {
    spyOn(service, 'stopTracking').and.callThrough();
    service.ngOnDestroy();
    expect(service.stopTracking).toHaveBeenCalled();
  });

  it('reset() should call startTracking', () => {
    spyOn(service, 'startTracking').and.callThrough();
    service.reset();
    expect(service.startTracking).toHaveBeenCalled();
  });
});
