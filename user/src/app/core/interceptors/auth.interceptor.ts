import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  /** Set while a guest session is being re-established, to collapse parallel 401s. */
  private recovering = false;

  // Inject Injector (not AuthService) to avoid a circular dependency: AuthService
  // issues an HTTP request in its constructor, which re-enters this interceptor.
  constructor(
    private injector: Injector,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('auth_token');

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });
    } else {
      req = req.clone({
        setHeaders: {
          Accept: 'application/json'
        }
      });
    }

    // A 401 from an /auth/* call is a normal outcome (e.g. wrong password on
    // login) — not an expired session. Treating those as "session expired" would
    // log the user out on a failed login, and re-trigger logout() from its own
    // /auth/logout 401. Those callers handle their own errors.
    const isAuthRequest = req.url.includes('/auth/');

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !isAuthRequest) {
          this.handleExpiredSession();
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Recover from an expired session by dropping back to guest browsing.
   *
   * Guarded because a single page load fires several requests in parallel: when
   * the token expires they all 401 at once, and without this flag each one would
   * independently tear down the session and race to rebuild it.
   */
  private handleExpiredSession(): void {
    if (this.recovering) {
      return;
    }
    this.recovering = true;

    // Resolve AuthService lazily so it is not required while it is still
    // being constructed.
    const auth = this.injector.get(AuthService);

    auth.clearSession();
    auth.ensureGuestSession().then(() => {
      this.recovering = false;
      this.router.navigate(['/dashboard']);
    });
  }
}
