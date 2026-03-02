import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from './toast.service';
import { LangService } from '../lang.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const lang = inject(LangService);

  return next(req).pipe(
    catchError(err => {
      // Skip toast for auth endpoints (handled by auth interceptor) and tracking
      if (req.url.includes('/api/auth/') || req.url.includes('/api/public/track')) {
        return throwError(() => err);
      }

      const status = err.status;
      if (status === 0) {
        toast.show(lang.t('error.no_connection'), 'error');
      } else if (status === 429) {
        toast.show(lang.t('error.too_many_requests'), 'warning');
      } else if (status === 403) {
        // Premium required — handled by subscription service
      } else if (status >= 500) {
        toast.show(lang.t('error.server_error'), 'error');
      }

      return throwError(() => err);
    })
  );
};
