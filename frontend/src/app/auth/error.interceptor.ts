import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from './toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError(err => {
      // Skip toast for auth endpoints (handled by auth interceptor) and tracking
      if (req.url.includes('/api/auth/') || req.url.includes('/api/public/track')) {
        return throwError(() => err);
      }

      const status = err.status;
      if (status === 0) {
        toast.show('Ühendus serveriga puudub', 'error');
      } else if (status === 429) {
        toast.show('Liiga palju päringuid. Proovi hiljem uuesti.', 'warning');
      } else if (status === 403) {
        // Premium required — handled by subscription service
      } else if (status >= 500) {
        toast.show('Serveri viga. Proovi hiljem uuesti.', 'error');
      }

      return throwError(() => err);
    })
  );
};
