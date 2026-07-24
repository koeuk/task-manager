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
import { toDateString } from '../../../core/utils/date-utils';

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
  templateUrl: './project-dialog.component.html'
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
