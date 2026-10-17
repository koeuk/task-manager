import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { AuditLog } from '../../../core/models/audit-log.model';

@Component({
  selector: 'app-audit-log-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './audit-log-detail-dialog.component.html'
})
export class AuditLogDetailDialogComponent {
  jsonView = false;

  constructor(
    public dialogRef: MatDialogRef<AuditLogDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public log: AuditLog
  ) {}

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
      return { bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-400', label: 'Status Changed' };
    }
    if (act.includes('priority')) {
      return { bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', label: 'Priority Changed' };
    }
    if (act.includes('comment')) {
      return { bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-400', label: 'Comment Added' };
    }
    if (act.includes('login')) {
      return { bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-400', label: 'User Login' };
    }
    if (act.includes('logout')) {
      return { bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', label: 'User Logout' };
    }
    if (act.includes('update')) {
      return { bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'Updated' };
    }
    return { bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', label: action };
  }

  get propertyEntries(): { key: string; value: any }[] {
    if (!this.log.properties) return [];
    return Object.entries(this.log.properties).map(([key, value]) => ({ key, value }));
  }

  formatValue(val: any): string {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  close(): void {
    this.dialogRef.close();
  }
}
