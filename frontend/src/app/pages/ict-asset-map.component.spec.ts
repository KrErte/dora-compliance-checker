import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { IctAssetMapComponent } from './ict-asset-map.component';
import { LangService } from '../lang.service';

const emptyMapData = {
  functions: [],
  assets: [],
  providers: [],
  links: [],
  stats: { totalFunctions: 0, totalAssets: 0, totalProviders: 0, totalLinks: 0, criticalFunctions: 0 }
};

const populatedMapData = {
  functions: [
    { id: 'func-001', name: 'Payment Processing', description: 'Core payments', criticality: 'CRITICAL', type: 'function' },
    { id: 'func-002', name: 'Customer Portal', description: '', criticality: 'NORMAL', type: 'function' }
  ],
  assets: [
    { id: 'asset-001', name: 'Core Banking DB', description: 'PostgreSQL', assetType: 'DATABASE', rtoHours: 4, rpoHours: 1, type: 'asset' }
  ],
  providers: [
    { id: 'provider-p1', name: 'AWS', type: 'provider', serviceType: 'Cloud', criticality: 'CRITICAL', country: 'US', riskScore: 30 }
  ],
  links: [
    { id: 'link-001', sourceId: 'func-001', targetId: 'asset-001', label: 'Primary DB', dependency: 'REQUIRED' }
  ],
  stats: { totalFunctions: 2, totalAssets: 1, totalProviders: 1, totalLinks: 1, criticalFunctions: 1 }
};

describe('IctAssetMapComponent', () => {
  let component: IctAssetMapComponent;
  let fixture: ComponentFixture<IctAssetMapComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IctAssetMapComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IctAssetMapComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushInitialLoad(data: any = emptyMapData): void {
    const req = httpMock.expectOne('/api/ict-asset-map');
    req.flush(data);
  }

  // === Component Creation ===

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    flushInitialLoad();
  });

  it('starts with loading true on init', () => {
    fixture.detectChanges();
    expect(component.loading()).toBeTrue();
    flushInitialLoad();
  });

  // === Data Loading ===

  it('loads map data on init', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad(populatedMapData);
    tick();

    expect(component.loading()).toBeFalse();
    expect(component.functions().length).toBe(2);
    expect(component.assets().length).toBe(1);
    expect(component.providers().length).toBe(1);
    expect(component.links().length).toBe(1);
  }));

  it('handles load error gracefully', fakeAsync(() => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/ict-asset-map');
    req.flush({}, { status: 500, statusText: 'Error' });
    tick();

    expect(component.loading()).toBeFalse();
    expect(component.functions().length).toBe(0);
  }));

  // === Initial State ===

  it('has default newFunction values', () => {
    expect(component.newFunction.name).toBe('');
    expect(component.newFunction.criticality).toBe('NORMAL');
    fixture.detectChanges();
    flushInitialLoad();
  });

  it('has default newAsset values', () => {
    expect(component.newAsset.assetType).toBe('APPLICATION');
    expect(component.newAsset.rtoHours).toBe(24);
    expect(component.newAsset.rpoHours).toBe(4);
    fixture.detectChanges();
    flushInitialLoad();
  });

  it('has default newLink values', () => {
    expect(component.newLink.dependency).toBe('REQUIRED');
    expect(component.newLink.sourceId).toBe('');
    expect(component.newLink.targetId).toBe('');
    fixture.detectChanges();
    flushInitialLoad();
  });

  // === Add Function ===

  it('addFunction sends POST and updates signal', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    component.newFunction = { name: 'New Function', description: 'Test', criticality: 'CRITICAL' };
    component.addFunction();

    const req = httpMock.expectOne('/api/ict-asset-map/functions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('New Function');
    expect(req.request.body.criticality).toBe('CRITICAL');
    req.flush({
      success: true,
      function: { id: 'func-new', name: 'New Function', description: 'Test', criticality: 'CRITICAL', type: 'function' }
    });
    tick();

    expect(component.functions().length).toBe(1);
    expect(component.functions()[0].name).toBe('New Function');
    expect(component.showAddFunction).toBeFalse();
    expect(component.newFunction.name).toBe('');
  }));

  // === Add Asset ===

  it('addAsset sends POST and updates signal', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    component.newAsset = { name: 'Test DB', description: '', assetType: 'DATABASE', rtoHours: 8, rpoHours: 2 };
    component.addAsset();

    const req = httpMock.expectOne('/api/ict-asset-map/assets');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.assetType).toBe('DATABASE');
    req.flush({
      success: true,
      asset: { id: 'asset-new', name: 'Test DB', description: '', assetType: 'DATABASE', rtoHours: 8, rpoHours: 2, type: 'asset' }
    });
    tick();

    expect(component.assets().length).toBe(1);
    expect(component.assets()[0].assetType).toBe('DATABASE');
    expect(component.showAddAsset).toBeFalse();
  }));

  // === Add Link ===

  it('addLink sends POST when sourceId and targetId provided', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad(populatedMapData);
    tick();

    component.newLink = { sourceId: 'func-001', targetId: 'asset-001', label: 'Connection', dependency: 'REQUIRED' };
    component.addLink();

    const req = httpMock.expectOne('/api/ict-asset-map/links');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.sourceId).toBe('func-001');
    expect(req.request.body.targetId).toBe('asset-001');
    req.flush({
      success: true,
      link: { id: 'link-new', sourceId: 'func-001', targetId: 'asset-001', label: 'Connection', dependency: 'REQUIRED' }
    });
    tick();

    expect(component.links().length).toBe(2); // 1 from initial + 1 new
    expect(component.showAddLink).toBeFalse();
  }));

  it('addLink does nothing when sourceId empty', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    component.newLink = { sourceId: '', targetId: 'asset-001', label: '', dependency: 'REQUIRED' };
    component.addLink();

    httpMock.expectNone('/api/ict-asset-map/links');
    expect(component.links().length).toBe(0);
  }));

  it('addLink does nothing when targetId empty', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    component.newLink = { sourceId: 'func-001', targetId: '', label: '', dependency: 'REQUIRED' };
    component.addLink();

    httpMock.expectNone('/api/ict-asset-map/links');
    expect(component.links().length).toBe(0);
  }));

  // === Delete Function ===

  it('deleteFunction removes function and associated links', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad(populatedMapData);
    tick();

    expect(component.functions().length).toBe(2);
    expect(component.links().length).toBe(1);

    component.deleteFunction('func-001');

    const req = httpMock.expectOne('/api/ict-asset-map/functions/func-001');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
    tick();

    expect(component.functions().length).toBe(1);
    expect(component.functions()[0].id).toBe('func-002');
    // Link with sourceId func-001 should be removed
    expect(component.links().length).toBe(0);
  }));

  // === Delete Asset ===

  it('deleteAsset removes asset and associated links', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad(populatedMapData);
    tick();

    component.deleteAsset('asset-001');

    const req = httpMock.expectOne('/api/ict-asset-map/assets/asset-001');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
    tick();

    expect(component.assets().length).toBe(0);
    // Link with targetId asset-001 should be removed
    expect(component.links().length).toBe(0);
  }));

  // === Delete Link ===

  it('deleteLink removes only the specified link', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad(populatedMapData);
    tick();

    component.deleteLink('link-001');

    const req = httpMock.expectOne('/api/ict-asset-map/links/link-001');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
    tick();

    expect(component.links().length).toBe(0);
    // Functions and assets should remain
    expect(component.functions().length).toBe(2);
    expect(component.assets().length).toBe(1);
  }));

  // === Risk Analysis ===

  it('loadRiskAnalysis fetches and sets risk data', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad(populatedMapData);
    tick();

    component.loadRiskAnalysis();

    const req = httpMock.expectOne('/api/ict-asset-map/risk-analysis');
    expect(req.request.method).toBe('GET');
    req.flush({
      singlePointsOfFailure: [{ function: 'Payment Processing', criticality: 'CRITICAL', risk: 'Single point of failure', severity: 'HIGH' }],
      concentrationRisks: [],
      unmappedFunctions: [],
      totalRisks: 1,
      riskLevel: 'HIGH'
    });
    tick();

    expect(component.riskAnalysis()).toBeTruthy();
    expect(component.riskAnalysis()!.totalRisks).toBe(1);
    expect(component.riskAnalysis()!.riskLevel).toBe('HIGH');
    expect(component.riskAnalysis()!.singlePointsOfFailure.length).toBe(1);
  }));

  // === Computed Risk Classes ===

  it('riskBorderClass returns correct class for each level', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    component.riskAnalysis.set({ singlePointsOfFailure: [], concentrationRisks: [], unmappedFunctions: [], totalRisks: 0, riskLevel: 'CRITICAL' });
    expect(component.riskBorderClass()).toContain('red');

    component.riskAnalysis.set({ singlePointsOfFailure: [], concentrationRisks: [], unmappedFunctions: [], totalRisks: 0, riskLevel: 'HIGH' });
    expect(component.riskBorderClass()).toContain('amber');

    component.riskAnalysis.set({ singlePointsOfFailure: [], concentrationRisks: [], unmappedFunctions: [], totalRisks: 0, riskLevel: 'MEDIUM' });
    expect(component.riskBorderClass()).toContain('yellow');

    component.riskAnalysis.set({ singlePointsOfFailure: [], concentrationRisks: [], unmappedFunctions: [], totalRisks: 0, riskLevel: 'LOW' });
    expect(component.riskBorderClass()).toContain('blue');
  }));

  it('riskColorClass returns correct class for each level', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    component.riskAnalysis.set({ singlePointsOfFailure: [], concentrationRisks: [], unmappedFunctions: [], totalRisks: 0, riskLevel: 'CRITICAL' });
    expect(component.riskColorClass()).toContain('red');

    component.riskAnalysis.set({ singlePointsOfFailure: [], concentrationRisks: [], unmappedFunctions: [], totalRisks: 0, riskLevel: 'LOW' });
    expect(component.riskColorClass()).toContain('blue');
  }));

  // === Helper Methods ===

  it('getLinksFrom returns links with matching sourceId', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad(populatedMapData);
    tick();

    const links = component.getLinksFrom('func-001');
    expect(links.length).toBe(1);
    expect(links[0].targetId).toBe('asset-001');

    const noLinks = component.getLinksFrom('func-002');
    expect(noLinks.length).toBe(0);
  }));

  it('getNodeName returns name for functions, assets, providers', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad(populatedMapData);
    tick();

    expect(component.getNodeName('func-001')).toBe('Payment Processing');
    expect(component.getNodeName('asset-001')).toBe('Core Banking DB');
    expect(component.getNodeName('provider-p1')).toBe('AWS');
    expect(component.getNodeName('unknown-id')).toBe('unknown-id');
  }));

  // === Modal Toggles ===

  it('showAddFunction toggles correctly', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    expect(component.showAddFunction).toBeFalse();
    component.showAddFunction = true;
    expect(component.showAddFunction).toBeTrue();
  }));
});
