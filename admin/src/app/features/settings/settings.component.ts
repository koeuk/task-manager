import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { AuditLogService } from '../../core/services/audit-log.service';
import { AuditLog } from '../../core/models/audit-log.model';
import { AuditLogDetailDialogComponent } from '../audit-logs/audit-log-detail-dialog/audit-log-detail-dialog.component';
import { environment } from '../../../environments/environment';

type Section = 'profile' | 'appearance' | 'notifications' | 'security' | 'activity' | 'about';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule
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
    { id: 'activity', icon: 'history', label: 'Activity & Audit' },
    { id: 'about', icon: 'info', label: 'About' }
  ];

  activities: AuditLog[] = [];
  loadingActivities = false;
  activityActionFilter = '';
  activitySearchQuery = '';
  adminScope: 'all' | 'mine' = 'all';
  activityPage = 1;
  activityTotal = 0;
  activityLastPage = 1;

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
    private auditLogService: AuditLogService,
    private dialog: MatDialog,
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
      if (requested === 'activity') {
        this.loadActivities(1);
      }
    }

    this.loadNotifications();
  }

  setSection(s: Section): void {
    this.section = s;
    if (s === 'activity' && this.activities.length === 0) {
      this.loadActivities(1);
    }
  }

  loadActivities(page = 1): void {
    this.loadingActivities = true;
    this.activityPage = page;

    const filters: any = {
      action: this.activityActionFilter || undefined,
      search: this.activitySearchQuery?.trim() || undefined,
      page: this.activityPage,
      per_page: 15
    };

    if (this.adminScope === 'mine' && this.currentUser?.id) {
      filters.user_id = this.currentUser.id;
    }

    this.auditLogService.getAuditLogs(filters).subscribe({
      next: (res) => {
        this.activities = res.data;
        this.activityTotal = res.total;
        this.activityLastPage = res.last_page;
        this.loadingActivities = false;
      },
      error: () => {
        this.toast.error('Failed to load audit logs');
        this.loadingActivities = false;
      }
    });
  }

  setAdminScope(scope: 'all' | 'mine'): void {
    this.adminScope = scope;
    this.loadActivities(1);
  }

  setActivityActionFilter(action: string): void {
    this.activityActionFilter = action;
    this.loadActivities(1);
  }

  onActivitySearch(): void {
    this.loadActivities(1);
  }

  viewLogDetails(log: AuditLog): void {
    this.dialog.open(AuditLogDetailDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      data: log
    });
  }

  getActionIcon(action: string): string {
    const act = (action || '').toLowerCase();
    if (act.includes('complete')) return 'check_circle';
    if (act.includes('create')) return 'add_circle';
    if (act.includes('delete')) return 'delete';
    if (act.includes('status')) return 'sync_alt';
    if (act.includes('priority')) return 'flag';
    if (act.includes('comment')) return 'chat_bubble';
    if (act.includes('login')) return 'login';
    if (act.includes('logout')) return 'logout';
    if (act.includes('update')) return 'edit';
    return 'history';
  }

  getActionBadge(action: string): { bg: string; text: string; label: string } {
    const act = (action || '').toLowerCase();
    if (act.includes('complete')) {
      return { bg: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', label: 'Completed' };
    }
    if (act.includes('create')) {
      return { bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', label: 'Created' };
    }
    if (act.includes('delete')) {
      return { bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-400', label: 'Deleted' };
    }
    if (act.includes('status')) {
      return { bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-400', label: 'Status' };
    }
    if (act.includes('priority')) {
      return { bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', label: 'Priority' };
    }
    if (act.includes('comment')) {
      return { bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-400', label: 'Comment' };
    }
    if (act.includes('login')) {
      return { bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-400', label: 'Login' };
    }
    if (act.includes('logout')) {
      return { bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', label: 'Logout' };
    }
    if (act.includes('update')) {
      return { bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'Updated' };
    }
    return { bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', label: action };
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
