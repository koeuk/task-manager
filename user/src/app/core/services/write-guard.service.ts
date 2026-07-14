import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { LoginDialogComponent } from '../../features/auth/login-dialog/login-dialog.component';

@Injectable({ providedIn: 'root' })
export class WriteGuardService {
  constructor(private auth: AuthService, private dialog: MatDialog) {}

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
      .open(LoginDialogComponent, { width: '400px', restoreFocus: true })
      .afterClosed()
      .pipe(map(() => !this.auth.isGuest));
  }
}
