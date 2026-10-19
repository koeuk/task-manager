import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastService } from '../../../core/services/toast.service';
import { Task, Comment, TaskStatus } from '../../../core/models/project.model';
import { TaskService } from '../../../core/services/task.service';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import { TaskFormDialogComponent } from '../task-form-dialog/task-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { STATUS_OPTIONS, statusLabel, priorityLabel, statusColor, priorityColor } from '../../../core/utils/task-meta';
import { ActivityService } from '../../../core/services/activity.service';
import { ActivityLog } from '../../../core/models/activity.model';
import { ActivityDetailDialogComponent } from '../../activity/activity-detail-dialog/activity-detail-dialog.component';
import { getActivityChanges, FieldChange } from '../../../core/utils/activity-utils';

@Component({
  selector: 'app-task-detail-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule,
    MatDividerModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './task-detail-dialog.component.html',
  styleUrls: ['./task-detail-dialog.component.scss']
})
export class TaskDetailDialogComponent implements OnInit {
  task!: Task;
  comments: Comment[] = [];
  activities: ActivityLog[] = [];
  activeTab: 'comments' | 'activity' = 'comments';
  loading = true;
  loadingActivities = false;
  newComment = '';
  postingComment = false;
  editingCommentId: number | null = null;
  editingText = '';
  changed = false;

  /** Current authenticated user ID. */
  get currentUserId(): number | null {
    return this.authService.currentUserValue?.id ?? null;
  }

  statusOptions = STATUS_OPTIONS;
  statusLabel = statusLabel;
  priorityLabel = priorityLabel;
  statusColor = statusColor;
  priorityColor = priorityColor;

  constructor(
    private taskService: TaskService,
    private commentService: CommentService,
    private activityService: ActivityService,
    private authService: AuthService,
    private dialog: MatDialog,
    private toast: ToastService,
    private dialogRef: MatDialogRef<TaskDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { task: Task }
  ) {}

  ngOnInit(): void {
    this.loadTask();
  }

  loadTask(): void {
    this.loading = true;
    this.taskService.getTask(this.data.task.id).subscribe({
      next: (task) => {
        this.task = task;
        this.comments = task.comments ?? [];
        this.loading = false;
        this.loadActivities();
      },
      error: () => {
        this.toast.error('Failed to load task');
        this.loading = false;
      }
    });
  }

  setTab(tab: 'comments' | 'activity'): void {
    this.activeTab = tab;
    if (tab === 'activity' && this.activities.length === 0) {
      this.loadActivities();
    }
  }

  loadActivities(): void {
    if (!this.data?.task?.id && !this.task?.id) return;
    const taskId = this.task?.id || this.data.task.id;
    this.loadingActivities = true;
    this.activityService.getTaskActivities(taskId).subscribe({
      next: (res) => {
        this.activities = res.data ?? [];
        this.loadingActivities = false;
      },
      error: () => {
        this.loadingActivities = false;
      }
    });
  }

  reloadComments(): void {
    this.commentService.getByTask(this.task.id).subscribe({
      next: (comments) => (this.comments = comments)
    });
  }

  changeStatus(status: TaskStatus): void {
    this.taskService.updateStatus(this.task.id, status).subscribe({
      next: (res) => {
        this.task = { ...this.task, ...res.task };
        this.changed = true;
        this.loadActivities();
      },
      error: () => this.toast.error('Failed to update status')
    });
  }

  editTask(): void {
    const ref = this.dialog.open(TaskFormDialogComponent, {
      width: '540px',
      maxWidth: '95vw',
      data: { task: this.task }
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.changed = true;
        this.loadTask();
      }
    });
  }

  deleteTask(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete task',
        message: `Delete "${this.task.title}"? This cannot be undone.`,
        confirmText: 'Delete',
        danger: true
      }
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.taskService.deleteTask(this.task.id).subscribe({
          next: () => {
            this.toast.success('Task deleted');
            this.dialogRef.close({ deleted: true });
          },
          error: () => this.toast.error('Failed to delete task')
        });
      }
    });
  }

  addComment(): void {
    const text = this.newComment.trim();
    if (!text) return;
    this.postingComment = true;
    this.commentService.createComment(this.task.id, text).subscribe({
      next: () => {
        this.newComment = '';
        this.postingComment = false;
        this.changed = true;
        this.reloadComments();
        this.loadActivities();
      },
      error: () => {
        this.postingComment = false;
        this.toast.error('Failed to add comment');
      }
    });
  }

  startEditComment(c: Comment): void {
    this.editingCommentId = c.id;
    this.editingText = c.comment;
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editingText = '';
  }

  saveEditComment(c: Comment): void {
    const text = this.editingText.trim();
    if (!text) return;
    this.commentService.updateComment(c.id, text).subscribe({
      next: () => {
        this.cancelEditComment();
        this.reloadComments();
        this.loadActivities();
      },
      error: () => this.toast.error('Failed to update comment')
    });
  }

  deleteComment(c: Comment): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete comment', message: 'Delete this comment?', confirmText: 'Delete', danger: true }
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.commentService.deleteComment(c.id).subscribe({
          next: () => {
            this.reloadComments();
            this.loadActivities();
          },
          error: () => this.toast.error('Failed to delete comment')
        });
      }
    });
  }

  canEditComment(c: Comment): boolean {
    return this.currentUserId != null && c.user_id === this.currentUserId;
  }

  getActionIcon(action: string): string {
    const act = (action || '').toLowerCase();
    if (act.includes('comment')) return 'chat_bubble';
    if (act.includes('complete')) return 'check_circle';
    if (act.includes('login')) return 'login';
    if (act.includes('logout')) return 'logout';
    if (act.includes('create')) return 'add_circle';
    if (act.includes('delete')) return 'delete';
    if (act.includes('status')) return 'sync_alt';
    if (act.includes('priority')) return 'flag';
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
    return { bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', label: action || 'Activity' };
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

  getChanges(properties?: Record<string, any> | null): FieldChange[] {
    return getActivityChanges(properties);
  }

  openActivityDetails(act: ActivityLog): void {
    this.dialog.open(ActivityDetailDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      data: { activity: act }
    });
  }

  close(): void {
    this.dialogRef.close(this.changed ? { changed: true } : null);
  }
}
