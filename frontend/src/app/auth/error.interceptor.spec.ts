import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { ToastService } from './toast.service';
import { LangService } from '../lang.service';

describe('errorInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let langSpy: jasmine.SpyObj<LangService>;

  beforeEach(() => {
    localStorage.clear();

    toastSpy = jasmine.createSpyObj('ToastService', ['show']);
    langSpy = jasmine.createSpyObj('LangService', ['t']);
    langSpy.t.and.callFake((key: string) => key);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastSpy },
        { provide: LangService, useValue: langSpy }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('passes through successful responses without modification', () => {
    http.get('/api/data').subscribe(res => {
      expect(res).toEqual({ value: 42 });
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ value: 42 });

    expect(toastSpy.show).not.toHaveBeenCalled();
  });

  it('shows no_connection toast on status 0', () => {
    http.get('/api/data').subscribe({
      next: () => fail('should have errored'),
      error: () => {
        expect(toastSpy.show).toHaveBeenCalledWith('error.no_connection', 'error');
        expect(langSpy.t).toHaveBeenCalledWith('error.no_connection');
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('shows too_many_requests toast on status 429', () => {
    http.get('/api/data').subscribe({
      next: () => fail('should have errored'),
      error: () => {
        expect(toastSpy.show).toHaveBeenCalledWith('error.too_many_requests', 'warning');
        expect(langSpy.t).toHaveBeenCalledWith('error.too_many_requests');
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Rate limited' }, { status: 429, statusText: 'Too Many Requests' });
  });

  it('shows server_error toast on status 500', () => {
    http.get('/api/data').subscribe({
      next: () => fail('should have errored'),
      error: () => {
        expect(toastSpy.show).toHaveBeenCalledWith('error.server_error', 'error');
        expect(langSpy.t).toHaveBeenCalledWith('error.server_error');
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Internal Server Error' });
  });

  it('shows server_error toast on status 502', () => {
    http.get('/api/data').subscribe({
      next: () => fail('should have errored'),
      error: () => {
        expect(toastSpy.show).toHaveBeenCalledWith('error.server_error', 'error');
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Bad Gateway' }, { status: 502, statusText: 'Bad Gateway' });
  });

  it('shows server_error toast on status 503', () => {
    http.get('/api/data').subscribe({
      next: () => fail('should have errored'),
      error: () => {
        expect(toastSpy.show).toHaveBeenCalledWith('error.server_error', 'error');
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Service Unavailable' }, { status: 503, statusText: 'Service Unavailable' });
  });

  it('does not show toast on status 401 (passed through)', () => {
    http.get('/api/data').subscribe({
      next: () => fail('should have errored'),
      error: (err) => {
        expect(err.status).toBe(401);
        expect(toastSpy.show).not.toHaveBeenCalled();
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('does not show toast on status 403 (handled by subscription service)', () => {
    http.get('/api/data').subscribe({
      next: () => fail('should have errored'),
      error: (err) => {
        expect(err.status).toBe(403);
        expect(toastSpy.show).not.toHaveBeenCalled();
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
  });

  it('does not show toast on status 404', () => {
    http.get('/api/data').subscribe({
      next: () => fail('should have errored'),
      error: (err) => {
        expect(err.status).toBe(404);
        expect(toastSpy.show).not.toHaveBeenCalled();
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
  });

  it('skips toast for auth endpoints', () => {
    http.get('/api/auth/login').subscribe({
      next: () => fail('should have errored'),
      error: () => {
        expect(toastSpy.show).not.toHaveBeenCalled();
      }
    });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ message: 'Error' }, { status: 500, statusText: 'Internal Server Error' });
  });

  it('skips toast for tracking endpoint', () => {
    http.post('/api/public/track', {}).subscribe({
      next: () => fail('should have errored'),
      error: () => {
        expect(toastSpy.show).not.toHaveBeenCalled();
      }
    });

    const req = httpMock.expectOne('/api/public/track');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('re-throws the original error after handling', () => {
    let caughtError: any;

    http.get('/api/data').subscribe({
      next: () => fail('should have errored'),
      error: (err) => {
        caughtError = err;
      }
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(caughtError).toBeTruthy();
    expect(caughtError.status).toBe(500);
  });
});
