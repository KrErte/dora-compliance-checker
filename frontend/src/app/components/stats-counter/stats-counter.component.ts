import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { timer, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
    { finalValue: 2500, suffix: '+', label: 'lepingut analüüsitud', icon: '📄', currentValue: 0 },
    { finalValue: 500, suffix: '+', label: 'organisatsiooni kasutab', icon: '📊', currentValue: 0 },
    { finalValue: 98, suffix: '%', label: 'kasutaja rahul', icon: '⭐', currentValue: 0 }
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
        .pipe(takeUntil(this.destroy$))
        .subscribe((step) => {
          if (step < steps) {
            const progress = this.easeOutQuad(step / steps);
            stat.currentValue = Math.floor(stat.finalValue * progress);
          } else {
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
