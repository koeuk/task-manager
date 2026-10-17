import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ActivityService, ActivityFilters } from '../../core/services/activity.service';
import { ActivityLog } from '../../core/models/activity.model';
import { Task } from '../../core/models/project.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TaskDetailDialogComponent } from '../tasks/task-detail-dialog/task-detail-dialog.component';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './activity.component.html'
})
export class ActivityComponent implements OnInit {
  activities: ActivityLog[] = [];
  loading = true;
  actionFilter = '';
  entityFilter = '';
  currentPage = 1;
  totalPages = 1;
  totalActivities = 0;

  constructor(
    private activityService: ActivityService,
    private authService: AuthService,
    private dialog: MatDialog,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadActivities(1);
      } else {
        this.activities = [];
        this.loading = false;
      }
    });
  }

  loadActivities(page: number = 1): void {
    this.loading = true;
    this.currentPage = page;

    const filters: ActivityFilters = {
      action: this.actionFilter || undefined,
      entity_type: this.entityFilter || undefined,
      page: this.currentPage,
      per_page: 25
    };

    this.activityService.getActivities(filters).subscribe({
      next: (res) => {
        this.activities = res.data;
        this.totalActivities = res.total;
        this.totalPages = res.last_page;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load activity feed');
        this.loading = false;
      }
    });
  }

  setFilter(action: string): void {
    this.actionFilter = action;
    this.loadActivities(1);
  }

  setEntityFilter(entity: string): void {
    this.entityFilter = entity;
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
      this.loadActivities(this.currentPage);
    });
  }
}
