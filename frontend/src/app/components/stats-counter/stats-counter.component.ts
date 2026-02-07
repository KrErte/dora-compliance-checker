import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { timer, Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

interface Stat {
  finalValue: number;
  suffix: string;
  label: string;
  icon: string;
  currentValue: number;
}

@Component({
  selector: 'app-stats-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-counter.component.html',
  styleUrls: ['./stats-counter.component.scss']
})
export class StatsCounterComponent implements OnInit, OnDestroy {
  stats: Stat[] = [
    { finalValue: 8, suffix: '', label: 'DORA Art. 30 nõuet', icon: '📋', currentValue: 0 },
    { finalValue: 5, suffix: ' min', label: 'lepingu analüüs', icon: '⚡', currentValue: 0 },
    { finalValue: 2, suffix: '%', label: 'maksimaalne trahv käibest', icon: '⚠️', currentValue: 0 }
  ];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.animateCounters();
  }

  animateCounters(): void {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    this.stats.forEach((stat, index) => {
      timer(index * 100, stepDuration)
        .pipe(
          take(steps + 1),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (step) => {
            if (step < steps) {
              const progress = this.easeOutQuad(step / steps);
              stat.currentValue = Math.floor(stat.finalValue * progress);
            } else {
              stat.currentValue = stat.finalValue;
            }
          },
          complete: () => {
            // Ensure final value is always set when animation completes
            stat.currentValue = stat.finalValue;
          }
        });
    });
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
