import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { DeadlineCalendarComponent } from './deadline-calendar.component';
import { LangService } from '../lang.service';

describe('DeadlineCalendarComponent', () => {
  let component: DeadlineCalendarComponent;
  let fixture: ComponentFixture<DeadlineCalendarComponent>;
  let lang: LangService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [DeadlineCalendarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeadlineCalendarComponent);
    component = fixture.componentInstance;
    lang = TestBed.inject(LangService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ===== Component Creation =====

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have 14 deadlines defined', () => {
    expect(component.deadlines.length).toBe(14);
  });

  it('should have 6 entity types including ALL', () => {
    expect(component.entityTypes.length).toBe(6);
    expect(component.entityTypes[0].key).toBe('ALL');
  });

  // ===== Entity Type Filtering =====

  describe('Entity type filtering', () => {
    it('default filter is ALL', () => {
      expect(component.selectedEntityType()).toBe('ALL');
    });

    it('toggleEntityType sets new type', () => {
      component.toggleEntityType('BANK');
      expect(component.selectedEntityType()).toBe('BANK');
    });

    it('toggleEntityType on same type resets to ALL', () => {
      component.toggleEntityType('BANK');
      expect(component.selectedEntityType()).toBe('BANK');

      component.toggleEntityType('BANK');
      expect(component.selectedEntityType()).toBe('ALL');
    });

    it('filtering by BANK shows BANK and ALL deadlines', () => {
      component.toggleEntityType('BANK');
      const filtered = component.allFilteredDeadlines();

      // All deadlines should have entityTypes containing 'ALL' or 'BANK'
      for (const d of filtered) {
        expect(d.entityTypes.includes('ALL') || d.entityTypes.includes('BANK')).toBeTrue();
      }
    });

    it('filtering by ICT_PROVIDER shows only ICT-relevant deadlines', () => {
      component.toggleEntityType('ICT_PROVIDER');
      const filtered = component.allFilteredDeadlines();

      for (const d of filtered) {
        expect(d.entityTypes.includes('ALL') || d.entityTypes.includes('ICT_PROVIDER')).toBeTrue();
      }
    });

    it('ALL filter shows all 14 deadlines', () => {
      const all = component.allFilteredDeadlines();
      expect(all.length).toBe(14);
    });

    it('BANK filter excludes ICT_PROVIDER-only deadlines', () => {
      component.toggleEntityType('BANK');
      const filtered = component.allFilteredDeadlines();
      // d7 (CTPP designation) is ICT_PROVIDER-only, should be excluded
      const hasCtpp = filtered.some(d => d.id === 'd7');
      expect(hasCtpp).toBeFalse();
    });
  });

  // ===== Date Calculations =====

  describe('Date calculations', () => {
    it('daysUntil returns positive for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateStr = futureDate.toISOString().split('T')[0];
      const days = component.daysUntil(dateStr);
      // Allow +/- 1 due to UTC vs local timezone parsing
      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(31);
    });

    it('daysUntil returns negative for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const dateStr = pastDate.toISOString().split('T')[0];
      const days = component.daysUntil(dateStr);
      expect(days).toBeGreaterThanOrEqual(-11);
      expect(days).toBeLessThanOrEqual(-9);
    });

    it('isPast returns true for past dates', () => {
      expect(component.isPast('2020-01-01')).toBeTrue();
    });

    it('isPast returns false for future dates', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(component.isPast(future.toISOString().split('T')[0])).toBeFalse();
    });

    it('formatDate returns readable date string', () => {
      const formatted = component.formatDate('2026-06-15');
      // Should contain the year
      expect(formatted).toContain('2026');
    });
  });

  // ===== Progress Ring =====

  describe('Progress ring', () => {
    it('getProgressDash returns valid SVG dash values', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 180);
      const dash = component.getProgressDash(futureDate.toISOString().split('T')[0]);

      const [arc, circ] = dash.split(' ').map(Number);
      expect(arc).toBeGreaterThanOrEqual(0);
      expect(circ).toBeCloseTo(2 * Math.PI * 15, 1);
    });

    it('closer deadline has higher progress', () => {
      const near = new Date();
      near.setDate(near.getDate() + 30);
      const far = new Date();
      far.setDate(far.getDate() + 300);

      const nearDash = component.getProgressDash(near.toISOString().split('T')[0]);
      const farDash = component.getProgressDash(far.toISOString().split('T')[0]);

      const nearArc = Number(nearDash.split(' ')[0]);
      const farArc = Number(farDash.split(' ')[0]);

      expect(nearArc).toBeGreaterThan(farArc);
    });

    it('past deadline has maximum progress', () => {
      const dash = component.getProgressDash('2020-01-01');
      const [arc, circ] = dash.split(' ').map(Number);
      expect(arc).toBeCloseTo(circ, 1);
    });
  });

  // ===== Mark as Done =====

  describe('Mark as done', () => {
    it('markDone adds deadline to completed set', () => {
      const deadline = component.deadlines[0];
      component.markDone(deadline);

      expect(component.completedIds().has(deadline.id)).toBeTrue();
    });

    it('markDone saves to localStorage', () => {
      const deadline = component.deadlines[0];
      component.markDone(deadline);

      const stored = JSON.parse(localStorage.getItem('dora_deadline_completed') || '[]');
      expect(stored).toContain(deadline.id);
    });

    it('completed deadline shows in allFilteredDeadlines with completed flag', () => {
      const deadline = component.deadlines[0];
      component.markDone(deadline);

      const filtered = component.allFilteredDeadlines();
      const found = filtered.find(d => d.id === deadline.id);
      expect(found).toBeTruthy();
      expect(found!.completed).toBeTrue();
    });

    it('completed deadline is excluded from upcomingDeadlines', () => {
      // Find a future deadline
      const future = component.deadlines.find(d => !component.isPast(d.date));
      if (future) {
        const beforeCount = component.upcomingDeadlines().length;
        component.markDone(future);
        const afterCount = component.upcomingDeadlines().length;
        expect(afterCount).toBeLessThan(beforeCount);
      }
    });

    it('completed deadline is excluded from overdueDeadlines', () => {
      // Find a past deadline
      const past = component.deadlines.find(d => component.isPast(d.date));
      if (past) {
        const beforeCount = component.overdueDeadlines().length;
        component.markDone(past);
        const afterCount = component.overdueDeadlines().length;
        expect(afterCount).toBeLessThan(beforeCount);
      }
    });

    it('loads completed IDs from localStorage on init', () => {
      localStorage.setItem('dora_deadline_completed', JSON.stringify(['d1', 'd2']));

      // Recreate component to test init loading
      fixture = TestBed.createComponent(DeadlineCalendarComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.completedIds().has('d1')).toBeTrue();
      expect(component.completedIds().has('d2')).toBeTrue();
    });
  });

  // ===== Category Classes =====

  describe('Category classes', () => {
    it('ROI returns violet class', () => {
      expect(component.getCategoryClass('ROI')).toContain('violet');
    });

    it('TLPT returns red class', () => {
      expect(component.getCategoryClass('TLPT')).toContain('red');
    });

    it('REPORT returns cyan class', () => {
      expect(component.getCategoryClass('REPORT')).toContain('cyan');
    });

    it('CONTRACT returns amber class', () => {
      expect(component.getCategoryClass('CONTRACT')).toContain('amber');
    });

    it('TRAINING returns emerald class', () => {
      expect(component.getCategoryClass('TRAINING')).toContain('emerald');
    });

    it('GENERAL returns slate class', () => {
      expect(component.getCategoryClass('GENERAL')).toContain('slate');
    });

    it('unknown category returns slate fallback', () => {
      expect(component.getCategoryClass('UNKNOWN')).toContain('slate');
    });
  });

  // ===== Sorting =====

  describe('Sorting', () => {
    it('allFilteredDeadlines are sorted by date ascending', () => {
      const all = component.allFilteredDeadlines();
      for (let i = 1; i < all.length; i++) {
        const prev = new Date(all[i - 1].date).getTime();
        const curr = new Date(all[i].date).getTime();
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });
  });

  // ===== Computed Signals =====

  describe('Computed signals', () => {
    it('upcomingDeadlines only contains future non-completed items', () => {
      const upcoming = component.upcomingDeadlines();
      for (const d of upcoming) {
        expect(d.completed).toBeFalsy();
        expect(component.isPast(d.date)).toBeFalse();
      }
    });

    it('overdueDeadlines only contains past non-completed items', () => {
      const overdue = component.overdueDeadlines();
      for (const d of overdue) {
        expect(d.completed).toBeFalsy();
        expect(component.isPast(d.date)).toBeTrue();
      }
    });

    it('upcoming + overdue + completed = all filtered', () => {
      const all = component.allFilteredDeadlines();
      const upcoming = component.upcomingDeadlines();
      const overdue = component.overdueDeadlines();
      const completed = all.filter(d => d.completed);

      expect(upcoming.length + overdue.length + completed.length).toBe(all.length);
    });
  });
});
