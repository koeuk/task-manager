import { Component, DestroyRef, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuditLogService } from '../../core/services/audit-log.service';
import { AuditLog, AuditLogFilters } from '../../core/models/audit-log.model';
import { AuditLogDetailDialogComponent } from './audit-log-detail-dialog/audit-log-detail-dialog.component';
import { exportToCsv } from '../../core/utils/csv-export';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-audit-logs',
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
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  logs: AuditLog[] = [];
  displayedColumns: string[] = ['created_at', 'user', 'action', 'entity', 'description', 'ip_address', 'actions'];
  totalLogs = 0;
  loading = false;
  exporting = false;

  filterForm: FormGroup;
  pageIndex = 0;
  pageSize = 25;

  constructor(
    private auditLogService: AuditLogService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private toast: ToastService,
    private destroyRef: DestroyRef
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      action: [''],
      entity_type: ['']
    });
  }

  ngOnInit(): void {
    this.loadLogs();

    this.filterForm.valueChanges
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.pageIndex = 0;
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadLogs();
      });
  }

  loadLogs(): void {
    this.loading = true;
    const formVals = this.filterForm.value;

    const filters: AuditLogFilters = {
      search: formVals.search?.trim() || undefined,
      action: formVals.action || undefined,
      entity_type: formVals.entity_type || undefined,
      page: this.pageIndex + 1,
      per_page: this.pageSize
    };

    this.auditLogService.getAuditLogs(filters).subscribe({
      next: (res) => {
        this.logs = res.data;
        this.totalLogs = res.total;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load audit logs');
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadLogs();
  }

  viewDetails(log: AuditLog): void {
    this.dialog.open(AuditLogDetailDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      data: log
    });
  }

  exportCsv(): void {
    if (this.exporting) return;
    this.exporting = true;

    const formVals = this.filterForm.value;
    const filters: AuditLogFilters = {
      search: formVals.search?.trim() || undefined,
      action: formVals.action || undefined,
      entity_type: formVals.entity_type || undefined,
      page: 1,
      per_page: 500
    };

    this.auditLogService.getAuditLogs(filters).subscribe({
      next: (res) => {
        exportToCsv(
          `audit-logs-${new Date().toISOString().slice(0, 10)}`,
          res.data,
          [
            { header: 'ID', value: r => r.id },
            { header: 'Timestamp', value: r => r.created_at },
            { header: 'Action', value: r => r.action },
            { header: 'Actor Name', value: r => r.user?.name || 'System' },
            { header: 'Actor Email', value: r => r.user?.email || '' },
            { header: 'Actor Role', value: r => r.user?.role || '' },
            { header: 'Entity Type', value: r => r.entity_type || '' },
            { header: 'Entity ID', value: r => r.entity_id || '' },
            { header: 'Project', value: r => r.project?.name || '' },
            { header: 'Task', value: r => r.task?.title || '' },
            { header: 'Description', value: r => r.description },
            { header: 'IP Address', value: r => r.ip_address || '' },
            { header: 'User Agent', value: r => r.user_agent || '' }
          ]
        );
        this.toast.success(`Exported ${res.data.length} audit records`);
        this.exporting = false;
      },
      error: () => {
        this.toast.error('Failed to export audit logs');
        this.exporting = false;
      }
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      action: '',
      entity_type: ''
    });
  }

  getActionIcon(action: string): string {
    const act = (action || '').toLowerCase();
    if (act.includes('complete')) return 'check_circle';
    if (act.includes('create')) return 'add_circle';
    if (act.includes('delete')) return 'delete';
    if (act.includes('status')) return 'sync_alt';
    if (act.includes('priority')) return 'flag';
    if (act.includes('comment')) return 'chat_bubble';
    if (act.includes('login')) return 'login';
    if (act.includes('logout')) return 'logout';
    if (act.includes('update')) return 'edit';
    return 'history';
  }

  getActionBadge(action: string): { bg: string; text: string; label: string } {
    const act = (action || '').toLowerCase();
    if (act.includes('complete')) {
      return { bg: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', label: 'Completed' };
    }
    if (act.includes('create')) {
      return { bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', label: 'Created' };
    }
    if (act.includes('delete')) {
      return { bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-400', label: 'Deleted' };
    }
    if (act.includes('status')) {
      return { bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-400', label: 'Status' };
    }
    if (act.includes('priority')) {
      return { bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', label: 'Priority' };
    }
    if (act.includes('comment')) {
      return { bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-400', label: 'Comment' };
    }
    if (act.includes('login')) {
      return { bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-400', label: 'Login' };
    }
    if (act.includes('logout')) {
      return { bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', label: 'Logout' };
    }
    if (act.includes('update')) {
      return { bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'Updated' };
    }
    return { bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', label: action };
  }
}
