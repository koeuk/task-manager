import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { Task } from '../../../core/models/project.model';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';

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
    MatSnackBarModule,
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
  filterForm!: FormGroup;
  total = 0;
  pageIndex = 0;
  pageSize = 10;

  constructor(
    private taskService: TaskService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({ search: [''], status: [''], priority: [''] });

    this.filterForm.get('search')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => { this.pageIndex = 0; this.loadTasks(); });

    this.filterForm.get('status')?.valueChanges.subscribe(() => { this.pageIndex = 0; this.loadTasks(); });
    this.filterForm.get('priority')?.valueChanges.subscribe(() => { this.pageIndex = 0; this.loadTasks(); });

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
        this.snackBar.open('Failed to load tasks', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  openDialog(task?: Task): void {
    this.dialog.open(TaskDialogComponent, { width: '560px', data: task || null })
      .afterClosed().subscribe(result => { if (result) this.loadTasks(); });
  }

  deleteTask(task: Task): void {
    if (!confirm(`Delete task "${task.title}"?`)) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.snackBar.open('Task deleted', 'Close', { duration: 3000 });
        this.loadTasks();
      },
      error: (error) => {
        this.snackBar.open(error.error?.message || 'Failed to delete task', 'Close', { duration: 5000 });
      }
    });
  }

  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTasks();
  }

  statusLabel(status: string): string {
    return status.replace('_', ' ');
  }
}
