import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
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
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { ProjectDialogComponent } from '../project-dialog/project-dialog.component';

@Component({
  selector: 'app-project-list',
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
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'status', 'tasks', 'due_date', 'created_at', 'actions'];
  dataSource = new MatTableDataSource<Project>();
  loading = false;
  filterForm!: FormGroup;
  total = 0;
  pageIndex = 0;
  pageSize = 10;

  constructor(
    private projectService: ProjectService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({ search: [''], status: [''] });

    this.filterForm.get('search')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => { this.pageIndex = 0; this.loadProjects(); });

    this.filterForm.get('status')?.valueChanges
      .subscribe(() => { this.pageIndex = 0; this.loadProjects(); });

    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getProjects({
      search: this.filterForm.get('search')?.value,
      status: this.filterForm.get('status')?.value,
      page: this.pageIndex + 1,
      per_page: this.pageSize
    }).subscribe({
      next: (res) => {
        this.dataSource.data = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load projects', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  openDialog(project?: Project): void {
    this.dialog.open(ProjectDialogComponent, { width: '520px', data: project || null })
      .afterClosed().subscribe(result => { if (result) this.loadProjects(); });
  }

  deleteProject(project: Project): void {
    if (!confirm(`Delete project "${project.name}"? This also removes its tasks.`)) return;

    this.projectService.deleteProject(project.id).subscribe({
      next: () => {
        this.snackBar.open('Project deleted', 'Close', { duration: 3000 });
        this.loadProjects();
      },
      error: (error) => {
        this.snackBar.open(error.error?.message || 'Failed to delete project', 'Close', { duration: 5000 });
      }
    });
  }

  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProjects();
  }

  taskCount(project: Project): number {
    return project.tasks?.length ?? 0;
  }
}
