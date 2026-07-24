import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
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
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ComponentType } from '@angular/cdk/portal';
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
import { daysFromToday, isPastDay } from '../../../core/utils/date-utils';

/** How long to wait after the last keystroke before re-querying. */
const SEARCH_DEBOUNCE_MS = 350;

/** Upper bound on the project list used to populate the "new task" dialog. */
const PROJECT_PICKER_LIMIT = 100;

const TOAST_MS = { info: 3000, error: 4000 } as const;

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

  // Re-exported for the template.
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
    private writeGuard: WriteGuardService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadProjects();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.reloadFromFirstPage());
  }

  // ---------------------------------------------------------------- loading

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
        this.showError('Failed to load tasks');
        this.loading = false;
      }
    });
  }

  loadProjects(): void {
    this.projectService.getProjects({ per_page: PROJECT_PICKER_LIMIT })
      .subscribe({ next: (res) => (this.projects = res.data) });
  }

  // ------------------------------------------------------- filters & paging

  onFilterChange(): void {
    this.reloadFromFirstPage();
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTasks();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  // ------------------------------------------------------------- task edits

  openCreate(): void {
    this.ifWritable(() => {
      if (this.projects.length === 0) {
        this.showInfo('Create a project first before adding tasks');
        return;
      }
      this.openDialog(TaskFormDialogComponent, { width: '560px', data: { projects: this.projects } })
        .subscribe(() => this.loadTasks());
    });
  }

  openTask(task: Task): void {
    // Read-only view — no write guard; the dialog guards its own actions.
    this.openDialog(TaskDetailDialogComponent, { width: '600px', maxWidth: '95vw', data: { task } })
      .subscribe(() => this.loadTasks());
  }

  editTask(task: Task, event: Event): void {
    event.stopPropagation();
    this.ifWritable(() => {
      this.openDialog(TaskFormDialogComponent, { width: '560px', data: { task } })
        .subscribe(() => this.loadTasks());
    });
  }

  confirmDelete(task: Task, event: Event): void {
    event.stopPropagation();
    this.ifWritable(() => {
      this.openDialog(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title: 'Delete task',
          message: `Delete "${task.title}"? This cannot be undone.`,
          confirmText: 'Delete',
          danger: true
        }
      }).subscribe(() => this.deleteTask(task));
    });
  }

  changeStatus(task: Task, status: TaskStatus): void {
    this.writeGuard.requireWrite().subscribe(allowed => {
      // The select already moved optimistically; reload to put it back.
      if (!allowed) {
        this.loadTasks();
        return;
      }
      this.applyStatus(task, status);
    });
  }

  /** Inline check-off: tick a row to complete (or un-complete) it. */
  toggleComplete(task: Task, event: Event): void {
    event.stopPropagation();
    const next: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    this.ifWritable(() => this.applyStatus(task, next));
  }

  // ------------------------------------------------------------ due dates

  isOverdue(task: Task): boolean {
    return task.status !== 'completed' && isPastDay(task.due_date);
  }

  /** "Yesterday" / "in 2 days" style hint; empty when it isn't worth showing. */
  dueHint(task: Task): string {
    const days = daysFromToday(task.due_date);
    if (days === null) return '';

    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days < 0) return `${Math.abs(days)} days ago`;
    return days <= 7 ? `in ${days} days` : '';
  }

  // -------------------------------------------------------------- internals

  private reloadFromFirstPage(): void {
    this.pageIndex = 0;
    this.loadTasks();
  }

  /** Run `action` only once the write guard grants access. */
  private ifWritable(action: () => void): void {
    this.writeGuard.requireWrite().subscribe(allowed => {
      if (allowed) action();
    });
  }

  /** Open a dialog and emit only when it closes with a truthy result. */
  private openDialog<T>(component: ComponentType<T>, config: MatDialogConfig): Observable<unknown> {
    const ref: MatDialogRef<T> = this.dialog.open(component, config);
    return ref.afterClosed().pipe(filter(Boolean));
  }

  private applyStatus(task: Task, status: TaskStatus): void {
    this.taskService.updateStatus(task.id, status).subscribe({
      next: (res) => (task.status = res.task.status),
      error: () => this.showError('Failed to update status')
    });
  }

  private deleteTask(task: Task): void {
    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.showInfo('Task deleted');
        this.loadTasks();
      },
      error: () => this.showError('Failed to delete task')
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', { duration: TOAST_MS.info });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: TOAST_MS.error });
  }
}
