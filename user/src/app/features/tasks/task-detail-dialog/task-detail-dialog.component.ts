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
import { WriteGuardService } from '../../../core/services/write-guard.service';
import { TaskFormDialogComponent } from '../task-form-dialog/task-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { STATUS_OPTIONS, statusLabel, priorityLabel, statusColor, priorityColor } from '../../../core/utils/task-meta';

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
  loading = true;
  newComment = '';
  postingComment = false;
  editingCommentId: number | null = null;
  editingText = '';
  changed = false;

  /**
   * Read live rather than snapshotting in ngOnInit: the write gate can log the
   * user in while this dialog is open, which would otherwise leave this holding
   * the previous (guest) id and mis-attribute comment ownership.
   */
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
    private authService: AuthService,
    private writeGuard: WriteGuardService,
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
      },
      error: () => {
        this.toast.error('Failed to load task');
        this.loading = false;
      }
    });
  }

  reloadComments(): void {
    this.commentService.getByTask(this.task.id).subscribe({
      next: (comments) => (this.comments = comments)
    });
  }

  changeStatus(status: TaskStatus): void {
    if (this.writeGuard.blockGuest()) { this.loadTask(); return; }
    this.taskService.updateStatus(this.task.id, status).subscribe({
      next: (res) => {
        this.task = { ...this.task, ...res.task };
        this.changed = true;
      },
      error: () => this.toast.error('Failed to update status')
    });
  }

  editTask(): void {
    if (this.writeGuard.blockGuest()) return;
    const ref = this.dialog.open(TaskFormDialogComponent, {
      width: '560px',
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
    if (this.writeGuard.blockGuest()) return;
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
    this.writeGuard.requireWrite().subscribe(ok => {
      if (!ok) return;
      this.postingComment = true;
      this.commentService.createComment(this.task.id, text).subscribe({
        next: () => {
          this.newComment = '';
          this.postingComment = false;
          this.changed = true;
          this.reloadComments();
        },
        error: () => {
          this.postingComment = false;
          this.toast.error('Failed to add comment');
        }
      });
    });
  }

  startEditComment(c: Comment): void {
    if (this.writeGuard.blockGuest()) return;
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
      },
      error: () => this.toast.error('Failed to update comment')
    });
  }

  deleteComment(c: Comment): void {
    if (this.writeGuard.blockGuest()) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete comment', message: 'Delete this comment?', confirmText: 'Delete', danger: true }
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.commentService.deleteComment(c.id).subscribe({
          next: () => this.reloadComments(),
          error: () => this.toast.error('Failed to delete comment')
        });
      }
    });
  }

  canEditComment(c: Comment): boolean {
    return this.currentUserId != null && c.user_id === this.currentUserId;
  }

  close(): void {
    this.dialogRef.close(this.changed ? { changed: true } : null);
  }
}
