import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { WhatifSimulatorComponent } from './whatif-simulator.component';
import { LangService } from '../lang.service';

describe('WhatifSimulatorComponent', () => {
  let component: WhatifSimulatorComponent;
  let fixture: ComponentFixture<WhatifSimulatorComponent>;
  let httpMock: HttpTestingController;
  let lang: LangService;

  const mockProviders = [
    {
      id: 'p1',
      providerName: 'AWS',
      providerCountry: 'US',
      serviceType: 'cloud',
      criticality: 'CRITICAL',
      riskScore: 75,
      hasExitStrategy: false
    },
    {
      id: 'p2',
      providerName: 'Telia',
      providerCountry: 'Estonia',
      serviceType: 'network',
      criticality: 'HIGH',
      riskScore: 40,
      hasExitStrategy: true,
      exitStrategyDescription: 'Switch to Elisa within 30 days'
    },
    {
      id: 'p3',
      providerName: 'LocalIT',
      providerCountry: 'EE',
      serviceType: 'hosting',
      criticality: 'LOW',
      riskScore: 20,
      hasExitStrategy: true
    },
    {
      id: 'p4',
      providerName: 'PayPro',
      providerCountry: 'DE',
      serviceType: 'payment',
      criticality: 'MEDIUM',
      riskScore: 50,
      hasExitStrategy: false
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatifSimulatorComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WhatifSimulatorComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    lang = TestBed.inject(LangService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ===== Initialization =====

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      httpMock.expectOne('/api/ict-providers').flush(mockProviders);
      expect(component).toBeTruthy();
    });

    it('should load providers from API on init', fakeAsync(() => {
      fixture.detectChanges();
      const req = httpMock.expectOne('/api/ict-providers');
      req.flush(mockProviders);
      tick();

      expect(component.providers().length).toBe(4);
      expect(component.loading()).toBeFalse();
    }));

    it('should handle API error gracefully', fakeAsync(() => {
      fixture.detectChanges();
      const req = httpMock.expectOne('/api/ict-providers');
      req.error(new ProgressEvent('error'));
      tick();

      expect(component.providers().length).toBe(0);
      expect(component.loading()).toBeFalse();
    }));

    it('should show loading state initially', () => {
      fixture.detectChanges();
      expect(component.loading()).toBeTrue();
      httpMock.expectOne('/api/ict-providers').flush([]);
    });

    it('should have no selected provider initially', () => {
      fixture.detectChanges();
      httpMock.expectOne('/api/ict-providers').flush(mockProviders);
      expect(component.selectedProvider()).toBeNull();
      expect(component.impact()).toBeNull();
    });
  });

  // ===== Severity Calculation =====

  describe('Severity calculation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      httpMock.expectOne('/api/ict-providers').flush(mockProviders);
    });

    it('CRITICAL provider yields CRITICAL severity', () => {
      component.simulateFailure(mockProviders[0]); // AWS - CRITICAL
      expect(component.impact()!.severity).toBe('CRITICAL');
    });

    it('HIGH provider yields HIGH severity', () => {
      component.simulateFailure(mockProviders[1]); // Telia - HIGH
      expect(component.impact()!.severity).toBe('HIGH');
    });

    it('LOW provider yields LOW severity', () => {
      component.simulateFailure(mockProviders[2]); // LocalIT - LOW
      expect(component.impact()!.severity).toBe('LOW');
    });

    it('MEDIUM provider without exit strategy yields HIGH severity', () => {
      component.simulateFailure(mockProviders[3]); // PayPro - MEDIUM, no exit
      expect(component.impact()!.severity).toBe('HIGH');
    });

    it('MEDIUM provider with exit strategy yields MEDIUM severity', () => {
      const mediumWithExit = { ...mockProviders[3], hasExitStrategy: true };
      component.simulateFailure(mediumWithExit);
      expect(component.impact()!.severity).toBe('MEDIUM');
    });
  });

  // ===== Recovery Time =====

  describe('Recovery time calculation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      httpMock.expectOne('/api/ict-providers').flush(mockProviders);
    });

    it('CRITICAL non-EU without exit has longest recovery', () => {
      component.simulateFailure(mockProviders[0]); // CRITICAL, US, no exit
      const hours = component.impact()!.estimatedRecoveryHours;
      // 120 base * 1.5 (no exit) * 1.2 (non-EU) = 216
      expect(hours).toBe(216);
    });

    it('LOW EU with exit has shortest recovery', () => {
      component.simulateFailure(mockProviders[2]); // LOW, EE, has exit
      const hours = component.impact()!.estimatedRecoveryHours;
      // 12 base, has exit (no multiplier), EU (no multiplier) = 12
      expect(hours).toBe(12);
    });

    it('no exit strategy increases recovery by 50%', () => {
      const withExit = { ...mockProviders[2], hasExitStrategy: true };
      const withoutExit = { ...mockProviders[2], hasExitStrategy: false, providerCountry: 'EE' };

      component.simulateFailure(withExit);
      const hoursWithExit = component.impact()!.estimatedRecoveryHours;

      component.simulateFailure(withoutExit);
      const hoursWithoutExit = component.impact()!.estimatedRecoveryHours;

      expect(hoursWithoutExit).toBe(Math.round(hoursWithExit * 1.5));
    });
  });

  // ===== Cascade Risk =====

  describe('Cascade risk', () => {
    beforeEach(() => {
      fixture.detectChanges();
      httpMock.expectOne('/api/ict-providers').flush(mockProviders);
    });

    it('CRITICAL has highest cascade risk', () => {
      component.simulateFailure(mockProviders[0]); // CRITICAL, no exit
      // 85 + 15 (no exit) = 100
      expect(component.impact()!.cascadeRisk).toBe(100);
    });

    it('LOW with exit has lowest cascade risk', () => {
      component.simulateFailure(mockProviders[2]); // LOW, has exit
      expect(component.impact()!.cascadeRisk).toBe(15);
    });

    it('no exit strategy adds 15 to cascade risk', () => {
      component.simulateFailure(mockProviders[1]); // HIGH, has exit
      const riskWithExit = component.impact()!.cascadeRisk; // 60

      const noExit = { ...mockProviders[1], hasExitStrategy: false };
      component.simulateFailure(noExit);
      const riskWithoutExit = component.impact()!.cascadeRisk; // 60 + 15 = 75

      expect(riskWithoutExit).toBe(riskWithExit + 15);
    });
  });

  // ===== Affected Services =====

  describe('Affected services', () => {
    beforeEach(() => {
      fixture.detectChanges();
      httpMock.expectOne('/api/ict-providers').flush(mockProviders);
    });

    it('cloud provider shows cloud-related services', () => {
      component.simulateFailure(mockProviders[0]); // cloud
      const services = component.impact()!.affectedServices;
      expect(services.length).toBeGreaterThan(0);
      // English by default
      expect(services).toContain('Cloud infrastructure');
    });

    it('network provider shows network-related services', () => {
      component.simulateFailure(mockProviders[1]); // network
      const services = component.impact()!.affectedServices;
      expect(services).toContain('Network connectivity');
    });

    it('hosting provider shows hosting-related services', () => {
      component.simulateFailure(mockProviders[2]); // hosting
      const services = component.impact()!.affectedServices;
      expect(services).toContain('Web hosting');
    });

    it('payment provider shows payment-related services', () => {
      component.simulateFailure(mockProviders[3]); // payment
      const services = component.impact()!.affectedServices;
      expect(services).toContain('Payment processing');
    });

    it('unknown service type shows default services', () => {
      const unknown = { ...mockProviders[0], serviceType: 'unknown-type' };
      component.simulateFailure(unknown);
      const services = component.impact()!.affectedServices;
      expect(services.length).toBeGreaterThan(0);
      expect(services).toContain('Service disruption');
    });
  });

  // ===== Mitigations =====

  describe('Mitigations', () => {
    beforeEach(() => {
      fixture.detectChanges();
      httpMock.expectOne('/api/ict-providers').flush(mockProviders);
    });

    it('no exit strategy adds DORA Art. 28(8) mitigation', () => {
      component.simulateFailure(mockProviders[0]); // no exit
      const mitigations = component.impact()!.mitigations;
      expect(mitigations.some(m => m.includes('exit strategy') || m.includes('Art. 28(8)'))).toBeTrue();
    });

    it('CRITICAL severity adds Art. 19 notification', () => {
      component.simulateFailure(mockProviders[0]); // CRITICAL
      const mitigations = component.impact()!.mitigations;
      expect(mitigations.some(m => m.includes('Art. 19'))).toBeTrue();
    });

    it('CRITICAL adds 4-hour notification requirement', () => {
      component.simulateFailure(mockProviders[0]); // CRITICAL
      const mitigations = component.impact()!.mitigations;
      expect(mitigations.some(m => m.includes('4 hour') || m.includes('4 tunni'))).toBeTrue();
    });

    it('non-EU provider adds GDPR assessment mitigation', () => {
      component.simulateFailure(mockProviders[0]); // US
      const mitigations = component.impact()!.mitigations;
      expect(mitigations.some(m => m.includes('GDPR') || m.includes('third-country'))).toBeTrue();
    });

    it('EU provider does not add GDPR mitigation', () => {
      component.simulateFailure(mockProviders[2]); // EE
      const mitigations = component.impact()!.mitigations;
      expect(mitigations.some(m => m.includes('GDPR'))).toBeFalse();
    });

    it('always includes audit trail mitigation', () => {
      component.simulateFailure(mockProviders[2]); // LOW
      const mitigations = component.impact()!.mitigations;
      expect(mitigations.some(m => m.includes('audit') || m.includes('Document'))).toBeTrue();
    });
  });

  // ===== Reset =====

  describe('Reset', () => {
    beforeEach(() => {
      fixture.detectChanges();
      httpMock.expectOne('/api/ict-providers').flush(mockProviders);
    });

    it('reset clears selected provider and impact', () => {
      component.simulateFailure(mockProviders[0]);
      expect(component.selectedProvider()).toBeTruthy();
      expect(component.impact()).toBeTruthy();

      component.reset();
      expect(component.selectedProvider()).toBeNull();
      expect(component.impact()).toBeNull();
    });
  });

  // ===== Financial Impact =====

  describe('Financial impact', () => {
    beforeEach(() => {
      fixture.detectChanges();
      httpMock.expectOne('/api/ict-providers').flush(mockProviders);
    });

    it('CRITICAL provider shows High financial impact', () => {
      component.simulateFailure(mockProviders[0]);
      expect(component.impact()!.financialImpact).toBe('High');
    });

    it('LOW provider shows Medium financial impact', () => {
      component.simulateFailure(mockProviders[2]);
      expect(component.impact()!.financialImpact).toBe('Medium');
    });
  });
});
