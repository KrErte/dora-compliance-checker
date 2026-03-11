import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TourService {
  tourRequested = signal(false);

  isComplete(): boolean {
    if (typeof localStorage === 'undefined') return true;
    return localStorage.getItem('onboarding_tour_complete') === 'true';
  }

  startTour(): void {
    this.tourRequested.set(true);
  }

  completeTour(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('onboarding_tour_complete', 'true');
    }
    this.tourRequested.set(false);
  }

  resetTour(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('onboarding_tour_complete');
    }
  }
}
