import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { LoginDialogComponent } from '../../features/auth/login-dialog/login-dialog.component';

@Injectable({ providedIn: 'root' })
export class WriteGuardService {
  constructor(private auth: AuthService, private dialog: MatDialog) {}

  /** True when browsing as the shared guest account. */
  get isGuest(): boolean {
    return this.auth.isGuest;
  }

  /**
   * Ensure the current user may perform a write (create / edit). Real users emit
   * `true` immediately. Guests get the login dialog and emit `true` only if they
   * successfully sign into a real account — so the caller can continue the action.
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
   * Synchronous guard for write actions. If the current user is a guest, opens the
   * login dialog and returns `true` (meaning: block the action). Real users get `false`.
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
