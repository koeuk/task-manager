import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Project, ProjectStatus } from '../../../core/models/project.model';
import { ProjectService } from '../../../core/services/project.service';
import { toDateString } from '../../../shared/date-utils';

@Component({
  selector: 'app-project-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule,
    MatNativeDateModule, MatProgressSpinnerModule
  ],
  templateUrl: './project-form-dialog.component.html',
  styleUrls: ['./project-form-dialog.component.scss']
})
export class ProjectFormDialogComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  isEdit = false;

  statuses: { value: ProjectStatus; label: string }[] = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' }
  ];

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<ProjectFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { project?: Project }
  ) {}

  ngOnInit(): void {
    const p = this.data?.project;
    this.isEdit = !!p;
    this.form = this.fb.group({
      name: [p?.name ?? '', [Validators.required, Validators.maxLength(255)]],
      description: [p?.description ?? ''],
      status: [p?.status ?? 'planning', Validators.required],
      color: [p?.color ?? '#2196f3'],
      start_date: [p?.start_date ? new Date(p.start_date) : null],
      due_date: [p?.due_date ? new Date(p.due_date) : null]
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const v = this.form.value;
    const payload = {
      name: v.name,
      description: v.description || null,
      status: v.status,
      color: v.color || null,
      start_date: toDateString(v.start_date),
      due_date: toDateString(v.due_date)
    };

    const request$ = this.isEdit && this.data.project
      ? this.projectService.updateProject(this.data.project.id, payload)
      : this.projectService.createProject(payload);

    request$.subscribe({
      next: (res) => {
        this.snackBar.open(res.message || 'Saved', 'Close', { duration: 3000 });
        this.dialogRef.close(res.project);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Failed to save project', 'Close', { duration: 5000 });
      }
    });
  }
}
