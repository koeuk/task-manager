import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
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
      <h1 class="page-title">My Profile</h1>

      <mat-card class="form-card avatar-card">
        <div class="avatar-row">
          <div class="avatar">
            <img *ngIf="avatarUrl" [src]="avatarUrl" alt="avatar">
            <span *ngIf="!avatarUrl">{{ initials }}</span>
          </div>
          <div class="avatar-actions">
            <button mat-stroked-button type="button" (click)="fileInput.click()" [disabled]="avatarUploading">
              <mat-progress-spinner *ngIf="avatarUploading" diameter="18" mode="indeterminate"></mat-progress-spinner>
              <mat-icon *ngIf="!avatarUploading">photo_camera</mat-icon>
              <span>{{ avatarUploading ? 'Uploading…' : 'Change photo' }}</span>
            </button>
            <input #fileInput type="file" accept="image/*" hidden (change)="onAvatarSelected($event)">
            <p class="avatar-hint">JPG, PNG, GIF or WEBP · max 2 MB</p>
          </div>
        </div>
      </mat-card>

      <mat-card class="form-card">
        <mat-card-header><mat-card-title>Personal Information</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name">
              <mat-error>Name is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email">
              <mat-error>Valid email is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone</mat-label>
              <input matInput formControlName="phone">
            </mat-form-field>

            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading">
              <mat-progress-spinner *ngIf="loading" diameter="18" mode="indeterminate"></mat-progress-spinner>
              <span>Save Changes</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { max-width: 640px; margin: 0 auto; }
    .page-title { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 24px; color: #1e1b3a; }
    .form-card { margin-bottom: 20px; }
    .full-width { width: 100%; }
    form { display: flex; flex-direction: column; }
    button mat-progress-spinner { display: inline-block; margin-right: 8px; }
    .avatar-row { display: flex; align-items: center; gap: 20px; }
    .avatar {
      width: 84px; height: 84px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      font-size: 34px; font-weight: 700; color: #fff;
      background: linear-gradient(135deg, #94a3b8, #cbd5e1);
    }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-actions button { display: inline-flex; align-items: center; gap: 6px; }
    .avatar-hint { margin: 8px 0 0; font-size: 12px; color: #6b7280; }
  `]
})
export class ProfileComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  avatarUrl?: string;
  avatarUploading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.avatarUrl = user?.avatar || undefined;
    this.form = this.fb.group({
      name: [user?.name || '', [Validators.required]],
      email: [user?.email || '', [Validators.required, Validators.email]],
      phone: [user?.phone || '']
    });
  }

  get initials(): string {
    return (this.authService.currentUserValue?.name || '?').charAt(0).toUpperCase();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please choose an image file', 'Close', { duration: 4000 });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.snackBar.open('Image must be 2 MB or smaller', 'Close', { duration: 4000 });
      return;
    }

    this.avatarUploading = true;
    this.authService.uploadAvatar(file).subscribe({
      next: (res) => {
        this.avatarUrl = res.avatar;
        this.avatarUploading = false;
        this.snackBar.open('Avatar updated', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.avatarUploading = false;
        this.snackBar.open(error.error?.message || 'Failed to upload avatar', 'Close', { duration: 5000 });
      }
    });
    input.value = '';
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    this.authService.updateProfile(this.form.value).subscribe({
      next: () => {
        this.snackBar.open('Profile updated', 'Close', { duration: 3000 });
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(error.error?.message || 'Failed to update profile', 'Close', { duration: 5000 });
      }
    });
  }
}
