import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="brand">
          <div class="brand-badge"><mat-icon>lock_reset</mat-icon></div>
          <h1>Reset Password</h1>
          <p class="subtitle">{{ step === 1 ? 'Enter your account email' : 'Choose a new password' }}</p>
        </div>

        <!-- Step 1: request a reset token -->
        <form *ngIf="step === 1" [formGroup]="emailForm" (ngSubmit)="requestToken()" class="auth-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <mat-icon matPrefix>email</mat-icon>
            <input matInput type="email" formControlName="email" placeholder="admin@example.com">
            <mat-error>Please enter a valid email</mat-error>
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit" class="full-width action-btn"
                  [disabled]="emailForm.invalid || loading">
            <mat-progress-spinner *ngIf="loading" diameter="18" mode="indeterminate"></mat-progress-spinner>
            <span>{{ loading ? 'Sending…' : 'Send reset token' }}</span>
          </button>
        </form>

        <!-- Step 2: reset with token + new password -->
        <form *ngIf="step === 2" [formGroup]="resetForm" (ngSubmit)="doReset()" class="auth-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Reset token</mat-label>
            <mat-icon matPrefix>vpn_key</mat-icon>
            <input matInput formControlName="token">
            <mat-error>Token is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>New password</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input matInput type="password" formControlName="password">
            <mat-error>Minimum 8 characters</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirm new password</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input matInput type="password" formControlName="password_confirmation">
            <mat-error *ngIf="resetForm.hasError('mismatch')">Passwords do not match</mat-error>
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit" class="full-width action-btn"
                  [disabled]="resetForm.invalid || loading">
            <mat-progress-spinner *ngIf="loading" diameter="18" mode="indeterminate"></mat-progress-spinner>
            <span>{{ loading ? 'Resetting…' : 'Reset password' }}</span>
          </button>
        </form>

        <p class="auth-alt"><a routerLink="/login">Back to login</a></p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;
      background: linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #475569 100%);
    }
    .login-card {
      width: 100%; max-width: 420px; padding: 40px 36px 28px; background: #fff;
      border-radius: 20px; box-shadow: 0 24px 60px rgba(30, 20, 60, 0.32);
    }
    .brand { text-align: center; margin-bottom: 28px; }
    .brand-badge {
      width: 68px; height: 68px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;
      border-radius: 18px; background: linear-gradient(135deg, #64748b, #94a3b8); box-shadow: 0 10px 22px rgba(100,116,139,.4);
    }
    .brand-badge mat-icon { font-size: 34px; width: 34px; height: 34px; color: #fff; }
    .brand h1 { margin: 0; font-size: 24px; font-weight: 700; color: #1e1b3a; }
    .subtitle { margin: 6px 0 0; font-size: 14px; color: #6b7280; }
    .auth-form { display: flex; flex-direction: column; }
    .full-width { width: 100%; }
    mat-form-field mat-icon[matPrefix] { margin: 0 10px 0 4px; color: #9ca3af; }
    .action-btn {
      height: 48px; margin-top: 4px; border-radius: 12px; font-weight: 600;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .action-btn mat-progress-spinner { display: inline-block; }
    .auth-alt { margin: 20px 0 0; text-align: center; font-size: 14px; }
    .auth-alt a { color: #475569; font-weight: 600; text-decoration: none; }
    .auth-alt a:hover { text-decoration: underline; }
  `]
})
export class ForgotPasswordComponent implements OnInit {
  emailForm!: FormGroup;
  resetForm!: FormGroup;
  loading = false;
  step: 1 | 2 = 1;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.resetForm = this.fb.group({
      token: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: (g) => g.get('password')?.value === g.get('password_confirmation')?.value ? null : { mismatch: true } });
  }

  requestToken(): void {
    if (this.emailForm.invalid) return;
    this.loading = true;
    const email = this.emailForm.value.email;

    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.loading = false;
        this.resetForm.patchValue({ email });
        // In production the token is emailed; here it's returned so we can prefill it.
        if (res.token) {
          this.resetForm.patchValue({ token: res.token });
          this.snackBar.open('Reset token generated — enter a new password.', 'Close', { duration: 4000 });
        } else {
          this.snackBar.open(res.message, 'Close', { duration: 4000 });
        }
        this.emailValue = email;
        this.step = 2;
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(error.error?.message || 'Request failed. Please try again.', 'Close', { duration: 5000 });
      }
    });
  }

  private emailValue = '';

  doReset(): void {
    if (this.resetForm.invalid) return;
    this.loading = true;

    this.authService.resetPassword({
      email: this.emailValue,
      token: this.resetForm.value.token,
      password: this.resetForm.value.password,
      password_confirmation: this.resetForm.value.password_confirmation
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.snackBar.open(res.message || 'Password reset successfully.', 'Close', { duration: 4000 });
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(error.error?.message || 'Reset failed. Please try again.', 'Close', { duration: 5000 });
      }
    });
  }
}
