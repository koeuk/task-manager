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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { environment } from '../../../environments/environment';

type Section = 'profile' | 'appearance' | 'security' | 'about';

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
    MatSnackBarModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  section: Section = 'profile';
  loading = false;
  savingProfile = false;
  uploadingAvatar = false;

  navItems: { id: Section; icon: string; label: string }[] = [
    { id: 'profile', icon: 'person', label: 'Profile' },
    { id: 'appearance', icon: 'palette', label: 'Appearance' },
    { id: 'security', icon: 'lock', label: 'Security' },
    { id: 'about', icon: 'info', label: 'About' }
  ];

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  appNameControl!: FormGroup;

  appName = (environment as any).appName || 'Task Manager Admin';
  version = (environment as any).version || '1.0.0';
  apiUrl = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public themeService: ThemeService,
    public appSettings: AppSettingsService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.profileForm = this.fb.group({
      name: [user?.name || '', [Validators.required]],
      email: [user?.email || '', [Validators.required, Validators.email]],
      phone: [user?.phone || '']
    });

    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.matchPasswords });

    this.appNameControl = this.fb.group({
      appName: [this.appSettings.current.appName, [Validators.required]]
    });
  }

  get currentUser() {
    return this.authService.currentUserValue;
  }

  // ---- Profile ----
  onSaveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile = true;
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.snackBar.open('Profile updated', 'Close', { duration: 3000 });
        this.savingProfile = false;
      },
      error: (err) => {
        this.savingProfile = false;
        this.snackBar.open(err.error?.message || 'Failed to update profile', 'Close', { duration: 5000 });
      }
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingAvatar = true;
    this.authService.uploadAvatar(file).subscribe({
      next: () => {
        this.snackBar.open('Avatar updated', 'Close', { duration: 3000 });
        this.uploadingAvatar = false;
      },
      error: (err) => {
        this.uploadingAvatar = false;
        this.snackBar.open(err.error?.message || 'Failed to upload avatar', 'Close', { duration: 5000 });
      }
    });
    input.value = '';
  }

  // ---- Appearance ----
  saveAppName(): void {
    if (this.appNameControl.invalid) return;
    this.appSettings.update({ appName: this.appNameControl.value.appName.trim() });
    this.snackBar.open('App name updated', 'Close', { duration: 2500 });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      this.snackBar.open('Logo must be under 512 KB', 'Close', { duration: 4000 });
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.appSettings.update({ appLogo: reader.result as string });
      this.snackBar.open('Logo updated', 'Close', { duration: 2500 });
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeLogo(): void {
    this.appSettings.update({ appLogo: '' });
  }

  setAccent(color: string): void {
    this.appSettings.update({ accent: color });
  }

  toggleTheme(dark: boolean): void {
    this.themeService.setDark(dark);
  }

  // ---- Security ----
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

  private matchPasswords(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;
    return pw && confirm && pw !== confirm ? { mismatch: true } : null;
  }
}
