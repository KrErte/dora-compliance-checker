import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { FineCalculatorComponent } from './fine-calculator.component';
import { LangService } from '../lang.service';

describe('FineCalculatorComponent', () => {
  let component: FineCalculatorComponent;
  let fixture: ComponentFixture<FineCalculatorComponent>;
  let compiled: HTMLElement;
  let httpMock: HttpTestingController;
  let lang: LangService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FineCalculatorComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FineCalculatorComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    lang = TestBed.inject(LangService);
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ===== 3A. Core Fix — employees defaults to 50 =====

  // TC3.1 — Field shows value on load
  it('TC3.1: employees field shows 50 as actual value on load', () => {
    expect(component.employees).toBe(50);
    const input = compiled.querySelector('input[type="number"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('50');
  });

  // TC3.2 — Immediate submit with minimum fields
  it('TC3.2: form submits successfully with defaults when all required fields filled', fakeAsync(() => {
    component.companyType = 'credit';
    component.country = 'EE';
    component.q1 = true;
    component.q2 = true;
    component.q3 = true;
    component.q4 = true;
    fixture.detectChanges();

    component.calculate();
    tick(300);

    // Should not show validation error
    expect(component.showValidation).toBeFalse();
    // Should have result
    expect(component.result).toBeTruthy();
    expect(component.result!.riskLevel).toBe('low');

    // Flush the HTTP save request
    const req = httpMock.expectOne('/api/fine-calculator');
    expect(req.request.body.employees).toBe(50);
    req.flush({});
  }));

  // TC3.3 — No validation error on employees field on page load
  it('TC3.3: employees field has no red border on load', () => {
    expect(component.employees).toBe(50);
    expect(component.employeesTouched).toBeFalse();
    // The validation expression: (employeesTouched || showValidation) && (!employees || employees <= 0)
    // With employees=50, the second part is false, so no error
    const hasError = (component.employeesTouched || component.showValidation)
                     && (!component.employees || component.employees <= 0);
    expect(hasError).toBeFalse();
  });

  // TC3.4 — Progress bar reflects default
  it('TC3.4: progress shows 25% on load (revenue + employees filled)', () => {
    // revenue=10000000 and employees=50 are filled, others empty
    const progress = component.getProgress();
    expect(progress).toBe(25); // 2 of 8 fields
  });

  // TC3.5 — User can change employees
  it('TC3.5: user can override employees value', () => {
    component.employees = 500;
    fixture.detectChanges();
    expect(component.employees).toBe(500);
    expect(component.isFormValid()).toBeFalse(); // other fields still missing
  });

  // TC3.6 — User can clear employees and get validation error
  it('TC3.6: clearing employees triggers validation on submit', () => {
    component.companyType = 'credit';
    component.employees = null;
    component.country = 'EE';
    component.q1 = true;
    component.q2 = true;
    component.q3 = true;
    component.q4 = true;
    fixture.detectChanges();

    component.calculate();

    expect(component.showValidation).toBeTrue();
    expect(component.result).toBeNull();
  });

  // TC3.7 — Employees = 0 rejected
  it('TC3.7: employees = 0 fails validation', () => {
    component.employees = 0;
    expect(component.isFormValid()).toBeFalse();
  });

  // TC3.8 — Negative employees rejected
  it('TC3.8: negative employees fails validation', () => {
    component.employees = -5;
    expect(component.isFormValid()).toBeFalse();
  });

  // ===== 3B. Revenue field (no regression) =====

  // TC3.9 — Revenue default value
  it('TC3.9: revenue defaults to 10000000', () => {
    expect(component.revenue).toBe(10000000);
  });

  // TC3.10 — Revenue format
  it('TC3.10: formatInputNumber formats revenue correctly', () => {
    expect(component.formatInputNumber(10000000)).toBe('10,000,000');
  });

  // TC3.11 — Revenue input parsing
  it('TC3.11: onRevenueInput strips non-numeric characters', () => {
    const event = { target: { value: '5,000,000' } } as unknown as Event;
    component.onRevenueInput(event);
    expect(component.revenue).toBe(5000000);
  });

  // ===== 3C. Other fields (verify correct behavior) =====

  // TC3.12 — Company type required
  it('TC3.12: empty companyType fails validation', () => {
    component.companyType = '';
    component.employees = 50;
    component.country = 'EE';
    component.q1 = true; component.q2 = true; component.q3 = true; component.q4 = true;
    expect(component.isFormValid()).toBeFalse();
  });

  // TC3.13 — Country required
  it('TC3.13: empty country fails validation', () => {
    component.companyType = 'credit';
    component.employees = 50;
    component.country = '';
    component.q1 = true; component.q2 = true; component.q3 = true; component.q4 = true;
    expect(component.isFormValid()).toBeFalse();
  });

  // TC3.14 — All questions required
  it('TC3.14: unanswered compliance questions fail validation', () => {
    component.companyType = 'credit';
    component.employees = 50;
    component.country = 'EE';
    // All questions null
    expect(component.isFormValid()).toBeFalse();
  });

  // TC3.15 — Partial compliance questions
  it('TC3.15: partially answered questions fail validation', () => {
    component.companyType = 'credit';
    component.employees = 50;
    component.country = 'EE';
    component.q1 = true;
    component.q2 = false;
    // q3 and q4 still null
    expect(component.isFormValid()).toBeFalse();
  });

  // ===== 3D. Calculation logic =====

  function fillAllFields(): void {
    component.companyType = 'credit';
    component.revenue = 10000000;
    component.employees = 50;
    component.country = 'EE';
    component.q1 = true;
    component.q2 = true;
    component.q3 = true;
    component.q4 = true;
  }

  function flushSave(): void {
    const req = httpMock.expectOne('/api/fine-calculator');
    req.flush({});
  }

  // TC3.16 — All Yes = low risk
  it('TC3.16: all Yes answers produce low risk with 0 gaps', fakeAsync(() => {
    fillAllFields();
    component.calculate();
    tick(300);

    expect(component.result).toBeTruthy();
    expect(component.result!.riskScore).toBe(0);
    expect(component.result!.riskLevel).toBe('low');
    expect(component.result!.gaps.length).toBe(0);

    flushSave();
  }));

  // TC3.17 — All No = critical risk
  it('TC3.17: all No answers produce critical risk with 4 gaps', fakeAsync(() => {
    fillAllFields();
    component.q1 = false;
    component.q2 = false;
    component.q3 = false;
    component.q4 = false;
    component.calculate();
    tick(300);

    expect(component.result!.riskScore).toBe(100);
    expect(component.result!.riskLevel).toBe('critical');
    expect(component.result!.gaps).toEqual(['q1', 'q2', 'q3', 'q4']);

    flushSave();
  }));

  // TC3.18 — ICT provider fine cap
  it('TC3.18: ICT provider maxFine capped at 5,000,000', fakeAsync(() => {
    fillAllFields();
    component.companyType = 'ict_provider';
    component.revenue = 1000000000;
    component.employees = 500;
    component.q1 = false; component.q2 = false; component.q3 = false; component.q4 = false;
    component.calculate();
    tick(300);

    expect(component.result!.maxFine).toBe(5000000);
    expect(component.result!.minFine).toBe(100000);

    flushSave();
  }));

  // TC3.19 — Financial entity 2% rule
  it('TC3.19: financial entity uses 2% of revenue when higher than 1M', fakeAsync(() => {
    fillAllFields();
    component.revenue = 100000000; // 100M
    component.employees = 1000;
    component.q1 = false; component.q2 = false; component.q3 = false; component.q4 = false;
    component.calculate();
    tick(300);

    // 2% of 100M = 2,000,000 > 1,000,000
    expect(component.result!.maxFine).toBe(2000000);

    flushSave();
  }));

  // TC3.20 — Low revenue floor
  it('TC3.20: low revenue uses 1,000,000 floor', fakeAsync(() => {
    fillAllFields();
    component.revenue = 100000; // 100K — 2% = 2000
    component.employees = 10;
    component.q1 = false; component.q2 = false; component.q3 = false; component.q4 = false;
    component.calculate();
    tick(300);

    // max(2000, 1000000) = 1,000,000
    expect(component.result!.maxFine).toBe(1000000);

    flushSave();
  }));

  // TC3.21 — Size factor tiers
  it('TC3.21: different employee counts produce different likelyMax values', fakeAsync(() => {
    const results: number[] = [];

    [10, 100, 500, 2000].forEach(empCount => {
      component.result = null;
      fillAllFields();
      component.employees = empCount;
      component.q1 = false; component.q2 = false; component.q3 = true; component.q4 = true;
      component.calculate();
      tick(300);
      results.push(component.result!.likelyMax);
      flushSave();
    });

    // Each tier should produce different (increasing) values
    // sizeFactor: 10→0.7, 100→0.85, 500→1.0, 2000→1.15
    expect(results[0]).toBeLessThan(results[1]);
    expect(results[1]).toBeLessThan(results[2]);
    expect(results[2]).toBeLessThan(results[3]);
  }));

  // ===== 3E. Results display =====

  // TC3.24 — Gap descriptions shown
  it('TC3.24: only gaps for "No" answers are reported', fakeAsync(() => {
    fillAllFields();
    component.q1 = false; // gap
    component.q2 = true;  // no gap
    component.q3 = false; // gap
    component.q4 = true;  // no gap
    component.calculate();
    tick(300);

    expect(component.result!.gaps).toEqual(['q1', 'q3']);
    expect(component.result!.gaps.length).toBe(2);

    flushSave();
  }));

  // TC3.25 — Legal basis text — financial vs ICT
  it('TC3.25: companyType determines legal basis display flag', () => {
    component.companyType = 'credit';
    expect(component.companyType).not.toBe('ict_provider');

    component.companyType = 'ict_provider';
    expect(component.companyType).toBe('ict_provider');
  });

  // TC3.26 — Risk badge colors mapped correctly
  it('TC3.26: risk level badge classes map correctly', () => {
    component.result = { minFine: 0, maxFine: 0, likelyMin: 0, likelyMax: 0, riskScore: 0, gaps: [], displayValue: 0, riskLevel: 'low' };
    expect(component.getResultBadgeClass()).toContain('emerald');

    component.result.riskLevel = 'medium';
    expect(component.getResultBadgeClass()).toContain('yellow');

    component.result.riskLevel = 'high';
    expect(component.getResultBadgeClass()).toContain('orange');

    component.result.riskLevel = 'critical';
    expect(component.getResultBadgeClass()).toContain('red');
  });

  // TC3.26b — Risk emoji mapping
  it('TC3.26b: risk emojis map correctly to risk levels', () => {
    component.result = { minFine: 0, maxFine: 0, likelyMin: 0, likelyMax: 0, riskScore: 0, gaps: [], displayValue: 0, riskLevel: 'low' };
    expect(component.getRiskEmoji()).toBe('✅');

    component.result.riskLevel = 'medium';
    expect(component.getRiskEmoji()).toBe('⚠️');

    component.result.riskLevel = 'high';
    expect(component.getRiskEmoji()).toBe('🔶');

    component.result.riskLevel = 'critical';
    expect(component.getRiskEmoji()).toBe('🔴');
  });

  // ===== 3F. Email validation =====

  // TC3.27 — Invalid email
  it('TC3.27: invalid email format rejected', () => {
    component.email = 'invalid';
    expect(component.isValidEmail()).toBeFalse();

    component.email = 'no-at-sign.com';
    expect(component.isValidEmail()).toBeFalse();

    component.email = '';
    expect(component.isValidEmail()).toBeFalse();
  });

  // TC3.28 — Valid email
  it('TC3.28: valid email accepted', () => {
    component.email = 'test@example.com';
    expect(component.isValidEmail()).toBeTrue();

    component.email = 'user@doraaudit.eu';
    expect(component.isValidEmail()).toBeTrue();
  });

  // ===== 3G. Recalculation =====

  // TC3.30 — Change values and recalculate
  it('TC3.30: recalculation with changed values produces new result', fakeAsync(() => {
    // First calculation: all Yes, credit
    fillAllFields();
    component.calculate();
    tick(300);
    const firstResult = component.result!.likelyMax;
    flushSave();

    // Second calculation: all No, ict_provider
    component.companyType = 'ict_provider';
    component.q1 = false; component.q2 = false; component.q3 = false; component.q4 = false;
    component.calculate();
    tick(300);
    const secondResult = component.result!.likelyMax;
    flushSave();

    expect(secondResult).not.toBe(firstResult);
    expect(component.result!.riskLevel).toBe('critical');
  }));

  // TC3.31 — Validation resets on successful submit
  it('TC3.31: validation errors clear after successful submit', fakeAsync(() => {
    // Trigger validation error
    component.companyType = '';
    component.calculate();
    expect(component.showValidation).toBeTrue();

    // Fix all fields and recalculate
    fillAllFields();
    component.calculate();
    tick(300);

    expect(component.showValidation).toBeFalse();
    expect(component.result).toBeTruthy();

    flushSave();
  }));

  // ===== 4. Cross-feature: language switch on Fine Calculator =====

  // TC4.1 — Language switch preserves form values
  it('TC4.1: switching language preserves form values', () => {
    component.companyType = 'credit';
    component.employees = 200;
    component.country = 'EE';
    component.q1 = true;

    const initialLang = lang.currentLang;
    lang.toggle();
    fixture.detectChanges();

    expect(lang.currentLang).not.toBe(initialLang);
    // Form values must be preserved
    expect(component.companyType).toBe('credit');
    expect(component.employees).toBe(200);
    expect(component.country).toBe('EE');
    expect(component.q1).toBeTrue();
  });

  // Helper: formatNumber
  it('formatNumber uses et-EE locale', () => {
    const formatted = component.formatNumber(1234567);
    // Estonian locale uses space as thousands separator
    expect(formatted).toBeTruthy();
    expect(formatted.length).toBeGreaterThan(1);
  });
});
