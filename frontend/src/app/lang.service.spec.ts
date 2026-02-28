import { TestBed } from '@angular/core/testing';
import { LangService } from './lang.service';

describe('LangService', () => {
  let service: LangService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LangService);
  });

  afterEach(() => localStorage.clear());

  it('should have a default language', () => {
    expect(['et', 'en']).toContain(service.currentLang);
  });

  it('toggle switches between et and en', () => {
    const initial = service.currentLang;
    service.toggle();
    const toggled = service.currentLang;
    expect(toggled).not.toBe(initial);
    expect(['et', 'en']).toContain(toggled);

    service.toggle();
    expect(service.currentLang).toBe(initial);
  });

  it('t() returns translation for known key', () => {
    // Test with a key we know exists
    const etText = service.t('nav.brand');
    expect(etText).toBeTruthy();
    expect(etText).toBe('DoraAudit.eu');
  });

  it('t() returns key itself for unknown key', () => {
    const result = service.t('nonexistent.key.here');
    expect(result).toBe('nonexistent.key.here');
  });

  it('translations work in both languages', () => {
    // Set to Estonian
    if (service.currentLang !== 'et') service.toggle();
    const etText = service.t('nav.history');
    expect(etText).toBe('Ajalugu');

    // Toggle to English
    service.toggle();
    const enText = service.t('nav.history');
    expect(enText).toBe('History');
  });

  it('persists language choice to localStorage', () => {
    service.toggle();
    const stored = localStorage.getItem('user-lang-choice');
    expect(stored).toBeTruthy();
    expect(['et', 'en']).toContain(stored!);
  });
});
