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
import { Task, Project, TaskStatus, TaskPriority } from '../../../core/models/project.model';
import { TaskService, TaskPayload } from '../../../core/services/task.service';
import { toDateString, parseApiDate } from '../../../shared/date-utils';

export interface TaskFormData {
  task?: Task;
  projectId?: number;
  taskListId?: number | null;
  projects?: Project[]; // when present, show a project selector (e.g. My Tasks page)
}

@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule,
    MatNativeDateModule, MatProgressSpinnerModule
  ],
  templateUrl: './task-form-dialog.component.html',
  styleUrls: ['./task-form-dialog.component.scss']
})
export class TaskFormDialogComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  isEdit = false;
  showProjectSelect = false;

  priorities: { value: TaskPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  statuses: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'completed', label: 'Completed' }
  ];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<TaskFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskFormData
  ) {}

  ngOnInit(): void {
    const t = this.data?.task;
    this.isEdit = !!t;
    // Project selector only for new tasks created from a context without a fixed project.
    this.showProjectSelect = !this.isEdit && !!this.data?.projects && !this.data?.projectId;

    this.form = this.fb.group({
      title: [t?.title ?? '', [Validators.required, Validators.maxLength(255)]],
      description: [t?.description ?? ''],
      project_id: [t?.project_id ?? this.data?.projectId ?? null],
      priority: [t?.priority ?? 'medium', Validators.required],
      status: [t?.status ?? 'todo', Validators.required],
      due_date: [parseApiDate(t?.due_date)],
      estimated_hours: [t?.estimated_hours ?? null]
    });

    if (this.showProjectSelect) {
      this.form.get('project_id')!.addValidators(Validators.required);
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const projectId = this.isEdit ? this.data.task!.project_id : (v.project_id ?? this.data.projectId);
    if (!projectId) {
      this.snackBar.open('Please choose a project', 'Close', { duration: 4000 });
      return;
    }

    this.saving = true;
    const base: Partial<TaskPayload> = {
      title: v.title,
      description: v.description || null,
      priority: v.priority,
      status: v.status,
      due_date: toDateString(v.due_date),
      estimated_hours: v.estimated_hours != null && v.estimated_hours !== '' ? Number(v.estimated_hours) : null
    };

    const request$ = this.isEdit && this.data.task
      ? this.taskService.updateTask(this.data.task.id, base)
      : this.taskService.createTask({
          ...base,
          project_id: projectId,
          task_list_id: this.data.taskListId ?? null
        } as TaskPayload);

    request$.subscribe({
      next: (res) => {
        this.snackBar.open(res.message || 'Saved', 'Close', { duration: 3000 });
        this.dialogRef.close(res.task);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Failed to save task', 'Close', { duration: 5000 });
      }
    });
  }
}
