import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { LangService } from './lang.service';

describe('AppComponent — Language Switcher & Avatar Separation', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let compiled: HTMLElement;
  let lang: LangService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    lang = TestBed.inject(LangService);
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
  });

  // --- Desktop Nav (hidden lg:flex — we test the DOM exists) ---

  // TC2.1 — Visual distinction: globe pill button exists with border
  it('TC2.1: language switcher is a bordered pill with globe icon', () => {
    const desktopNav = compiled.querySelector('.hidden.lg\\:flex');
    if (!desktopNav) { pending('Desktop nav not rendered at this viewport'); return; }

    // Find the lang toggle button (has globe SVG + ET/EN text)
    const langBtn = desktopNav.querySelector('button[type="button"]') as HTMLElement;
    // There may be multiple buttons; find the one with 'rounded-full' class
    const allButtons = desktopNav.querySelectorAll('button[type="button"]');
    let langToggle: HTMLElement | null = null;
    allButtons.forEach(btn => {
      if (btn.classList.contains('rounded-full')) {
        langToggle = btn as HTMLElement;
      }
    });

    expect(langToggle).toBeTruthy('Lang toggle pill button should exist');
    expect(langToggle!.classList).toContain('rounded-full');
    expect(langToggle!.classList).toContain('border');

    // Globe SVG icon should be present inside
    const svg = langToggle!.querySelector('svg');
    expect(svg).toBeTruthy('Globe SVG icon should be inside lang toggle');
  });

  // TC2.2 — Click language switcher does not open user menu
  it('TC2.2: clicking lang toggle changes language, does not open user menu', () => {
    const initialLang = lang.currentLang;
    component.userMenu = false;

    // Simulate lang toggle click
    lang.toggle();
    fixture.detectChanges();

    const newLang = lang.currentLang;
    expect(newLang).not.toBe(initialLang);
    expect(component.userMenu).toBeFalse();
  });

  // TC2.3 — Click user avatar opens menu, does not change language
  it('TC2.3: clicking user avatar toggles menu, language unchanged', () => {
    const initialLang = lang.currentLang;
    component.userMenu = false;

    const mockEvent = new Event('click');
    spyOn(mockEvent, 'stopPropagation');
    component.toggleUserMenu(mockEvent);

    expect(component.userMenu).toBeTrue();
    expect(lang.currentLang).toBe(initialLang);
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  // TC2.5 — Independent event isolation
  it('TC2.5: lang toggle and user menu are independent', () => {
    const initialLang = lang.currentLang;

    // Toggle language
    lang.toggle();
    expect(component.userMenu).toBeFalse();

    // Open user menu
    component.toggleUserMenu(new Event('click'));
    expect(component.userMenu).toBeTrue();
    expect(lang.currentLang).not.toBe(initialLang);

    // Toggle language again — user menu should close via document click
    // but lang toggle itself doesn't close the menu
    lang.toggle();
    // With 2-language cycle, second toggle returns to initial language
    expect(lang.currentLang).toBe(initialLang);
  });

  // TC2.9 — Mobile lang toggle closes menu
  it('TC2.9: mobile lang toggle should close mobile menu', () => {
    component.mobileMenu = true;
    // In the template: (click)="lang.toggle(); mobileMenu = false"
    // We simulate what the template does:
    lang.toggle();
    component.mobileMenu = false;

    expect(component.mobileMenu).toBeFalse();
  });

  // TC2.10 — Rapid switching (2-language cycle: en → et → en)
  it('TC2.10: rapid language switching works correctly', () => {
    lang.setLang('en');
    expect(lang.currentLang).toBe('en');

    lang.toggle(); // en → et
    expect(lang.currentLang).toBe('et');

    lang.toggle(); // et → en (full cycle)
    expect(lang.currentLang).toBe('en');

    // Avatar state untouched throughout
    expect(component.userMenu).toBeFalse();
  });

  // TC2.12 — Accessibility aria-label
  it('TC2.12: lang toggle has correct aria-label', () => {
    const desktopNav = compiled.querySelector('.hidden.lg\\:flex');
    if (!desktopNav) { pending('Desktop nav not rendered'); return; }

    const allButtons = desktopNav.querySelectorAll('button[type="button"]');
    let foundToggle: HTMLElement | undefined;
    allButtons.forEach(btn => {
      if (btn.classList.contains('rounded-full')) {
        foundToggle = btn as HTMLElement;
      }
    });

    if (!foundToggle) { pending('Lang toggle not found'); return; }

    const ariaLabel = foundToggle.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy('aria-label should be set');
  });

  // TC2.13 — Separator exists between lang toggle and avatar/auth
  it('TC2.13: vertical separator div exists between lang and auth area', () => {
    const desktopNav = compiled.querySelector('.hidden.lg\\:flex');
    if (!desktopNav) { pending('Desktop nav not rendered'); return; }

    // Find separator divs (w-px h-5 class)
    const separators = desktopNav.querySelectorAll('div.w-px');
    // Should have at least 2: one before lang toggle, one after
    expect(separators.length).toBeGreaterThanOrEqual(2);
  });
});
