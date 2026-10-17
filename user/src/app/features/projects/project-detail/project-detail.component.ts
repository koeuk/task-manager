import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem
} from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Project, Task } from '../../../core/models/project.model';
import { ActivityLog } from '../../../core/models/activity.model';
import { ProjectService } from '../../../core/services/project.service';
import { ActivityService } from '../../../core/services/activity.service';
import { TaskService, ReorderItem } from '../../../core/services/task.service';
import { TaskListService } from '../../../core/services/task-list.service';
import { AuthService } from '../../../core/services/auth.service';
import { WriteGuardService } from '../../../core/services/write-guard.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProjectFormDialogComponent } from '../project-form-dialog/project-form-dialog.component';
import { TaskFormDialogComponent } from '../../tasks/task-form-dialog/task-form-dialog.component';
import { TaskDetailDialogComponent } from '../../tasks/task-detail-dialog/task-detail-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { statusLabel, priorityLabel, statusColor, priorityColor, projectStatusColor } from '../../../core/utils/task-meta';
import { parseApiDate, isPastDay, daysFromToday } from '../../../core/utils/date-utils';

interface BoardColumn {
  id: number | null; // task list id, or null for the "Unassigned" column
  name: string;
  position: number;
  tasks: Task[];
  isVirtual?: boolean;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, DragDropModule, MatIconModule, MatButtonModule,
    MatMenuModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressBarModule,
    MatProgressSpinnerModule, MatTooltipModule, MatChipsModule, MatDividerModule
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  columns: BoardColumn[] = [];
  loading = true;
  projectId!: number;

  activeTab: 'board' | 'overview' | 'activity' = 'board';
  overviewSearch = '';
  overviewStatusFilter = '';
  overviewPriorityFilter = '';

  activities: ActivityLog[] = [];
  loadingActivities = false;
  activityActionFilter = '';
  activityPage = 1;
  activityTotal = 0;
  activityLastPage = 1;

  addingList = false;
  newListName = '';
  editingListId: number | null = null;
  editingListName = '';

  statusLabel = statusLabel;
  priorityLabel = priorityLabel;
  statusColor = statusColor;
  priorityColor = priorityColor;
  projectStatusColor = projectStatusColor;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private activityService: ActivityService,
    private taskService: TaskService,
    private taskListService: TaskListService,
    private authService: AuthService,
    private dialog: MatDialog,
    private toast: ToastService,
    private writeGuard: WriteGuardService
  ) {}

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    const initialTab = this.route.snapshot.queryParamMap.get('tab');
    if (initialTab === 'overview' || initialTab === 'details') {
      this.activeTab = 'overview';
    } else if (initialTab === 'activity' || initialTab === 'logs') {
      this.activeTab = 'activity';
    }
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadProject();
        if (this.activeTab === 'activity') {
          this.loadActivities();
        }
      } else {
        this.project = null;
        this.loading = false;
      }
    });
  }

  setTab(tab: 'board' | 'overview' | 'activity'): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
    if (tab === 'activity' && this.activities.length === 0) {
      this.loadActivities();
    }
  }

  loadActivities(page: number = 1): void {
    if (!this.projectId) return;
    this.loadingActivities = true;
    this.activityPage = page;
    this.activityService.getProjectActivities(this.projectId, {
      action: this.activityActionFilter || undefined,
      page: this.activityPage,
      per_page: 20
    }).subscribe({
      next: (res) => {
        this.activities = res.data;
        this.activityTotal = res.total;
        this.activityLastPage = res.last_page;
        this.loadingActivities = false;
      },
      error: () => {
        this.toast.error('Failed to load project activity logs');
        this.loadingActivities = false;
      }
    });
  }

  filterActivitiesByAction(action: string): void {
    this.activityActionFilter = action;
    this.loadActivities(1);
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'created': return 'add_circle';
      case 'updated': return 'edit';
      case 'completed': return 'check_circle';
      case 'deleted': return 'delete';
      case 'comment_added': return 'chat_bubble';
      case 'status_changed': return 'sync_alt';
      case 'priority_changed': return 'flag';
      case 'login': return 'login';
      case 'logout': return 'logout';
      default: return 'history';
    }
  }

  getActionBadge(action: string): { bg: string; text: string; label: string } {
    switch (action) {
      case 'created':
        return { bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', label: 'Created' };
      case 'completed':
        return { bg: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', label: 'Completed' };
      case 'updated':
        return { bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'Updated' };
      case 'status_changed':
        return { bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-400', label: 'Status' };
      case 'priority_changed':
        return { bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', label: 'Priority' };
      case 'comment_added':
        return { bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-400', label: 'Comment' };
      case 'deleted':
        return { bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-400', label: 'Deleted' };
      default:
        return { bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', label: action };
    }
  }

  relativeTime(isoString: string): string {
    if (!isoString) return '';
    const then = new Date(isoString).getTime();
    if (isNaN(then)) return '';
    const diff = Date.now() - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString();
  }

  openActivityTarget(act: ActivityLog): void {
    if (act.task) {
      this.openTask(act.task);
    } else if (act.task_id && this.project?.tasks) {
      const match = this.project.tasks.find(t => t.id === act.task_id);
      if (match) this.openTask(match);
    }
  }

  get inProgressTasks(): number {
    return this.project?.tasks?.filter(t => t.status === 'in_progress').length ?? 0;
  }

  get todoTasks(): number {
    return this.project?.tasks?.filter(t => t.status === 'todo').length ?? 0;
  }

  get reviewTasks(): number {
    return this.project?.tasks?.filter(t => t.status === 'review').length ?? 0;
  }

  get overdueTasks(): number {
    return this.project?.tasks?.filter(t => this.isOverdue(t)).length ?? 0;
  }

  get isProjectOverdue(): boolean {
    if (!this.project?.due_date) return false;
    if (this.project.status === 'completed' || this.project.status === 'archived') return false;
    return isPastDay(this.project.due_date);
  }

  get dueStatusText(): string {
    if (!this.project?.due_date) return 'No due date set';
    const days = daysFromToday(this.project.due_date);
    if (days === null) return '';
    if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days remaining`;
  }

  get statusBreakdown() {
    const total = this.totalTasks;
    const items = [
      { key: 'todo', label: 'To Do', count: this.todoTasks, color: statusColor('todo') },
      { key: 'in_progress', label: 'In Progress', count: this.inProgressTasks, color: statusColor('in_progress') },
      { key: 'review', label: 'In Review', count: this.reviewTasks, color: statusColor('review') },
      { key: 'completed', label: 'Completed', count: this.completedTasks, color: statusColor('completed') },
    ];
    return items.map(item => ({
      ...item,
      pct: total ? Math.round((item.count / total) * 100) : 0
    }));
  }

  get priorityBreakdown() {
    const total = this.totalTasks;
    const tasks = this.project?.tasks ?? [];
    const counts = {
      critical: tasks.filter(t => t.priority === 'critical').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };
    const items = [
      { key: 'critical', label: 'Critical', count: counts.critical, color: priorityColor('critical') },
      { key: 'high', label: 'High', count: counts.high, color: priorityColor('high') },
      { key: 'medium', label: 'Medium', count: counts.medium, color: priorityColor('medium') },
      { key: 'low', label: 'Low', count: counts.low, color: priorityColor('low') },
    ];
    return items.map(item => ({
      ...item,
      pct: total ? Math.round((item.count / total) * 100) : 0
    }));
  }

  get filteredOverviewTasks(): Task[] {
    let list = this.project?.tasks ?? [];
    if (this.overviewSearch.trim()) {
      const q = this.overviewSearch.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }
    if (this.overviewStatusFilter) {
      list = list.filter(t => t.status === this.overviewStatusFilter);
    }
    if (this.overviewPriorityFilter) {
      list = list.filter(t => t.priority === this.overviewPriorityFilter);
    }
    return list;
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  loadProject(): void {
    if (!this.authService.isAuthenticated()) {
      this.project = null;
      this.loading = false;
      return;
    }

    this.loading = true;
    this.projectService.getProject(this.projectId).subscribe({
      next: (project) => {
        this.project = project;
        this.buildColumns(project);
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load project');
        this.loading = false;
      }
    });
  }

  private byPosition = (a: Task, b: Task) => (a.position ?? 0) - (b.position ?? 0);

  buildColumns(project: Project): void {
    const lists = (project.task_lists ?? []).slice().sort((a, b) => a.position - b.position);
    const cols: BoardColumn[] = lists.map(l => ({
      id: l.id,
      name: l.name,
      position: l.position,
      tasks: (l.tasks ?? []).slice().sort(this.byPosition)
    }));
    const unassigned = (project.tasks ?? []).filter(t => !t.task_list_id).sort(this.byPosition);
    cols.push({ id: null, name: 'Unassigned', position: 9999, tasks: unassigned, isVirtual: true });
    this.columns = cols;
  }

  get dropListIds(): string[] {
    return this.columns.map(c => 'col-' + (c.id ?? 'none'));
  }

  get totalTasks(): number {
    return this.project?.tasks?.length ?? 0;
  }

  get completedTasks(): number {
    return this.project?.tasks?.filter(t => t.status === 'completed').length ?? 0;
  }

  get progress(): number {
    return this.totalTasks ? Math.round((this.completedTasks / this.totalTasks) * 100) : 0;
  }

  /** Past its due date and still open — surfaced in red on the task card. */
  isOverdue(task: Task): boolean {
    return task.status !== 'completed' && isPastDay(task.due_date);
  }

  /** Include the year for dates outside the current year so they aren't ambiguous. */
  dueFormat(task: Task): string {
    const due = parseApiDate(task.due_date);
    return due && due.getFullYear() !== new Date().getFullYear() ? 'MMM d, y' : 'MMM d';
  }

  // ---- Drag & drop ----
  drop(event: CdkDragDrop<Task[]>, targetColumn: BoardColumn): void {
    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) return;
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.persistColumns([targetColumn]);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      const moved = event.container.data[event.currentIndex];
      moved.task_list_id = targetColumn.id;
      const sourceColumn = this.columns.find(c => c.tasks === event.previousContainer.data);
      this.persistColumns(sourceColumn ? [targetColumn, sourceColumn] : [targetColumn]);
    }
  }

  private persistColumns(cols: BoardColumn[]): void {
    const payload: ReorderItem[] = [];
    cols.forEach(col => {
      col.tasks.forEach((task, index) => {
        task.position = index;
        payload.push({ id: task.id, position: index, task_list_id: col.id });
      });
    });
    if (payload.length === 0) return;
    this.taskService.reorderTasks(payload).subscribe({
      error: () => {
        this.toast.success('Failed to save order — refreshing');
        this.loadProject();
      }
    });
  }

  // ---- Tasks ----
  openTask(task: Task): void {
    // Read-only view — no write guard; the dialog guards its own actions.
    this.openDialog(TaskDetailDialogComponent, { width: '600px', maxWidth: '95vw', data: { task } })
      .subscribe(() => this.loadProject());
  }

  addTask(column: BoardColumn): void {
    this.ifWritable(() => {
      this.openDialog(TaskFormDialogComponent, {
        width: '540px',
        maxWidth: '95vw',
        data: { projectId: this.projectId, taskListId: column.id }
      }).subscribe(() => this.loadProject());
    });
  }

  // ---- Task lists ----
  startAddList(): void {
    this.writeGuard.requireWrite().subscribe(ok => {
      if (!ok) return;
      this.addingList = true;
      this.newListName = '';
    });
  }

  cancelAddList(): void {
    this.addingList = false;
    this.newListName = '';
  }

  saveNewList(): void {
    const name = this.newListName.trim();
    if (!name) return;
    this.taskListService.createTaskList({ project_id: this.projectId, name }).subscribe({
      next: () => {
        this.cancelAddList();
        this.loadProject();
      },
      error: () => this.toast.error('Failed to create list')
    });
  }

  startRenameList(column: BoardColumn): void {
    this.editingListId = column.id;
    this.editingListName = column.name;
  }

  cancelRenameList(): void {
    this.editingListId = null;
    this.editingListName = '';
  }

  saveRenameList(column: BoardColumn): void {
    const name = this.editingListName.trim();
    if (!name || column.id == null) { this.cancelRenameList(); return; }
    this.taskListService.updateTaskList(column.id, { name }).subscribe({
      next: () => {
        column.name = name;
        this.cancelRenameList();
      },
      error: () => this.toast.error('Failed to rename list')
    });
  }

  deleteList(column: BoardColumn): void {
    if (column.id == null) return;
    this.openDialog(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete list',
        message: `Delete the "${column.name}" list? Its tasks will be affected.`,
        confirmText: 'Delete',
        danger: true
      }
    }).subscribe(() => {
      if (column.id == null) return;
      this.taskListService.deleteTaskList(column.id).subscribe({
        next: () => this.loadProject(),
        error: () => this.toast.error('Failed to delete list')
      });
    });
  }

  // ---- Project ----
  editProject(): void {
    if (!this.project) return;
    this.openDialog(ProjectFormDialogComponent, { width: '520px', maxWidth: '95vw', data: { project: this.project } })
      .subscribe(() => this.loadProject());
  }

  deleteProject(): void {
    if (!this.project) return;
    this.openDialog(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete project',
        message: `Delete "${this.project.name}" and all its tasks? This cannot be undone.`,
        confirmText: 'Delete',
        danger: true
      }
    }).subscribe(() => {
      if (!this.project) return;
      this.projectService.deleteProject(this.project.id).subscribe({
        next: () => {
          this.toast.success('Project deleted');
          this.router.navigate(['/projects']);
        },
        error: () => this.toast.error('Failed to delete project')
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  // -------------------------------------------------------------- internals

  /** Run `action` when write access is confirmed. */
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
