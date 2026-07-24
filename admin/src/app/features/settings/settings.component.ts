import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { environment } from '../../../environments/environment';

type Section = 'profile' | 'appearance' | 'notifications' | 'security' | 'about';

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
    { id: 'notifications', icon: 'notifications', label: 'Notifications' },
    { id: 'security', icon: 'lock', label: 'Security' },
    { id: 'about', icon: 'info', label: 'About' }
  ];

  notifications: AppNotification[] = [];
  loadingNotifications = false;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  appNameControl!: FormGroup;

  appName = (environment as any).appName || 'Task Manager Admin';
  version = (environment as any).version || '1.0.0';
  apiUrl = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: ToastService,
    public themeService: ThemeService,
    public appSettings: AppSettingsService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
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

    // Open a specific section when navigated with ?section=... (e.g. from the bell)
    const requested = this.route.snapshot.queryParamMap.get('section') as Section | null;
    if (requested && this.navItems.some(i => i.id === requested)) {
      this.section = requested;
    }

    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loadingNotifications = true;
    this.notificationService.loadNotifications().subscribe(items => {
      this.notifications = items;
      this.loadingNotifications = false;
    });
  }

  openNotification(n: AppNotification): void {
    // Admin has no per-task page — open the Tasks list, searching for this task
    this.router.navigate(['/tasks'], { queryParams: { search: n.title } });
  }

  relativeTime(iso?: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (isNaN(then)) return '';
    const mins = Math.floor((Date.now() - then) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
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
        this.toast.success('Profile updated');
        this.savingProfile = false;
      },
      error: (err) => {
        this.savingProfile = false;
        this.toast.error(err);
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
        this.toast.success('Avatar updated');
        this.uploadingAvatar = false;
      },
      error: (err) => {
        this.uploadingAvatar = false;
        this.toast.error(err);
      }
    });
    input.value = '';
  }

  // ---- Appearance ----
  saveAppName(): void {
    if (this.appNameControl.invalid) return;
    this.appSettings.update({ appName: this.appNameControl.value.appName.trim() });
    this.toast.success('App name updated');
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      this.toast.info('Logo must be under 512 KB');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.appSettings.update({ appLogo: reader.result as string });
      this.toast.success('Logo updated');
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

  setBackground(color: string): void {
    this.appSettings.update({ background: color });
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
        this.toast.success('Password updated');
        this.passwordForm.reset();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toast.error(error);
      }
    });
  }

  private matchPasswords(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;
    return pw && confirm && pw !== confirm ? { mismatch: true } : null;
  }
}
