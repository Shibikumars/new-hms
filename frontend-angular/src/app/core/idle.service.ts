import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, timer, fromEvent, merge, BehaviorSubject } from 'rxjs';
import { switchMap, throttleTime, take, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class IdleService implements OnDestroy {
  private idleTimeout = 15 * 60 * 1000; // 15 minutes
  private warningTimeout = 60; // 60 seconds warning
  
  private idle$ = new Subject<boolean>();
  public idleState$ = this.idle$.asObservable();

  private countdown$ = new BehaviorSubject<number>(0);
  public countdownState$ = this.countdown$.asObservable();

  private activitySub?: Subscription;
  private timerSub?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone
  ) { }

  startTracking() {
    this.stopTracking();

    const activity$ = merge(
      fromEvent(window, 'mousemove'),
      fromEvent(window, 'keydown'),
      fromEvent(window, 'click'),
      fromEvent(window, 'scroll')
    ).pipe(throttleTime(1000));

    this.ngZone.runOutsideAngular(() => {
      this.activitySub = activity$.pipe(
        switchMap(() => timer(this.idleTimeout - (this.warningTimeout * 1000)))
      ).subscribe(() => {
        this.ngZone.run(() => {
          this.idle$.next(true); // Trigger warning
          this.startFinalCountdown();
        });
      });
    });
  }

  private startFinalCountdown() {
    this.timerSub?.unsubscribe();
    this.countdown$.next(this.warningTimeout);

    this.timerSub = timer(0, 1000).pipe(
      take(this.warningTimeout + 1),
      map(count => this.warningTimeout - count)
    ).subscribe({
      next: (val) => {
        this.countdown$.next(val);
        if (val === 0) {
          this.logout();
        }
      }
    });
  }

  stopTracking() {
    this.activitySub?.unsubscribe();
    this.timerSub?.unsubscribe();
    this.idle$.next(false);
    this.countdown$.next(0);
  }

  reset() {
    this.startTracking();
  }

  private logout() {
    this.authService.logout();
    this.stopTracking();
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy() {
    this.stopTracking();
  }
}
