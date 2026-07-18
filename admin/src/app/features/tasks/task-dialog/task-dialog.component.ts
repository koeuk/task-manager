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
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Edit Task' : 'Create Task' }}</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="dialog-content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" placeholder="Task title">
          <mat-error>Title is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" *ngIf="!isEditMode">
          <mat-label>Project</mat-label>
          <mat-select formControlName="project_id">
            <mat-option *ngFor="let p of projects" [value]="p.id">{{ p.name }}</mat-option>
          </mat-select>
          <mat-error>Project is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="todo">To Do</mat-option>
              <mat-option value="in_progress">In Progress</mat-option>
              <mat-option value="review">Review</mat-option>
              <mat-option value="completed">Completed</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              <mat-option value="low">Low</mat-option>
              <mat-option value="medium">Medium</mat-option>
              <mat-option value="high">High</mat-option>
              <mat-option value="critical">Critical</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Assignee</mat-label>
            <mat-select formControlName="assigned_to">
              <mat-option [value]="null">Unassigned</mat-option>
              <mat-option *ngFor="let u of users" [value]="u.id">{{ u.name }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Due date</mat-label>
            <input matInput [matDatepicker]="duePicker" formControlName="due_date">
            <mat-datepicker-toggle matSuffix [for]="duePicker"></mat-datepicker-toggle>
            <mat-datepicker #duePicker></mat-datepicker>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading">
          <mat-progress-spinner *ngIf="loading" diameter="18" mode="indeterminate"></mat-progress-spinner>
          <span>{{ isEditMode ? 'Save' : 'Create' }}</span>
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .dialog-content { display: flex; flex-direction: column; padding-top: 8px; min-width: 460px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 12px; }
    .row mat-form-field { flex: 1; }
    mat-dialog-actions button mat-progress-spinner { display: inline-block; margin-right: 8px; }
  `]
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
