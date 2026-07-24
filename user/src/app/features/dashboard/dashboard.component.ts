import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { WriteGuardService } from '../../core/services/write-guard.service';
import { ToastService } from '../../core/services/toast.service';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { Task, Project } from '../../core/models/project.model';
import { TaskFormDialogComponent } from '../tasks/task-form-dialog/task-form-dialog.component';
import { TaskDetailDialogComponent } from '../tasks/task-detail-dialog/task-detail-dialog.component';
import { priorityColor, priorityLabel, projectStatusColor } from '../../core/utils/task-meta';
import { daysFromToday } from '../../core/utils/date-utils';
import { environment } from '../../../environments/environment';

interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  recent_projects: any[];
  recent_tasks: any[];
  upcoming_tasks: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  loadingTasks = true;
  userName = '';
  today = new Date();

  projects: Project[] = [];

  // Task buckets — what the user actually needs to act on
  overdueTasks: Task[] = [];
  todayTasks: Task[] = [];
  upcomingTasks: Task[] = [];

  priorityColor = priorityColor;
  priorityLabel = priorityLabel;
  projectStatusColor = projectStatusColor;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private writeGuard: WriteGuardService,
    private taskService: TaskService,
    private projectService: ProjectService,
    private dialog: MatDialog,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadTasks();
    this.loadProjects();
    // Assign unconditionally so the name clears on logout instead of going stale.
    this.authService.currentUser$.subscribe(user => {
      this.userName = user?.name ?? '';
    });
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  /** Nothing due, nothing late — used for the all-clear state. */
  get hasNothingDue(): boolean {
    return !this.overdueTasks.length && !this.todayTasks.length && !this.upcomingTasks.length;
  }

  loadDashboardData(): void {
    this.http.get<DashboardStats>(`${environment.apiUrl}/dashboard`).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  loadProjects(): void {
    this.projectService.getProjects({ per_page: 100 }).subscribe({
      next: (res) => (this.projects = res.data ?? [])
    });
  }

  loadTasks(): void {
    this.loadingTasks = true;
    this.taskService.getTasks({ per_page: 100 }).subscribe({
      next: (res) => {
        this.bucketTasks(res.data ?? []);
        this.loadingTasks = false;
      },
      error: () => (this.loadingTasks = false)
    });
  }

  /** Split open tasks into overdue / due today / due in the next 7 days. */
  private bucketTasks(tasks: Task[]): void {
    const dated = tasks
      .filter(t => t.status !== 'completed' && !!t.due_date)
      .map(t => ({ task: t, days: daysFromToday(t.due_date) }))
      .filter((x): x is { task: Task; days: number } => x.days !== null)
      .sort((a, b) => a.days - b.days);

    this.overdueTasks = dated.filter(x => x.days < 0).map(x => x.task);
    this.todayTasks = dated.filter(x => x.days === 0).map(x => x.task);
    this.upcomingTasks = dated.filter(x => x.days >= 1 && x.days <= 7).map(x => x.task);
  }

  /** Inline check-off straight from the dashboard. */
  completeTask(task: Task, event?: Event): void {
    event?.stopPropagation();
    this.ifWritable(() => {
      this.taskService.updateStatus(task.id, 'completed').subscribe({
        next: () => {
          this.toast.success(`"${task.title}" completed`);
          this.refresh();
        },
        error: () => this.toast.error('Failed to update task')
      });
    });
  }

  openTask(task: Task): void {
    // Read-only view — no write guard; the dialog guards its own actions.
    this.openDialog(TaskDetailDialogComponent, { width: '600px', maxWidth: '95vw', data: { task } })
      .subscribe(() => this.refresh());
  }

  /** Quick-add a task without leaving the dashboard. */
  quickAddTask(): void {
    this.ifWritable(() => {
      if (!this.projects.length) {
        this.toast.info('Create a project first before adding tasks');
        return;
      }
      this.openDialog(TaskFormDialogComponent, { width: '560px', data: { projects: this.projects } })
        .subscribe(() => this.refresh());
    });
  }

  createProject(): void {
    this.ifWritable(() => this.router.navigate(['/projects']));
  }

  calculateProgress(): number {
    if (!this.stats || this.stats.total_tasks === 0) return 0;
    return Math.round((this.stats.completed_tasks / this.stats.total_tasks) * 100);
  }

  /** "3 days ago" / "in 2 days" style hint. Dashboard only lists tasks within
   *  the next 7 days, so any positive count is shown as "in N days". */
  dueHint(task: Task): string {
    const days = daysFromToday(task.due_date);
    if (days === null) return '';

    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    return days < 0 ? `${Math.abs(days)} days ago` : `in ${days} days`;
  }

  // -------------------------------------------------------------- internals

  /** The two panels that share a data source; reloaded together after a change. */
  private refresh(): void {
    this.loadTasks();
    this.loadDashboardData();
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
}
