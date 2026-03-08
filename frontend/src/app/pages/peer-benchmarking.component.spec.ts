import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PeerBenchmarkingComponent } from './peer-benchmarking.component';
import { LangService } from '../lang.service';

describe('PeerBenchmarkingComponent', () => {
  let component: PeerBenchmarkingComponent;
  let fixture: ComponentFixture<PeerBenchmarkingComponent>;
  let httpMock: HttpTestingController;
  let lang: LangService;

  const mockHistory = [
    {
      id: 'test-1',
      scorePercentage: 72,
      complianceLevel: 'YELLOW',
      companyName: 'Test Corp',
      assessmentDate: '2025-12-01',
      pillarScores: {
        ICT_RISK_MANAGEMENT: 80,
        INCIDENT_MANAGEMENT: 65,
        TESTING: 55,
        THIRD_PARTY: 70,
        INFORMATION_SHARING: 90
      }
    }
  ];

  const mockBenchmark = {
    industryAverage: 61,
    median: 58,
    percentile25: 45,
    percentile75: 72,
    totalAssessments: 247,
    percentileRank: 68,
    complianceLevelDistribution: { GREEN: 18, YELLOW: 52, RED: 30 },
    industryBenchmarks: {
      banking: { average: 67, label: 'Banking & Credit' },
      insurance: { average: 62, label: 'Insurance' },
      fintech: { average: 52, label: 'FinTech' }
    },
    pillarAverages: {
      ICT_RISK_MANAGEMENT: 63.5,
      INCIDENT_MANAGEMENT: 58.2,
      TESTING: 51.8,
      THIRD_PARTY: 66.3,
      INFORMATION_SHARING: 47.1
    }
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [PeerBenchmarkingComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function createComponent() {
    fixture = TestBed.createComponent(PeerBenchmarkingComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    lang = TestBed.inject(LangService);
  }

  // ===== No Assessment State =====

  describe('No assessment data', () => {
    it('should create the component', () => {
      createComponent();
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should show no-assessment state when localStorage is empty', () => {
      createComponent();
      fixture.detectChanges();
      expect(component.latestEntry()).toBeNull();
    });

    it('should not make API call when no history exists', () => {
      createComponent();
      fixture.detectChanges();
      httpMock.expectNone('/api/benchmarks/assessment/');
    });
  });

  // ===== Data Loading =====

  describe('With assessment data', () => {
    beforeEach(() => {
      localStorage.setItem('dora_history', JSON.stringify(mockHistory));
    });

    it('should load latest entry from localStorage', () => {
      createComponent();
      fixture.detectChanges();

      const req = httpMock.expectOne('/api/benchmarks/assessment/72');
      req.flush(mockBenchmark);

      expect(component.latestEntry()).toBeTruthy();
      expect(component.latestEntry()!.scorePercentage).toBe(72);
      expect(component.latestEntry()!.companyName).toBe('Test Corp');
    });

    it('should fetch benchmark data from API', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();

      const req = httpMock.expectOne('/api/benchmarks/assessment/72');
      req.flush(mockBenchmark);
      tick();

      expect(component.benchmarkData()).toBeTruthy();
      expect(component.benchmarkData()!.industryAverage).toBe(61);
      expect(component.benchmarkData()!.percentileRank).toBe(68);
    }));

    it('should handle API error gracefully', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();

      const req = httpMock.expectOne('/api/benchmarks/assessment/72');
      req.error(new ProgressEvent('error'));
      tick();

      expect(component.benchmarkData()).toBeTruthy();
      expect(component.benchmarkData()!.industryAverage).toBe(61);
    }));
  });

  // ===== Radar Chart Geometry =====

  describe('Radar chart calculations', () => {
    beforeEach(() => {
      localStorage.setItem('dora_history', JSON.stringify(mockHistory));
    });

    it('getGridPolygon returns 5 points', () => {
      createComponent();
      fixture.detectChanges();
      httpMock.expectOne('/api/benchmarks/assessment/72').flush(mockBenchmark);

      const polygon = component.getGridPolygon(100);
      const points = polygon.split(' ');
      expect(points.length).toBe(5);
    });

    it('grid polygon at 100% should have points at full radius', () => {
      createComponent();
      fixture.detectChanges();
      httpMock.expectOne('/api/benchmarks/assessment/72').flush(mockBenchmark);

      const polygon = component.getGridPolygon(100);
      const points = polygon.split(' ').map(p => {
        const [x, y] = p.split(',').map(Number);
        return { x, y };
      });

      // First vertex should be at top (CX, CY - R)
      expect(points[0].x).toBeCloseTo(component.CX, 0);
      expect(points[0].y).toBeCloseTo(component.CY - component.R, 0);
    });

    it('grid polygon at 50% should be half the radius', () => {
      createComponent();
      fixture.detectChanges();
      httpMock.expectOne('/api/benchmarks/assessment/72').flush(mockBenchmark);

      const full = component.getGridPolygon(100);
      const half = component.getGridPolygon(50);

      const fullPoints = full.split(' ').map(p => p.split(',').map(Number));
      const halfPoints = half.split(' ').map(p => p.split(',').map(Number));

      // Distance from center should be half
      const fullDist = Math.sqrt(
        Math.pow(fullPoints[0][0] - component.CX, 2) +
        Math.pow(fullPoints[0][1] - component.CY, 2)
      );
      const halfDist = Math.sqrt(
        Math.pow(halfPoints[0][0] - component.CX, 2) +
        Math.pow(halfPoints[0][1] - component.CY, 2)
      );

      expect(halfDist).toBeCloseTo(fullDist / 2, 1);
    });

    it('vertices computed signal returns 5 points', () => {
      createComponent();
      fixture.detectChanges();
      httpMock.expectOne('/api/benchmarks/assessment/72').flush(mockBenchmark);

      expect(component.vertices().length).toBe(5);
    });
  });

  // ===== Computed Signals =====

  describe('Computed signals', () => {
    beforeEach(() => {
      localStorage.setItem('dora_history', JSON.stringify(mockHistory));
    });

    it('userPolygon returns valid polygon string', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      httpMock.expectOne('/api/benchmarks/assessment/72').flush(mockBenchmark);
      tick();

      const polygon = component.userPolygon();
      expect(polygon).toBeTruthy();
      expect(polygon.split(' ').length).toBe(5);
    }));

    it('industryPolygon uses pillar averages', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      httpMock.expectOne('/api/benchmarks/assessment/72').flush(mockBenchmark);
      tick();

      const polygon = component.industryPolygon();
      expect(polygon).toBeTruthy();
      expect(polygon.split(' ').length).toBe(5);
    }));

    it('pillarLabels returns 5 labels with scores', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      httpMock.expectOne('/api/benchmarks/assessment/72').flush(mockBenchmark);
      tick();

      const labels = component.pillarLabels();
      expect(labels.length).toBe(5);
      // Should use pillar scores from history
      expect(labels[0].score).toBe(80); // ICT_RISK_MANAGEMENT
      expect(labels[2].score).toBe(55); // TESTING
    }));

    it('pillarComparison calculates user vs industry', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      httpMock.expectOne('/api/benchmarks/assessment/72').flush(mockBenchmark);
      tick();

      const comparison = component.pillarComparison();
      expect(comparison.length).toBe(5);

      const ictRisk = comparison.find(c => c.id === 'ICT_RISK_MANAGEMENT')!;
      expect(ictRisk.userScore).toBe(80);
      expect(ictRisk.industryAvg).toBe(63.5);
    }));

    it('sectorRanking includes user entry and sorts by average', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      httpMock.expectOne('/api/benchmarks/assessment/72').flush(mockBenchmark);
      tick();

      const ranking = component.sectorRanking();
      expect(ranking.length).toBeGreaterThan(0);

      const userEntry = ranking.find(s => s.isUser);
      expect(userEntry).toBeTruthy();
      expect(userEntry!.average).toBe(72);

      // Should be sorted descending
      for (let i = 1; i < ranking.length; i++) {
        expect(ranking[i - 1].average).toBeGreaterThanOrEqual(ranking[i].average);
      }
    }));
  });

  // ===== Distribution Donut =====

  describe('Distribution chart', () => {
    beforeEach(() => {
      localStorage.setItem('dora_history', JSON.stringify(mockHistory));
    });

    it('buildDistribution sets arc values', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      httpMock.expectOne('/api/benchmarks/assessment/72').flush(mockBenchmark);
      tick();

      expect(component.distGreen).toBe(18);
      expect(component.distYellow).toBe(52);
      expect(component.distRed).toBe(30);
      expect(component.distTotal).toBe(247);
    }));

    it('arcs sum to full circle circumference', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      httpMock.expectOne('/api/benchmarks/assessment/72').flush(mockBenchmark);
      tick();

      const totalArc = component.greenArc + component.yellowArc + component.redArc;
      expect(totalArc).toBeCloseTo(314.16, 0);
    }));
  });

  // ===== Constants =====

  describe('Constants', () => {
    it('has correct center and radius', () => {
      createComponent();
      fixture.detectChanges();
      expect(component.CX).toBe(150);
      expect(component.CY).toBe(140);
      expect(component.R).toBe(105);
    });

    it('has 5 grid levels', () => {
      createComponent();
      fixture.detectChanges();
      expect(component.gridLevels).toEqual([20, 40, 60, 80, 100]);
    });

    it('has 5 pillar IDs', () => {
      createComponent();
      fixture.detectChanges();
      expect(component.PILLAR_IDS.length).toBe(5);
      expect(component.PILLAR_IDS).toContain('ICT_RISK_MANAGEMENT');
      expect(component.PILLAR_IDS).toContain('INFORMATION_SHARING');
    });
  });
});
