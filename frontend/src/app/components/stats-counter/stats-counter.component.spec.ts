import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StatsCounterComponent } from './stats-counter.component';

describe('StatsCounterComponent', () => {
  let component: StatsCounterComponent;
  let fixture: ComponentFixture<StatsCounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsCounterComponent, BrowserAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(StatsCounterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 3 stats', () => {
    expect(component.stats.length).toBe(3);
  });

  it('should initialize stats with currentValue 0', () => {
    component.stats.forEach(stat => {
      expect(stat.currentValue).toBe(0);
    });
  });

  it('should have correct final values', () => {
    expect(component.stats[0].finalValue).toBe(2500);
    expect(component.stats[1].finalValue).toBe(500);
    expect(component.stats[2].finalValue).toBe(98);
  });

  it('should have correct suffixes', () => {
    expect(component.stats[0].suffix).toBe('+');
    expect(component.stats[1].suffix).toBe('+');
    expect(component.stats[2].suffix).toBe('%');
  });

  it('should animate counters to final values', fakeAsync(() => {
    fixture.detectChanges();
    tick(3000);

    expect(component.stats[0].currentValue).toBe(2500);
    expect(component.stats[1].currentValue).toBe(500);
    expect(component.stats[2].currentValue).toBe(98);
  }));

  it('should render stat items', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const statItems = compiled.querySelectorAll('.stat-item');
    expect(statItems.length).toBe(3);
  });

  it('should display correct icons', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const icons = compiled.querySelectorAll('.stat-icon');
    expect(icons[0].textContent?.trim()).toBe('📄');
    expect(icons[1].textContent?.trim()).toBe('📊');
    expect(icons[2].textContent?.trim()).toBe('⭐');
  });

  it('should clean up on destroy', () => {
    fixture.detectChanges();
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
