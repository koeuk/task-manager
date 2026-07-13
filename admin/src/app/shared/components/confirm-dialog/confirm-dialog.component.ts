import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog" [class.danger]="data.danger">
      <div class="confirm-icon">
        <mat-icon>{{ data.icon || (data.danger ? 'warning' : 'help_outline') }}</mat-icon>
      </div>
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <p class="confirm-message">{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]="false">{{ data.cancelText || 'Cancel' }}</button>
        <button mat-flat-button
                [color]="data.danger ? 'warn' : 'primary'"
                [mat-dialog-close]="true"
                cdkFocusInitial>
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog { padding: 8px 8px 4px; text-align: center; }
    .confirm-icon {
      width: 56px;
      height: 56px;
      margin: 4px auto 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #e2e8f0;
      color: #475569;
    }
    .confirm-icon mat-icon { font-size: 30px; width: 30px; height: 30px; }
    .confirm-dialog.danger .confirm-icon { background: #fee2e2; color: #dc2626; }
    h2[mat-dialog-title] { justify-content: center; padding: 0 8px; font-size: 20px; }
    .confirm-message { color: rgba(0,0,0,0.65); line-height: 1.55; margin: 4px 0 0; }
    mat-dialog-actions { padding: 12px 8px 4px; gap: 8px; }
    :host-context(.dark-theme) .confirm-icon { background: #262c40; color: #cbd5e1; }
    :host-context(.dark-theme) .confirm-dialog.danger .confirm-icon { background: #3a1d1d; color: #f87171; }
    :host-context(.dark-theme) .confirm-message { color: #cbd0da; }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
