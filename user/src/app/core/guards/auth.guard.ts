import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  // Allow access to routes, but components will show empty state if not authenticated
  // This allows the app to be accessible but no data will be shown to guests
  return true;
};
