import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { LoginDialogComponent } from '../../features/auth/login-dialog/login-dialog.component';

@Injectable({ providedIn: 'root' })
export class WriteGuardService {
  constructor(private auth: AuthService, private dialog: MatDialog) {}

  /** True when not authenticated (no account). */
  get isGuest(): boolean {
    return this.auth.isGuest;
  }

  /**
   * Ensure the current user may perform a write (create / edit). Authenticated users
   * emit `true` immediately. Unauthenticated users get the login dialog and emit `true`
   * only if they successfully sign in — so the caller can continue the action.
   */
  requireWrite(): Observable<boolean> {
    if (!this.auth.isGuest) {
      return of(true);
    }
    return this.dialog
      .open(LoginDialogComponent, { width: '400px', restoreFocus: true, panelClass: 'auth-dialog' })
      .afterClosed()
      .pipe(map(() => !this.auth.isGuest));
  }

  /**
   * Synchronous guard for write actions. If the current user is not authenticated,
   * opens the login dialog and returns `true` (meaning: block the action).
   * Authenticated users get `false`.
   * Usage: `if (this.writeGuard.blockGuest()) return;`
   */
  blockGuest(): boolean {
    if (!this.auth.isGuest) {
      return false;
    }
    this.dialog.open(LoginDialogComponent, { width: '400px', restoreFocus: true, panelClass: 'auth-dialog' });
    return true;
  }
}
