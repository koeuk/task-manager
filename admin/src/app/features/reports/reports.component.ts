import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardService, ReportData } from '../../core/services/dashboard.service';
import { toDateString } from '../../core/utils/date-utils';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  rangeForm!: FormGroup;
  loading = false;
  report?: ReportData;
  productivityColumns = ['name', 'email', 'completed_tasks'];

  summaryCards: Array<{ key: keyof ReportData; title: string; icon: string; color: string }> = [
    { key: 'tasks_created', title: 'Tasks Created', icon: 'add_task', color: 'primary' },
    { key: 'tasks_completed', title: 'Tasks Completed', icon: 'task_alt', color: 'success' },
    { key: 'projects_created', title: 'Projects Created', icon: 'create_new_folder', color: 'accent' },
    { key: 'new_users', title: 'New Users', icon: 'person_add', color: 'warn' }
  ];

  constructor(
    private dashboardService: DashboardService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    this.rangeForm = this.fb.group({ start: [start], end: [end] });
    this.loadReport();
  }

  loadReport(): void {
    this.loading = true;
    const start = this.toDate(this.rangeForm.get('start')?.value);
    const end = this.toDate(this.rangeForm.get('end')?.value);

    this.dashboardService.getReports(start, end).subscribe({
      next: (data) => {
        this.report = data;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load report', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  cardValue(key: keyof ReportData): number {
    const value = this.report?.[key];
    return typeof value === 'number' ? value : 0;
  }

  private toDate(value: any): string | undefined {
    return toDateString(value) ?? undefined;
  }
}
