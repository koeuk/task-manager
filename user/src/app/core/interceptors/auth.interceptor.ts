import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    Accept: 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  req = req.clone({
    setHeaders: headers
  });

  // A 401 from an /auth/* call is a normal outcome (e.g. wrong password on
  // login) — not an expired session. Treating those as "session expired" would
  // log the user out on a failed login, and re-trigger logout() from its own
  // /auth/logout 401. Those callers handle their own errors.
  const isAuthRequest = req.url.includes('/auth/');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthRequest) {
        const auth = injector.get(AuthService);
        auth.clearSession();
        router.navigate(['/dashboard']);
      }
      return throwError(() => error);
    })
  );
};
