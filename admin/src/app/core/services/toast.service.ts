import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * One place for user-facing toasts, so every component shows them the same way
 * (consistent durations, the shared error styling, and one Laravel-error parser).
 * Replaces ~40 hand-rolled `snackBar.open(..., { duration })` calls per app.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private snackBar = inject(MatSnackBar);

  private static readonly DURATION = {
    success: 3000,
    info: 3000,
    error: 5000,
  } as const;

  /** Neutral confirmation ("Task deleted", "Saved"). */
  success(message: string): void {
    this.open(message, ToastService.DURATION.success);
  }

  /** Same styling as success today; separate name so intent reads at the call site. */
  info(message: string): void {
    this.open(message, ToastService.DURATION.info);
  }

  /** Longer-lived, red-styled. Pass a string, or an HttpErrorResponse to have
   *  the server's validation/message extracted automatically. */
  error(messageOrError: string | HttpErrorResponse | unknown): void {
    const message = typeof messageOrError === 'string'
      ? messageOrError
      : ToastService.extractError(messageOrError);
    this.open(message, ToastService.DURATION.error, ['error-snackbar']);
  }

  private open(message: string, duration: number, panelClass?: string[]): void {
    const config: MatSnackBarConfig = { duration };
    if (panelClass) config.panelClass = panelClass;
    this.snackBar.open(message, 'Close', config);
  }

  /** Pull the most useful text out of a Laravel error response. */
  static extractError(error: unknown): string {
    const err = error as { error?: { errors?: Record<string, unknown>; message?: string } };
    const validation = err?.error?.errors;
    if (validation) {
      const first = Object.values(validation)[0];
      return Array.isArray(first) ? String(first[0]) : String(first);
    }
    return err?.error?.message || 'An error occurred';
  }
}
