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
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

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
  ],
  templateUrl: './forgot-password.component.html'
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
    private toast: ToastService
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
          this.toast.info('Reset token generated — enter a new password.');
        } else {
          this.toast.info(res.message);
        }
        this.emailValue = email;
        this.step = 2;
      },
      error: (error) => {
        this.loading = false;
        this.toast.error(error);
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
        this.toast.success(res.message || 'Password reset successfully.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loading = false;
        this.toast.error(error);
      }
    });
  }
}
