import { Injectable, Injector, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, switchMap, of, Subject } from 'rxjs';
import { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from './auth.models';
import type { SubscriptionService } from '../services/subscription.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private currentUser = signal<AuthUser | null>(null);
  private readonly TOKEN_KEY = 'dora_token';
  private readonly REFRESH_TOKEN_KEY = 'dora_refresh_token';
  private readonly USER_KEY = 'dora_user';

  private refreshing = false;
  private refreshSubject = new Subject<string>();

  user = this.currentUser.asReadonly();
  isLoggedIn = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  constructor(private http: HttpClient, private router: Router, private injector: Injector) {
    if (this.isBrowser) {
      this.loadFromStorage();
    }
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', request).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', request).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  logout(): void {
    // Notify backend to blacklist token and clear refresh token
    const token = this.getToken();
    if (token) {
      this.http.post('/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({ error: (e: unknown) => console.warn('Logout API failed:', e) });
    }
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem(this.TOKEN_KEY) : null;
  }

  getRefreshToken(): string | null {
    return this.isBrowser ? localStorage.getItem(this.REFRESH_TOKEN_KEY) : null;
  }

  /** Attempt to refresh the access token using the refresh token. Returns new access token. */
  refreshAccessToken(): Observable<string> {
    if (this.refreshing) {
      return this.refreshSubject.asObservable();
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }

    this.refreshing = true;

    return this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken }).pipe(
      tap(res => {
        this.handleAuth(res);
        this.refreshing = false;
        this.refreshSubject.next(res.token);
      }),
      switchMap(res => of(res.token)),
      catchError(err => {
        this.refreshing = false;
        this.logout();
        return throwError(() => err);
      })
    );
  }

  handleOAuthCallback(token: string, refreshToken?: string): Observable<AuthResponse> {
    if (this.isBrowser) {
      localStorage.setItem(this.TOKEN_KEY, token);
      if (refreshToken) localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
    return this.http.get<AuthResponse>('/api/auth/me').pipe(
      tap(res => {
        const user: AuthUser = {
          userId: res.userId,
          email: res.email,
          fullName: res.fullName,
          accountTier: res.accountTier,
          trialEndsAt: res.trialEndsAt,
          role: res.role
        };
        if (this.isBrowser) localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
        this.refreshSubscription();
      })
    );
  }

  private handleAuth(res: AuthResponse): void {
    if (this.isBrowser) {
      localStorage.setItem(this.TOKEN_KEY, res.token);
      if (res.refreshToken) localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
    }
    const user: AuthUser = {
      userId: res.userId,
      email: res.email,
      fullName: res.fullName,
      role: res.role,
      trialEndsAt: res.trialEndsAt
    };
    if (this.isBrowser) localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.refreshSubscription();
  }

  private refreshSubscription(): void {
    // Lazy resolve to avoid circular dependency at construction time
    import('../services/subscription.service').then(m => {
      const sub = this.injector.get(m.SubscriptionService);
      sub.refreshStatus();
    });
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userJson = localStorage.getItem(this.USER_KEY);
    if (token && userJson) {
      try {
        this.currentUser.set(JSON.parse(userJson));
      } catch {
        this.logout();
      }
    }
  }
}
