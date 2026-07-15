import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent {
  form: FormGroup;
  loading = false;
  hidePassword = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private dialogRef: MatDialogRef<LoginDialogComponent>
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || error?.message || 'Login failed. Please try again.';
      }
    });
  }

  goToRegister(): void {
    this.dialogRef.close(false);
    this.router.navigate(['/register']);
  }

  /**
   * Password recovery entry point. Without this the /forgot-password page is
   * unreachable — the login page that used to link to it no longer exists.
   */
  goToForgotPassword(): void {
    this.dialogRef.close(false);
    this.router.navigate(['/forgot-password']);
  }
}
