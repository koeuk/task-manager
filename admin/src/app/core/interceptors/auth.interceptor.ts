import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Read the token directly (not via AuthService) so this interceptor does not
  // depend on AuthService — AuthService issues an HTTP request in its constructor,
  // which would otherwise create a circular dependency (NG0200).
  const injector = inject(Injector);
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        // Resolve AuthService lazily — only when a 401 actually occurs, by which
        // point it is fully constructed, so there is no construction-time cycle.
        injector.get(AuthService).logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
