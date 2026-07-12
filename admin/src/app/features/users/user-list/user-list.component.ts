import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { UserDialogComponent } from '../user-dialog/user-dialog.component';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['name', 'email', 'role', 'phone', 'created_at', 'actions'];
  dataSource = new MatTableDataSource<User>();
  loading = false;
  filterForm!: FormGroup;
  totalUsers = 0;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initFilterForm();
    this.loadUsers();
  }

  initFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      role: ['']
    });

    // Debounce search input
    this.filterForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => this.loadUsers());

    this.filterForm.get('role')?.valueChanges
      .subscribe(() => this.loadUsers());
  }

  loadUsers(): void {
    this.loading = true;
    const filters = {
      search: this.filterForm.get('search')?.value,
      role: this.filterForm.get('role')?.value,
      page: this.paginator?.pageIndex + 1 || 1,
      per_page: this.paginator?.pageSize || 10
    };

    this.userService.getUsers(filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalUsers = response.total;
        this.loading = false;
      },
      error: (error) => {
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
        this.loading = false;
        console.error('Load users error:', error);
      }
    });
  }

  openUserDialog(user?: User): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: user || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  changeUserRole(user: User): void {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    
    this.userService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        this.snackBar.open(`User role changed to ${newRole}`, 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (error) => {
        this.snackBar.open(error.error?.message || 'Failed to change role', 'Close', { duration: 5000 });
      }
    });
  }

  resetPassword(user: User): void {
    const password = prompt('Enter new password for ' + user.email + ':');
    if (!password) return;

    this.userService.resetUserPassword(user.id, password).subscribe({
      next: () => {
        this.snackBar.open('Password reset successfully', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to reset password', 'Close', { duration: 3000 });
      }
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (error) => {
        this.snackBar.open(error.error?.message || 'Failed to delete user', 'Close', { duration: 5000 });
      }
    });
  }

  onPageChange(): void {
    this.loadUsers();
  }
}