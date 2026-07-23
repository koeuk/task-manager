import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';

import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    // Public/guest mode: silently establish a shared guest session at startup so
    // the app is usable without an explicit login. Real logins still take over.
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.ensureGuestSession(),
      deps: [AuthService],
      multi: true
    },
    // Dialogs close only via their own buttons - never by clicking the backdrop
    // or pressing Escape, so a half-filled form can't be lost by a stray click.
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { disableClose: true } }
  ]
};
