import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ArticleTrackerComponent } from './article-tracker.component';
import { LangService } from '../lang.service';

const mockTrackerData = {
  chapters: [
    {
      number: 'I',
      title: 'General Provisions',
      articleRange: 'Art. 1-4',
      progress: 50,
      articles: [
        { id: 'art1', number: 'Article 1', title: 'Subject matter', pillar: 'GENERAL', status: 'compliant', evidenceCount: 2, notes: '' },
        { id: 'art2', number: 'Article 2', title: 'Scope', pillar: 'GENERAL', status: 'partial', evidenceCount: 1, notes: '' },
        { id: 'art3', number: 'Article 3', title: 'Definitions', pillar: 'GENERAL', status: 'non_compliant', evidenceCount: 0, notes: '' },
        { id: 'art4', number: 'Article 4', title: 'Proportionality', pillar: 'GENERAL', status: 'non_compliant', evidenceCount: 0, notes: '' }
      ]
    },
    {
      number: 'II',
      title: 'ICT Risk Management',
      articleRange: 'Art. 5-16',
      progress: 25,
      articles: [
        { id: 'art5', number: 'Article 5', title: 'Governance', pillar: 'ICT_RISK_MANAGEMENT', status: 'partial', evidenceCount: 1, notes: 'In progress' }
      ]
    }
  ],
  totalArticles: 5,
  compliant: 1,
  partial: 2,
  nonCompliant: 2,
  overallPercentage: 40
};

describe('ArticleTrackerComponent', () => {
  let component: ArticleTrackerComponent;
  let fixture: ComponentFixture<ArticleTrackerComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArticleTrackerComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ArticleTrackerComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushInitialLoad(): void {
    const req = httpMock.expectOne('/api/article-tracker');
    req.flush(mockTrackerData);
  }

  // === Component Creation ===

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    flushInitialLoad();
  });

  it('starts in loading state', () => {
    fixture.detectChanges();
    expect(component.loading()).toBeTrue();
    flushInitialLoad();
  });

  // === Data Loading ===

  it('loads tracker data on init', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    expect(component.loading()).toBeFalse();
    expect(component.data()).toBeTruthy();
    expect(component.data()!.totalArticles).toBe(5);
  }));

  it('sets error on load failure', fakeAsync(() => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/article-tracker');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    tick();

    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeTruthy();
  }));

  it('data is null before load completes', () => {
    expect(component.data()).toBeNull();
    fixture.detectChanges();
    flushInitialLoad();
  });

  // === Chapter/Article Interaction ===

  it('toggleChapter adds and removes from expandedChapters', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    expect(component.expandedChapters.has('I')).toBeFalse();

    component.toggleChapter('I');
    expect(component.expandedChapters.has('I')).toBeTrue();

    component.toggleChapter('I');
    expect(component.expandedChapters.has('I')).toBeFalse();
  }));

  it('toggleArticle expands and collapses', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    expect(component.expandedArticle).toBeNull();

    component.toggleArticle('art1');
    expect(component.expandedArticle).toBe('art1');

    component.toggleArticle('art1');
    expect(component.expandedArticle).toBeNull();
  }));

  it('toggleArticle switches between articles', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    component.toggleArticle('art1');
    expect(component.expandedArticle).toBe('art1');

    component.toggleArticle('art2');
    expect(component.expandedArticle).toBe('art2');
  }));

  it('toggleArticle clears save success', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    component.saveSuccess.set('art1');
    component.toggleArticle('art2');
    expect(component.saveSuccess()).toBeNull();
  }));

  // === Save Article ===

  it('saveArticle sends PUT request with correct data', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    const article = {
      id: 'art1',
      number: 'Article 1',
      title: 'Subject matter',
      pillar: 'GENERAL',
      status: 'compliant' as const,
      evidenceCount: 2,
      notes: 'Updated notes',
      responsiblePerson: 'John',
      targetDate: '2026-06-01'
    };

    component.saveArticle(article);
    expect(component.saving()).toBeTrue();

    const putReq = httpMock.expectOne('/api/article-tracker/art1');
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body.notes).toBe('Updated notes');
    expect(putReq.request.body.responsiblePerson).toBe('John');
    expect(putReq.request.body.targetDate).toBe('2026-06-01');
    expect(putReq.request.body.status).toBe('compliant');
    putReq.flush({ success: true });

    // Reload triggered
    const reloadReq = httpMock.expectOne('/api/article-tracker');
    reloadReq.flush(mockTrackerData);
    tick();

    expect(component.saving()).toBeFalse();
    expect(component.saveSuccess()).toBe('art1');
  }));

  it('saveArticle handles error gracefully', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    const article = {
      id: 'art1', number: 'Article 1', title: 'Test', pillar: 'GENERAL',
      status: 'compliant' as const, evidenceCount: 0, notes: ''
    };

    component.saveArticle(article);
    expect(component.saving()).toBeTrue();

    const putReq = httpMock.expectOne('/api/article-tracker/art1');
    putReq.flush({}, { status: 500, statusText: 'Error' });
    tick();

    expect(component.saving()).toBeFalse();
  }));

  // === Data Display ===

  it('displays correct compliance counts', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    const data = component.data()!;
    expect(data.compliant).toBe(1);
    expect(data.partial).toBe(2);
    expect(data.nonCompliant).toBe(2);
    expect(data.overallPercentage).toBe(40);
  }));

  it('displays correct chapter count', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    expect(component.data()!.chapters.length).toBe(2);
  }));

  // === Reload ===

  it('loadData resets error state', fakeAsync(() => {
    fixture.detectChanges();
    const req1 = httpMock.expectOne('/api/article-tracker');
    req1.flush({}, { status: 500, statusText: 'Error' });
    tick();

    expect(component.error()).toBeTruthy();

    component.loadData();
    expect(component.loading()).toBeTrue();
    expect(component.error()).toBeNull();

    const req2 = httpMock.expectOne('/api/article-tracker');
    req2.flush(mockTrackerData);
    tick();

    expect(component.data()).toBeTruthy();
    expect(component.error()).toBeNull();
  }));
});
