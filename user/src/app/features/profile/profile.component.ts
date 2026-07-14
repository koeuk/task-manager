import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { WriteGuardService } from '../../core/services/write-guard.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('password_confirmation')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  savingProfile = false;
  savingPassword = false;
  avatarUploading = false;
  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private writeGuard: WriteGuardService
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required]
    }, { validators: passwordsMatch });

    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone ?? ''
        });
      }
    });
  }

  get initials(): string {
    return (this.user?.name || '?').trim().charAt(0).toUpperCase();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (this.writeGuard.blockGuest()) { input.value = ''; return; }

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
      next: () => {
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

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    if (this.writeGuard.blockGuest()) return;
    this.savingProfile = true;
    const v = this.profileForm.value;
    this.authService.updateProfile({
      name: v.name,
      email: v.email,
      phone: v.phone || null
    }).subscribe({
      next: () => {
        this.savingProfile = false;
        this.snackBar.open('Profile updated', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.savingProfile = false;
        this.snackBar.open(err.error?.message || 'Failed to update profile', 'Close', { duration: 5000 });
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    if (this.writeGuard.blockGuest()) return;
    this.savingPassword = true;
    this.authService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordForm.reset();
        this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.savingPassword = false;
        this.snackBar.open(err.error?.message || 'Failed to change password', 'Close', { duration: 5000 });
      }
    });
  }
}
