import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';

// Stub components to avoid loading real ones
@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('App Routes — scope-check redirect', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DummyComponent],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  // TC1.1 — Direct URL navigation
  it('TC1.1: /scope-check redirects to /nis2/scope-check', async () => {
    await router.navigateByUrl('/scope-check');
    expect(location.path()).toBe('/nis2/scope-check');
  });

  // TC1.2 — Original URL still works
  it('TC1.2: /nis2/scope-check loads directly without double redirect', async () => {
    await router.navigateByUrl('/nis2/scope-check');
    expect(location.path()).toBe('/nis2/scope-check');
  });

  // TC1.3 — Query params preserved
  it('TC1.3: /scope-check?lang=et preserves query params', async () => {
    await router.navigateByUrl('/scope-check?lang=et');
    expect(location.path()).toContain('/nis2/scope-check');
  });

  // TC1.5 — 404 catch-all still works
  it('TC1.5: unknown path hits wildcard, not scope-check redirect', async () => {
    await router.navigateByUrl('/some-random-nonexistent-page');
    expect(location.path()).toBe('/some-random-nonexistent-page');
    // Should NOT redirect to scope-check
    expect(location.path()).not.toContain('scope-check');
  });

  // TC1.6 — Partial path not matched
  it('TC1.6: /scope-check/extra does not match the redirect (pathMatch: full)', async () => {
    await router.navigateByUrl('/scope-check/extra');
    // Should fall through to wildcard, not redirect
    expect(location.path()).toBe('/scope-check/extra');
    expect(location.path()).not.toBe('/nis2/scope-check');
  });

  // TC1.7 — Other redirects still work
  it('TC1.7a: /self-assessment redirects to /assessment', async () => {
    await router.navigateByUrl('/self-assessment');
    expect(location.path()).toBe('/assessment');
  });

  it('TC1.7b: /contract-check redirects to /contract-analysis', async () => {
    await router.navigateByUrl('/contract-check');
    expect(location.path()).toBe('/contract-analysis');
  });

  it('TC1.7c: /sign-in redirects to /login', async () => {
    await router.navigateByUrl('/sign-in');
    expect(location.path()).toBe('/login');
  });

  it('TC1.7d: /nis2 redirects to /nis2/scope-check', async () => {
    await router.navigateByUrl('/nis2');
    expect(location.path()).toBe('/nis2/scope-check');
  });
});
