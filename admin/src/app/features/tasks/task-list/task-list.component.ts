import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { Task } from '../../../core/models/project.model';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { exportToCsv } from '../../../core/utils/csv-export';
import { ActivatedRoute } from '@angular/router';

/** How long to wait after the last keystroke before re-querying. */
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  displayedColumns: string[] = ['title', 'status', 'priority', 'assignee', 'due_date', 'actions'];
  dataSource = new MatTableDataSource<Task>();
  loading = false;
  exporting = false;
  filterForm!: FormGroup;
  total = 0;
  pageIndex = 0;
  pageSize = 10;

  constructor(
    private taskService: TaskService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private toast: ToastService,
    private route: ActivatedRoute,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    // Allow deep-linking with a search term (e.g. from a notification)
    const initialSearch = this.route.snapshot.queryParamMap.get('search') || '';
    this.filterForm = this.fb.group({ search: [initialSearch], status: [''], priority: [''] });

    this.filterForm.get('search')?.valueChanges
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.reloadFromFirstPage());

    this.filterForm.get('status')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reloadFromFirstPage());

    this.filterForm.get('priority')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reloadFromFirstPage());

    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getTasks({
      search: this.filterForm.get('search')?.value,
      status: this.filterForm.get('status')?.value,
      priority: this.filterForm.get('priority')?.value,
      page: this.pageIndex + 1,
      per_page: this.pageSize
    }).subscribe({
      next: (res) => {
        this.dataSource.data = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load tasks');
        this.loading = false;
      }
    });
  }

  openDialog(task?: Task): void {
    this.dialog.open(TaskDialogComponent, { width: '560px', data: task || null })
      .afterClosed().subscribe(result => { if (result) this.loadTasks(); });
  }

  deleteTask(task: Task): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete task?',
        message: `"${task.title}" will be permanently removed. This cannot be undone.`,
        confirmText: 'Delete',
        danger: true,
        icon: 'delete'
      }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.taskService.deleteTask(task.id).subscribe({
        next: () => {
          this.toast.success('Task deleted');
          this.loadTasks();
        },
        error: (error) => this.toast.error(error)
      });
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTasks();
  }

  private reloadFromFirstPage(): void {
    this.pageIndex = 0;
    this.loadTasks();
  }

  statusLabel(status: string): string {
    return status.replace('_', ' ');
  }

  exportCsv(): void {
    if (!this.dataSource.data.length) {
      this.toast.info('No tasks to export');
      return;
    }

    // Pagination is server-side, so re-fetch every row matching the current
    // filters — this.dataSource.data is only the page currently on screen.
    this.exporting = true;

    this.taskService.getTasks({
      search: this.filterForm.get('search')?.value,
      status: this.filterForm.get('status')?.value,
      priority: this.filterForm.get('priority')?.value,
      page: 1,
      per_page: this.total || 1000
    }).subscribe({
      next: (res) => {
        this.exporting = false;
        exportToCsv('tasks', res.data, [
          { header: 'Title', value: t => t.title },
          { header: 'Status', value: t => this.statusLabel(t.status) },
          { header: 'Priority', value: t => t.priority },
          { header: 'Assignee', value: t => t.assignee?.name ?? 'Unassigned' },
          { header: 'Project', value: t => t.project?.name ?? '' },
          { header: 'Due Date', value: t => t.due_date ?? '' },
          { header: 'Created', value: t => t.created_at ?? '' }
        ]);
      },
      error: () => {
        this.exporting = false;
        this.toast.error('Failed to export tasks');
      }
    });
  }
}
