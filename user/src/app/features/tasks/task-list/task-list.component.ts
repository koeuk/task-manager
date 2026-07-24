import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Task, Project, TaskStatus, TaskPriority } from '../../../core/models/project.model';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { WriteGuardService } from '../../../core/services/write-guard.service';
import { TaskFormDialogComponent } from '../task-form-dialog/task-form-dialog.component';
import { TaskDetailDialogComponent } from '../task-detail-dialog/task-detail-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  STATUS_OPTIONS, PRIORITY_OPTIONS, statusLabel, priorityLabel, statusColor, priorityColor
} from '../../../core/utils/task-meta';
import { parseApiDate } from '../../../core/utils/date-utils';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    MatButtonModule, MatMenuModule, MatProgressSpinnerModule, MatTooltipModule,
    MatCheckboxModule
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  projects: Project[] = [];
  loading = true;
  total = 0;
  pageSize = 15;
  pageIndex = 0;

  displayedColumns = ['title', 'project', 'priority', 'status', 'due_date', 'actions'];

  searchControl = new FormControl('');
  statusFilter: TaskStatus | '' = '';
  priorityFilter: TaskPriority | '' = '';

  statusOptions = STATUS_OPTIONS;
  priorityOptions = PRIORITY_OPTIONS;
  statusLabel = statusLabel;
  priorityLabel = priorityLabel;
  statusColor = statusColor;
  priorityColor = priorityColor;

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private writeGuard: WriteGuardService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadProjects();
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadTasks();
      });
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getTasks({
      search: this.searchControl.value || '',
      status: this.statusFilter,
      priority: this.priorityFilter,
      per_page: this.pageSize,
      page: this.pageIndex + 1
    }).subscribe({
      next: (res) => {
        this.tasks = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load tasks', 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  loadProjects(): void {
    this.projectService.getProjects({ per_page: 100 }).subscribe({
      next: (res) => (this.projects = res.data)
    });
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.loadTasks();
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTasks();
  }

  changeStatus(task: Task, status: TaskStatus): void {
    this.writeGuard.requireWrite().subscribe(ok => {
      if (!ok) { this.loadTasks(); return; } // reset the optimistic select
      this.taskService.updateStatus(task.id, status).subscribe({
        next: (res) => (task.status = res.task.status),
        error: () => this.snackBar.open('Failed to update status', 'Close', { duration: 4000 })
      });
    });
  }

  openCreate(): void {
    this.writeGuard.requireWrite().subscribe(ok => {
      if (!ok) return;
      if (this.projects.length === 0) {
        this.snackBar.open('Create a project first before adding tasks', 'Close', { duration: 4000 });
        return;
      }
      const ref = this.dialog.open(TaskFormDialogComponent, {
        width: '560px',
        data: { projects: this.projects }
      });
      ref.afterClosed().subscribe((result) => {
        if (result) this.loadTasks();
      });
    });
  }

  openTask(task: Task): void {
    const ref = this.dialog.open(TaskDetailDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { task }
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadTasks();
    });
  }

  editTask(task: Task, event: Event): void {
    event.stopPropagation();
    this.writeGuard.requireWrite().subscribe(ok => {
      if (!ok) return;
      const ref = this.dialog.open(TaskFormDialogComponent, { width: '560px', data: { task } });
      ref.afterClosed().subscribe((result) => {
        if (result) this.loadTasks();
      });
    });
  }

  confirmDelete(task: Task, event: Event): void {
    event.stopPropagation();
    this.writeGuard.requireWrite().subscribe(ok => {
      if (!ok) return;
      const ref = this.dialog.open(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title: 'Delete task',
          message: `Delete "${task.title}"? This cannot be undone.`,
          confirmText: 'Delete',
          danger: true
        }
      });
      ref.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.taskService.deleteTask(task.id).subscribe({
            next: () => {
              this.snackBar.open('Task deleted', 'Close', { duration: 3000 });
              this.loadTasks();
            },
            error: () => this.snackBar.open('Failed to delete task', 'Close', { duration: 4000 })
          });
        }
      });
    });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  isOverdue(task: Task): boolean {
    if (task.status === 'completed') return false;
    const due = parseApiDate(task.due_date);
    if (!due) return false;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return due < startOfToday;
  }

  /** Inline check-off: tick a row to complete (or un-complete) it. */
  toggleComplete(task: Task, event: Event): void {
    event.stopPropagation();
    const next: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    this.writeGuard.requireWrite().subscribe(ok => {
      if (!ok) return;
      this.taskService.updateStatus(task.id, next).subscribe({
        next: (res) => (task.status = res.task.status),
        error: () => this.snackBar.open('Failed to update task', 'Close', { duration: 4000 })
      });
    });
  }

  /** "Yesterday" / "in 2 days" style hint for a due date. */
  dueHint(task: Task): string {
    const due = parseApiDate(task.due_date);
    if (!due) return '';
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const days = Math.round((due.setHours(0, 0, 0, 0) - start.getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days < 0) return `${Math.abs(days)} days ago`;
    if (days <= 7) return `in ${days} days`;
    return '';
  }
}
