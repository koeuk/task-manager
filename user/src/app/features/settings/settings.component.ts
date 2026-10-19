import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { ActivityService, ActivityFilters } from '../../core/services/activity.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/user.model';
import { ActivityLog } from '../../core/models/activity.model';
import { Task } from '../../core/models/project.model';
import { TaskDetailDialogComponent } from '../tasks/task-detail-dialog/task-detail-dialog.component';
import { ActivityDetailDialogComponent } from '../activity/activity-detail-dialog/activity-detail-dialog.component';
import { getActivityChanges, FieldChange } from '../../core/utils/activity-utils';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule
  ],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  currentUser: User | null = null;
  activities: ActivityLog[] = [];
  loadingActivities = false;
  actionFilter = '';
  searchQuery = '';
  adminScope: 'all' | 'mine' = 'mine';
  activityPage = 1;
  activityTotal = 0;
  activityLastPage = 1;

  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private activityService: ActivityService,
    private toast: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        // Admins can toggle, default to 'all' for admin and 'mine' for normal user
        this.adminScope = user.role === 'admin' ? 'all' : 'mine';
        this.loadActivities(1);
      } else {
        this.activities = [];
      }
    });
  }

  onToggleTheme(dark: boolean): void {
    this.themeService.setDark(dark);
  }

  loadActivities(page: number = 1): void {
    if (!this.currentUser) return;
    this.loadingActivities = true;
    this.activityPage = page;

    const filters: ActivityFilters = {
      action: this.actionFilter || undefined,
      search: this.searchQuery?.trim() || undefined,
      page: this.activityPage,
      per_page: 15
    };

    // If normal user or admin chose 'mine', scope to current user id
    if (this.currentUser.role !== 'admin' || this.adminScope === 'mine') {
      filters.user_id = this.currentUser.id;
    }

    this.activityService.getActivities(filters).subscribe({
      next: (res) => {
        this.activities = res.data;
        this.activityTotal = res.total;
        this.activityLastPage = res.last_page;
        this.loadingActivities = false;
      },
      error: () => {
        this.toast.error('Failed to load activity records');
        this.loadingActivities = false;
      }
    });
  }

  setAdminScope(scope: 'all' | 'mine'): void {
    this.adminScope = scope;
    this.loadActivities(1);
  }

  setActionFilter(action: string): void {
    this.actionFilter = action;
    this.loadActivities(1);
  }

  onSearch(): void {
    this.loadActivities(1);
  }

  clearFilters(): void {
    this.actionFilter = '';
    this.searchQuery = '';
    this.loadActivities(1);
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
    if (act.includes('comment')) {
      return { bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-400', label: 'Comment' };
    }
    if (act.includes('complete')) {
      return { bg: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', label: 'Completed' };
    }
    if (act.includes('login')) {
      return { bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-400', label: 'Login' };
    }
    if (act.includes('logout')) {
      return { bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', label: 'Logout' };
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
    if (act.includes('update')) {
      return { bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'Updated' };
    }
    return { bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', label: action };
  }

  getChanges(properties?: Record<string, any> | null): FieldChange[] {
    return getActivityChanges(properties);
  }

  relativeTime(isoString: string): string {
    if (!isoString) return '';
    const then = new Date(isoString).getTime();
    if (isNaN(then)) return '';
    const diff = Date.now() - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString();
  }

  openTask(task: Task): void {
    const ref: MatDialogRef<TaskDetailDialogComponent> = this.dialog.open(TaskDetailDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { task }
    });
    ref.afterClosed().pipe(filter(Boolean)).subscribe(() => {
      this.loadActivities(this.activityPage);
    });
  }

  openActivityDetails(act: ActivityLog): void {
    this.dialog.open(ActivityDetailDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      data: { activity: act }
    });
  }
}
