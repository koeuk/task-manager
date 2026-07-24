import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
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
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { Project, ProjectStatus } from '../../../core/models/project.model';
import { ProjectService } from '../../../core/services/project.service';
import { WriteGuardService } from '../../../core/services/write-guard.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProjectFormDialogComponent } from '../project-form-dialog/project-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PROJECT_STATUS_OPTIONS, statusLabel, projectStatusColor } from '../../../core/utils/task-meta';
import { parseApiDate, isPastDay } from '../../../core/utils/date-utils';

/** How long to wait after the last keystroke before re-querying. */
const SEARCH_DEBOUNCE_MS = 350;

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
    private toast: ToastService,
    private router: Router,
    private writeGuard: WriteGuardService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.loadProjects();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.reloadFromFirstPage());
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
        this.toast.error('Failed to load projects');
        this.loading = false;
      }
    });
  }

  onStatusChange(): void {
    this.reloadFromFirstPage();
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProjects();
  }

  openCreate(): void {
    this.ifWritable(() => {
      this.openDialog(ProjectFormDialogComponent, { width: '520px', data: {} })
        .subscribe(() => this.loadProjects());
    });
  }

  openEdit(project: Project, event: Event): void {
    event.stopPropagation();
    this.ifWritable(() => {
      this.openDialog(ProjectFormDialogComponent, { width: '520px', data: { project } })
        .subscribe(() => this.loadProjects());
    });
  }

  confirmDelete(project: Project, event: Event): void {
    event.stopPropagation();
    this.ifWritable(() => {
      this.openDialog(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title: 'Delete project',
          message: `Delete "${project.name}" and all its tasks? This cannot be undone.`,
          confirmText: 'Delete',
          danger: true
        }
      }).subscribe(() => this.deleteProject(project));
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

  /**
   * Include the year for dates outside the current year, so a due date years
   * away doesn't read as an ambiguous "Jan 1".
   */
  dueFormat(p: Project): string {
    const due = parseApiDate(p.due_date);
    return due && due.getFullYear() !== new Date().getFullYear() ? 'MMM d, y' : 'MMM d';
  }

  /** Past its due date and still open — surfaced in red on the card footer. */
  isOverdue(p: Project): boolean {
    if (p.status === 'completed' || p.status === 'archived') return false;
    return isPastDay(p.due_date);
  }

  progress(p: Project): number {
    const total = this.taskCount(p);
    return total ? Math.round((this.completedCount(p) / total) * 100) : 0;
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  // -------------------------------------------------------------- internals

  private reloadFromFirstPage(): void {
    this.pageIndex = 0;
    this.loadProjects();
  }

  /** Run `action` only once the write guard grants access. */
  private ifWritable(action: () => void): void {
    this.writeGuard.requireWrite().subscribe(allowed => {
      if (allowed) action();
    });
  }

  /** Open a dialog and emit only when it closes with a truthy result. */
  private openDialog<T>(component: ComponentType<T>, config: MatDialogConfig): Observable<unknown> {
    const ref: MatDialogRef<T> = this.dialog.open(component, config);
    return ref.afterClosed().pipe(filter(Boolean));
  }

  private deleteProject(project: Project): void {
    this.projectService.deleteProject(project.id).subscribe({
      next: () => {
        this.toast.success('Project deleted');
        this.loadProjects();
      },
      error: () => this.toast.error('Failed to delete project')
    });
  }
}
