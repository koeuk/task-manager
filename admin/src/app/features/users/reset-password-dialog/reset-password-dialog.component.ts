import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Reset password</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="content">
        <p class="hint">Set a new password for <strong>{{ data.email }}</strong>.</p>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New password</mat-label>
          <mat-icon matPrefix>lock</mat-icon>
          <input matInput [type]="hide ? 'password' : 'text'" formControlName="password">
          <button mat-icon-button matSuffix type="button" (click)="hide = !hide">
            <mat-icon>{{ hide ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-error>Minimum 8 characters</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Confirm password</mat-label>
          <mat-icon matPrefix>lock</mat-icon>
          <input matInput type="password" formControlName="confirm">
          <mat-error *ngIf="form.hasError('mismatch')">Passwords do not match</mat-error>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" [mat-dialog-close]="undefined">Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Reset password</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .content { display: flex; flex-direction: column; min-width: 380px; padding-top: 6px; }
    .hint { margin: 0 0 12px; color: rgba(0,0,0,0.6); }
    .full-width { width: 100%; }
    mat-form-field mat-icon[matPrefix] { margin: 0 8px 0 2px; color: #9ca3af; }
    :host-context(.dark-theme) .hint { color: #cbd0da; }
  `]
})
export class ResetPasswordDialogComponent {
  form: FormGroup;
  hide = true;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ResetPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { email: string }
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]]
    }, { validators: this.matchValidator });
  }

  private matchValidator(group: AbstractControl): ValidationErrors | null {
    return group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true };
  }

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value.password as string);
  }
}
