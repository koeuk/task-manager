import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Project, ProjectStatus } from '../../../core/models/project.model';
import { ProjectService } from '../../../core/services/project.service';
import { ProjectFormDialogComponent } from '../project-form-dialog/project-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PROJECT_STATUS_OPTIONS, statusLabel, projectStatusColor } from '../../../shared/task-meta';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatMenuModule,
    MatProgressBarModule, MatProgressSpinnerModule, MatPaginatorModule, MatTooltipModule
  ],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  loading = true;
  total = 0;
  pageSize = 12;
  pageIndex = 0;

  searchControl = new FormControl('');
  statusFilter: ProjectStatus | '' = '';
  statusOptions = PROJECT_STATUS_OPTIONS;
  statusLabel = statusLabel;
  projectStatusColor = projectStatusColor;

  constructor(
    private projectService: ProjectService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadProjects();
      });
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getProjects({
      search: this.searchControl.value || '',
      status: this.statusFilter,
      per_page: this.pageSize,
      page: this.pageIndex + 1
    }).subscribe({
      next: (res) => {
        this.projects = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load projects', 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  onStatusChange(): void {
    this.pageIndex = 0;
    this.loadProjects();
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProjects();
  }

  openCreate(): void {
    const ref = this.dialog.open(ProjectFormDialogComponent, { width: '520px', data: {} });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadProjects();
    });
  }

  openEdit(project: Project, event: Event): void {
    event.stopPropagation();
    const ref = this.dialog.open(ProjectFormDialogComponent, { width: '520px', data: { project } });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadProjects();
    });
  }

  confirmDelete(project: Project, event: Event): void {
    event.stopPropagation();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete project',
        message: `Delete "${project.name}" and all its tasks? This cannot be undone.`,
        confirmText: 'Delete',
        danger: true
      }
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.projectService.deleteProject(project.id).subscribe({
          next: () => {
            this.snackBar.open('Project deleted', 'Close', { duration: 3000 });
            this.loadProjects();
          },
          error: () => this.snackBar.open('Failed to delete project', 'Close', { duration: 4000 })
        });
      }
    });
  }

  openProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  taskCount(p: Project): number {
    return p.tasks?.length ?? 0;
  }

  completedCount(p: Project): number {
    return p.tasks?.filter(t => t.status === 'completed').length ?? 0;
  }

  progress(p: Project): number {
    const total = this.taskCount(p);
    return total ? Math.round((this.completedCount(p) / total) * 100) : 0;
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }
}
