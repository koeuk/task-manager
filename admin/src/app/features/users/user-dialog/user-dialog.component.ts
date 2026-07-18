import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-dialog',
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
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.scss']
})
export class UserDialogComponent implements OnInit {
  userForm!: FormGroup;
  loading = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User | null
  ) {
    this.isEditMode = !!data;
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.userForm = this.fb.group({
      name: [this.data?.name || '', [Validators.required]],
      email: [this.data?.email || '', [Validators.required, Validators.email]],
      role: [this.data?.role || 'user', [Validators.required]],
      phone: [this.data?.phone || '']
    });

    // Password is only set at creation time. The update endpoint does not accept
    // a password, so offering one here would silently discard it — changing an
    // existing user's password goes through the reset-password dialog instead.
    if (!this.isEditMode) {
      this.userForm.addControl(
        'password',
        this.fb.control('', [Validators.required, Validators.minLength(8)])
      );
    }
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;

    this.loading = true;
    const formData = this.userForm.value;

    const request = this.isEditMode
      ? this.userService.updateUser(this.data!.id, formData)
      : this.userService.createUser(formData);

    request.subscribe({
      next: (user) => {
        this.snackBar.open(
          `User ${this.isEditMode ? 'updated' : 'created'} successfully`,
          'Close',
          { duration: 3000 }
        );
        this.dialogRef.close(user);
      },
      error: (error) => {
        this.loading = false;
        let message = 'An error occurred';
        
        if (error.error?.errors) {
          const firstError = Object.values(error.error.errors)[0];
          message = Array.isArray(firstError) ? firstError[0] : firstError;
        } else if (error.error?.message) {
          message = error.error.message;
        }
        
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}