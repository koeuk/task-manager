import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="page">
      <h1 class="page-title">Settings</h1>

      <mat-card class="form-card">
        <mat-card-header><mat-card-title>Change Password</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Current password</mat-label>
              <input matInput type="password" formControlName="current_password">
              <mat-error>Current password is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>New password</mat-label>
              <input matInput type="password" formControlName="password">
              <mat-error>Minimum 8 characters</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm new password</mat-label>
              <input matInput type="password" formControlName="password_confirmation">
              <mat-error *ngIf="passwordForm.hasError('mismatch')">Passwords do not match</mat-error>
            </mat-form-field>

            <button mat-flat-button color="primary" type="submit" [disabled]="passwordForm.invalid || loading">
              <mat-progress-spinner *ngIf="loading" diameter="18" mode="indeterminate"></mat-progress-spinner>
              <span>Update Password</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="form-card">
        <mat-card-header><mat-card-title>System Information</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="info-row"><span>Application</span><span>{{ appName }}</span></div>
          <div class="info-row"><span>Version</span><span>{{ version }}</span></div>
          <div class="info-row"><span>API URL</span><span>{{ apiUrl }}</span></div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { max-width: 640px; margin: 0 auto; }
    .page-title { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 24px; color: #1e1b3a; }
    .form-card { margin-bottom: 24px; }
    .full-width { width: 100%; }
    form { display: flex; flex-direction: column; }
    button mat-progress-spinner { display: inline-block; margin-right: 8px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; color: #444; }
    .info-row:last-child { border-bottom: none; }
    .info-row span:first-child { color: #6b7280; }
  `]
})
export class SettingsComponent implements OnInit {
  passwordForm!: FormGroup;
  loading = false;
  appName = (environment as any).appName || 'Task Manager Admin';
  version = (environment as any).version || '1.0.0';
  apiUrl = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.matchPasswords });
  }

  private matchPasswords(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;
    return pw && confirm && pw !== confirm ? { mismatch: true } : null;
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) return;
    this.loading = true;

    this.authService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.snackBar.open('Password updated', 'Close', { duration: 3000 });
        this.passwordForm.reset();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(error.error?.message || 'Failed to update password', 'Close', { duration: 5000 });
      }
    });
  }
}
