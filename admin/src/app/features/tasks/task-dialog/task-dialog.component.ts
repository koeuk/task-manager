import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { UserService } from '../../../core/services/user.service';
import { Task, Project } from '../../../core/models/project.model';
import { User } from '../../../core/models/user.model';
import { toDateString } from '../../../shared/date-utils';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './task-dialog.component.html'
})
export class TaskDialogComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  isEditMode = false;
  projects: Project[] = [];
  users: User[] = [];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private projectService: ProjectService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<TaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Task | null
  ) {
    this.isEditMode = !!data;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      title: [this.data?.title || '', [Validators.required]],
      description: [this.data?.description || ''],
      status: [this.data?.status || 'todo'],
      priority: [this.data?.priority || 'medium'],
      assigned_to: [this.data?.assigned_to ?? null],
      due_date: [this.data?.due_date || null]
    });

    // A task's project is fixed once created: the update endpoint ignores
    // project_id, and moving a task across projects would strand it in a
    // task list belonging to the old project.
    if (!this.isEditMode) {
      this.form.addControl('project_id', this.fb.control(null, [Validators.required]));

      this.projectService.getProjects({ per_page: 100 }).subscribe({
        next: (res) => (this.projects = res.data)
      });
    }

    this.userService.getUsers({ per_page: 100 }).subscribe({
      next: (res) => (this.users = res.data)
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const value = { ...this.form.value };
    if (value.due_date) {
      value.due_date = toDateString(value.due_date);
    }

    const request = this.isEditMode
      ? this.taskService.updateTask(this.data!.id, value)
      : this.taskService.createTask(value);

    request.subscribe({
      next: () => {
        this.snackBar.open(`Task ${this.isEditMode ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(this.extractError(error), 'Close', { duration: 5000 });
      }
    });
  }

  private extractError(error: any): string {
    if (error.error?.errors) {
      const first = Object.values(error.error.errors)[0];
      return Array.isArray(first) ? first[0] : String(first);
    }
    return error.error?.message || 'An error occurred';
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
