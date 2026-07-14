import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    return true;
  }

  // There is no login page — silently establish a shared guest session so the
  // app is always reachable. Real logins happen via the in-app login dialog.
  await authService.ensureGuestSession();
  return true;
};
