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
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { toDateString } from '../../../shared/date-utils';

@Component({
  selector: 'app-project-dialog',
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
    <h2 mat-dialog-title>{{ isEditMode ? 'Edit Project' : 'Create Project' }}</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content class="dialog-content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="Project name">
          <mat-error>Name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="planning">Planning</mat-option>
              <mat-option value="active">Active</mat-option>
              <mat-option value="on_hold">On Hold</mat-option>
              <mat-option value="completed">Completed</mat-option>
              <mat-option value="archived">Archived</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="color-field">
            <mat-label>Color</mat-label>
            <input matInput type="color" formControlName="color">
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Start date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="start_date">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
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
    .dialog-content { display: flex; flex-direction: column; padding: 8px 16px 4px; min-width: 420px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 12px; }
    .row mat-form-field { flex: 1; }
    .color-field { max-width: 110px; }
    h2[mat-dialog-title] { padding: 16px 16px 4px; }
    mat-dialog-actions { padding: 8px 16px 16px; gap: 8px; }
    mat-dialog-actions button mat-progress-spinner { display: inline-block; margin-right: 8px; }
  `]
})
export class ProjectDialogComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Project | null
  ) {
    this.isEditMode = !!data;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.data?.name || '', [Validators.required]],
      description: [this.data?.description || ''],
      status: [this.data?.status || 'planning'],
      color: [this.data?.color || '#6366f1'],
      start_date: [this.data?.start_date || null],
      due_date: [this.data?.due_date || null]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const value = { ...this.form.value };
    value.start_date = this.toDate(value.start_date);
    value.due_date = this.toDate(value.due_date);

    const request = this.isEditMode
      ? this.projectService.updateProject(this.data!.id, value)
      : this.projectService.createProject(value);

    request.subscribe({
      next: () => {
        this.snackBar.open(`Project ${this.isEditMode ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(this.extractError(error), 'Close', { duration: 5000 });
      }
    });
  }

  private toDate(value: any): string | null {
    return toDateString(value);
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
