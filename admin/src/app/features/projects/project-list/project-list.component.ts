import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { Project } from '../../../core/models/project.model';
import { ProjectDialogComponent } from '../project-dialog/project-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

/** How long to wait after the last keystroke before re-querying. */
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
    private toast: ToastService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({ search: [''], status: [''] });

    this.filterForm.get('search')?.valueChanges
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.reloadFromFirstPage());

    this.filterForm.get('status')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reloadFromFirstPage());

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
        this.toast.error('Failed to load projects');
        this.loading = false;
      }
    });
  }

  openDialog(project?: Project): void {
    this.dialog.open(ProjectDialogComponent, { width: '560px', data: project || null })
      .afterClosed().subscribe(result => { if (result) this.loadProjects(); });
  }

  deleteProject(project: Project): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete project?',
        message: `"${project.name}" and all of its tasks will be permanently removed. This cannot be undone.`,
        confirmText: 'Delete',
        danger: true,
        icon: 'delete'
      }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.projectService.deleteProject(project.id).subscribe({
        next: () => {
          this.toast.success('Project deleted');
          this.loadProjects();
        },
        error: (error) => this.toast.error(error)
      });
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProjects();
  }

  taskCount(project: Project): number {
    return project.tasks?.length ?? 0;
  }

  private reloadFromFirstPage(): void {
    this.pageIndex = 0;
    this.loadProjects();
  }
}
