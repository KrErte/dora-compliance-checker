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
    expect(['et', 'en', 'fi', 'lv', 'lt', 'pl']).toContain(service.currentLang);
  });

  it('toggle cycles through all languages', () => {
    service.setLang('en');
    expect(service.currentLang).toBe('en');

    service.toggle();
    expect(service.currentLang).toBe('et');

    service.toggle();
    expect(service.currentLang).toBe('fi');

    service.toggle();
    expect(service.currentLang).toBe('lv');

    service.toggle();
    expect(service.currentLang).toBe('lt');

    service.toggle();
    expect(service.currentLang).toBe('pl');

    service.toggle();
    expect(service.currentLang).toBe('en');
  });

  it('t() returns translation for known key', () => {
    const etText = service.t('nav.brand');
    expect(etText).toBeTruthy();
    expect(etText).toBe('DoraAudit.eu');
  });

  it('t() returns key itself for unknown key', () => {
    const result = service.t('nonexistent.key.here');
    expect(result).toBe('nonexistent.key.here');
  });

  it('translations work in both languages', () => {
    service.setLang('et');
    expect(service.t('nav.history')).toBe('Ajalugu');

    service.setLang('en');
    expect(service.t('nav.history')).toBe('History');
  });

  it('persists language choice to localStorage', () => {
    service.toggle();
    const stored = localStorage.getItem('user-lang-choice');
    expect(stored).toBeTruthy();
    expect(['et', 'en', 'fi', 'lv', 'lt', 'pl']).toContain(stored!);
  });

  it('setLang works for all supported languages', () => {
    for (const lang of ['en', 'et', 'fi', 'lv', 'lt', 'pl'] as const) {
      service.setLang(lang);
      expect(service.currentLang).toBe(lang);
    }
  });

  it('availableLanguages contains all 6 languages', () => {
    const codes = service.availableLanguages.map(l => l.code);
    expect(codes).toEqual(['en', 'et', 'fi', 'lv', 'lt', 'pl']);
  });
});
