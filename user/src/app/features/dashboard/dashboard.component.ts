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
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { WriteGuardService } from '../../core/services/write-guard.service';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { Task, Project } from '../../core/models/project.model';
import { TaskFormDialogComponent } from '../tasks/task-form-dialog/task-form-dialog.component';
import { TaskDetailDialogComponent } from '../tasks/task-detail-dialog/task-detail-dialog.component';
import { priorityColor, priorityLabel, projectStatusColor } from '../../core/utils/task-meta';
import { parseApiDate } from '../../core/utils/date-utils';
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
    private snackBar: MatSnackBar
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
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const endOfWeek = new Date(endOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const open = tasks.filter(t => t.status !== 'completed' && !!t.due_date);
    const withDate = open
      .map(t => ({ task: t, due: parseApiDate(t.due_date) }))
      .filter((x): x is { task: Task; due: Date } => x.due !== null)
      .sort((a, b) => a.due.getTime() - b.due.getTime());

    this.overdueTasks = withDate.filter(x => x.due < startOfToday).map(x => x.task);
    this.todayTasks = withDate.filter(x => x.due >= startOfToday && x.due <= endOfToday).map(x => x.task);
    this.upcomingTasks = withDate.filter(x => x.due > endOfToday && x.due <= endOfWeek).map(x => x.task);
  }

  /** Inline check-off straight from the dashboard. */
  completeTask(task: Task, event?: Event): void {
    event?.stopPropagation();
    this.writeGuard.requireWrite().subscribe(ok => {
      if (!ok) return;
      this.taskService.updateStatus(task.id, 'completed').subscribe({
        next: () => {
          this.snackBar.open(`"${task.title}" completed`, 'Close', { duration: 2500 });
          this.loadTasks();
          this.loadDashboardData();
        },
        error: () => this.snackBar.open('Failed to update task', 'Close', { duration: 4000 })
      });
    });
  }

  openTask(task: Task): void {
    const ref = this.dialog.open(TaskDetailDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { task }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks();
        this.loadDashboardData();
      }
    });
  }

  /** Quick-add a task without leaving the dashboard. */
  quickAddTask(): void {
    this.writeGuard.requireWrite().subscribe(ok => {
      if (!ok) return;
      if (!this.projects.length) {
        this.snackBar.open('Create a project first before adding tasks', 'Close', { duration: 4000 });
        return;
      }
      const ref = this.dialog.open(TaskFormDialogComponent, {
        width: '560px',
        data: { projects: this.projects }
      });
      ref.afterClosed().subscribe(result => {
        if (result) {
          this.loadTasks();
          this.loadDashboardData();
        }
      });
    });
  }

  createProject(): void {
    this.writeGuard.requireWrite().subscribe(ok => {
      if (ok) this.router.navigate(['/projects']);
    });
  }

  calculateProgress(): number {
    if (!this.stats || this.stats.total_tasks === 0) return 0;
    return Math.round((this.stats.completed_tasks / this.stats.total_tasks) * 100);
  }

  /** "3 days ago" / "in 2 days" style hint for a due date. */
  dueHint(task: Task): string {
    const due = parseApiDate(task.due_date);
    if (!due) return '';
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const days = Math.round((new Date(due).setHours(0, 0, 0, 0) - start.getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days < 0) return `${Math.abs(days)} days ago`;
    return `in ${days} days`;
  }
}
