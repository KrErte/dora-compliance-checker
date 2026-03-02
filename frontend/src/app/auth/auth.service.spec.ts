import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse } from './auth.models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockAuthResponse: AuthResponse = {
    token: 'jwt-test-token-123',
    refreshToken: 'refresh-token-456',
    userId: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'USER',
    trialEndsAt: undefined
  };

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isLoggedIn returns false when no token', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('getToken returns null when no token stored', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getToken returns stored token', () => {
    localStorage.setItem('dora_token', 'stored-jwt');
    expect(service.getToken()).toBe('stored-jwt');
  });

  it('user returns null initially', () => {
    expect(service.user()).toBeNull();
  });

  it('login success stores token, refresh token, and user', () => {
    service.login({ email: 'test@example.com', password: 'password123' }).subscribe(res => {
      expect(res.token).toBe('jwt-test-token-123');
      expect(res.email).toBe('test@example.com');
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password123' });
    req.flush(mockAuthResponse);

    // Verify storage
    expect(localStorage.getItem('dora_token')).toBe('jwt-test-token-123');
    expect(localStorage.getItem('dora_refresh_token')).toBe('refresh-token-456');

    const storedUser = JSON.parse(localStorage.getItem('dora_user')!);
    expect(storedUser.email).toBe('test@example.com');
    expect(storedUser.fullName).toBe('Test User');
    expect(storedUser.userId).toBe('user-1');

    // Verify signals updated
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.user()?.email).toBe('test@example.com');
  });

  it('login failure does not store anything', () => {
    service.login({ email: 'bad@example.com', password: 'wrong' }).subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err.status).toBe(401);
      }
    });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('dora_token')).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('register calls correct endpoint and stores auth data', () => {
    service.register({ email: 'new@example.com', password: 'pass123', fullName: 'New User' }).subscribe(res => {
      expect(res.token).toBe('jwt-test-token-123');
    });

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'new@example.com',
      password: 'pass123',
      fullName: 'New User'
    });
    req.flush(mockAuthResponse);

    expect(localStorage.getItem('dora_token')).toBe('jwt-test-token-123');
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('logout clears storage, calls API, resets user, and navigates to login', () => {
    // Set up an authenticated state
    localStorage.setItem('dora_token', 'jwt-test-token-123');
    localStorage.setItem('dora_refresh_token', 'refresh-token-456');
    localStorage.setItem('dora_user', JSON.stringify({ userId: 'user-1', email: 'test@example.com', fullName: 'Test User' }));

    service.logout();

    // Logout fires a POST to the backend
    const req = httpMock.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-test-token-123');
    req.flush({});

    // Storage cleared
    expect(localStorage.getItem('dora_token')).toBeNull();
    expect(localStorage.getItem('dora_refresh_token')).toBeNull();
    expect(localStorage.getItem('dora_user')).toBeNull();

    // Signal reset
    expect(service.user()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();

    // Router navigated to login
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('logout without token does not call API but still clears state', () => {
    service.logout();

    // No HTTP request should be made since there's no token
    httpMock.expectNone('/api/auth/logout');

    expect(service.isLoggedIn()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('refreshAccessToken sends refresh token and updates auth', () => {
    localStorage.setItem('dora_refresh_token', 'refresh-token-456');

    service.refreshAccessToken().subscribe(newToken => {
      expect(newToken).toBe('new-jwt-token');
    });

    const req = httpMock.expectOne('/api/auth/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'refresh-token-456' });
    req.flush({ ...mockAuthResponse, token: 'new-jwt-token' });

    expect(localStorage.getItem('dora_token')).toBe('new-jwt-token');
  });

  it('refreshAccessToken logs out when no refresh token available', () => {
    // No refresh token in storage — logout() will be called.
    // Since there's no access token either, no /api/auth/logout request is fired.
    service.refreshAccessToken().subscribe({
      next: () => fail('should have errored'),
      error: (err) => {
        expect(err.message).toBe('No refresh token');
      }
    });

    // logout should have fired, navigating to /login
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('refreshAccessToken logs out on server error', () => {
    localStorage.setItem('dora_refresh_token', 'expired-token');

    service.refreshAccessToken().subscribe({
      next: () => fail('should have errored'),
      error: () => {
        // Expected
      }
    });

    const refreshReq = httpMock.expectOne('/api/auth/refresh');
    refreshReq.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

    // The catchError calls logout(). At this point the token stored by handleAuth
    // was never set (the request failed), but the refresh token is still in localStorage.
    // logout() reads the access token — which is null since the refresh failed —
    // so no /api/auth/logout request is sent.
    // However, if handleAuth stored a token before the error, we'd need to flush it.
    // Flush any outstanding logout request if present.
    httpMock.match('/api/auth/logout').forEach(r => r.flush({}));

    // Should have logged out
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('isAdmin returns true when user role is ADMIN', () => {
    const adminResponse: AuthResponse = {
      ...mockAuthResponse,
      role: 'ADMIN'
    };

    service.login({ email: 'admin@example.com', password: 'pass' }).subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    req.flush(adminResponse);

    expect(service.isAdmin()).toBeTrue();
  });

  it('isAdmin returns false for regular users', () => {
    service.login({ email: 'user@example.com', password: 'pass' }).subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    req.flush(mockAuthResponse);

    expect(service.isAdmin()).toBeFalse();
  });

  it('loadFromStorage restores user signal when token and user exist', () => {
    // Since AuthService is a singleton, we test the storage loading behavior
    // by setting storage first, then creating a fresh TestBed.
    localStorage.clear();
    localStorage.setItem('dora_token', 'existing-jwt');
    localStorage.setItem('dora_user', JSON.stringify({
      userId: 'user-1',
      email: 'stored@example.com',
      fullName: 'Stored User'
    }));

    // Reset TestBed to get a fresh service instance
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: Router, useValue: routerSpy }
      ]
    });

    const freshService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    expect(freshService.isLoggedIn()).toBeTrue();
    expect(freshService.user()?.email).toBe('stored@example.com');
  });

  it('loadFromStorage does not restore when token is missing', () => {
    localStorage.clear();
    localStorage.setItem('dora_user', JSON.stringify({
      userId: 'user-1',
      email: 'test@example.com',
      fullName: 'Test'
    }));
    // No token set

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: Router, useValue: routerSpy }
      ]
    });

    const freshService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    expect(freshService.isLoggedIn()).toBeFalse();
    expect(freshService.user()).toBeNull();
  });

  it('getRefreshToken returns stored refresh token', () => {
    localStorage.setItem('dora_refresh_token', 'my-refresh-token');
    expect(service.getRefreshToken()).toBe('my-refresh-token');
  });

  it('getRefreshToken returns null when not stored', () => {
    expect(service.getRefreshToken()).toBeNull();
  });

  it('handleOAuthCallback stores token and fetches user info', () => {
    service.handleOAuthCallback('oauth-jwt', 'oauth-refresh').subscribe(res => {
      expect(res.email).toBe('oauth@example.com');
    });

    // Should have stored the token before making the /me call
    expect(localStorage.getItem('dora_token')).toBe('oauth-jwt');
    expect(localStorage.getItem('dora_refresh_token')).toBe('oauth-refresh');

    const req = httpMock.expectOne('/api/auth/me');
    expect(req.request.method).toBe('GET');
    req.flush({
      ...mockAuthResponse,
      email: 'oauth@example.com',
      fullName: 'OAuth User'
    });

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.user()?.email).toBe('oauth@example.com');
  });
});
