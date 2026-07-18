import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
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
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ResetPasswordDialogComponent } from '../reset-password-dialog/reset-password-dialog.component';
import { exportToCsv } from '../../../core/utils/csv-export';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
  exporting = false;
  filterForm!: FormGroup;
  totalUsers = 0;
  sortBy = 'created_at';
  sortDir: 'asc' | 'desc' = 'desc';
  private latestRequestId = 0;

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

    // Debounce search input. Both filters reset to the first page: changing a
    // filter while on page 5 would otherwise request page 5 of a much shorter
    // result set and render an empty table.
    this.filterForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => this.onFilterChange());

    this.filterForm.get('role')?.valueChanges
      .subscribe(() => this.onFilterChange());
  }

  onFilterChange(): void {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadUsers();
  }

  /** Sorting is server-side, so it covers the whole result set, not just this page. */
  onSortChange(sort: Sort): void {
    this.sortBy = sort.active || 'created_at';
    this.sortDir = sort.direction || 'desc';

    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    const filters = {
      search: this.filterForm.get('search')?.value,
      role: this.filterForm.get('role')?.value,
      page: this.paginator?.pageIndex + 1 || 1,
      per_page: this.paginator?.pageSize || 10,
      sort_by: this.sortBy,
      sort_dir: this.sortDir
    };

    // Requests can overlap (debounced search vs. an immediate filter or page
    // change) and may resolve out of order. Only the newest one may write to
    // the table, otherwise a slow earlier response overwrites fresher results.
    const requestId = ++this.latestRequestId;

    this.userService.getUsers(filters).subscribe({
      next: (response) => {
        if (requestId !== this.latestRequestId) return;
        this.dataSource.data = response.data;
        this.totalUsers = response.total;
        this.loading = false;
      },
      error: (error) => {
        if (requestId !== this.latestRequestId) return;
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
        this.loading = false;
        console.error('Load users error:', error);
      }
    });
  }

  openUserDialog(user?: User): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '560px',
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
    const roleLabel = newRole.charAt(0).toUpperCase() + newRole.slice(1);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: `Change role to ${roleLabel}?`,
        message: `${user.name} will be given "${roleLabel}" permissions. Are you sure you want to change this user's role?`,
        confirmText: `Change to ${roleLabel}`,
        cancelText: 'Cancel',
        icon: 'swap_horiz'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.userService.updateUserRole(user.id, newRole).subscribe({
        next: () => {
          this.snackBar.open(`User role changed to ${newRole}`, 'Close', { duration: 3000 });
          this.loadUsers();
        },
        error: (error) => {
          this.snackBar.open(error.error?.message || 'Failed to change role', 'Close', { duration: 5000 });
        }
      });
    });
  }

  resetPassword(user: User): void {
    const dialogRef = this.dialog.open(ResetPasswordDialogComponent, {
      width: '440px',
      data: { email: user.email }
    });

    dialogRef.afterClosed().subscribe((password: string | undefined) => {
      if (!password) return;

      this.userService.resetUserPassword(user.id, password).subscribe({
        next: () => {
          this.snackBar.open('Password reset successfully', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Failed to reset password', 'Close', { duration: 3000 });
        }
      });
    });
  }

  deleteUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete user?',
        message: `${user.name} (${user.email}) will be permanently removed. This cannot be undone.`,
        confirmText: 'Delete',
        danger: true,
        icon: 'delete'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
          this.loadUsers();
        },
        error: (error) => {
          this.snackBar.open(error.error?.message || 'Failed to delete user', 'Close', { duration: 5000 });
        }
      });
    });
  }

  onPageChange(): void {
    this.loadUsers();
  }

  exportCsv(): void {
    if (!this.dataSource.data.length) {
      this.snackBar.open('No users to export', 'Close', { duration: 3000 });
      return;
    }

    // Pagination is server-side, so this.dataSource.data holds only the page on
    // screen. Re-fetch every row matching the current filters, otherwise the
    // export silently contains just the visible 10.
    this.exporting = true;

    this.userService.getUsers({
      search: this.filterForm.get('search')?.value,
      role: this.filterForm.get('role')?.value,
      page: 1,
      per_page: this.totalUsers || 1000
    }).subscribe({
      next: (response) => {
        this.exporting = false;
        exportToCsv('users', response.data, [
          { header: 'Name', value: u => u.name },
          { header: 'Email', value: u => u.email },
          { header: 'Role', value: u => u.role },
          { header: 'Phone', value: u => u.phone ?? '' },
          { header: 'Created', value: u => u.created_at ?? '' }
        ]);
      },
      error: () => {
        this.exporting = false;
        this.snackBar.open('Failed to export users', 'Close', { duration: 4000 });
      }
    });
  }
}