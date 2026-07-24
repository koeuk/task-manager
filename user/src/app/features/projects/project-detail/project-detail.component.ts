import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem
} from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Project, Task } from '../../../core/models/project.model';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService, ReorderItem } from '../../../core/services/task.service';
import { TaskListService } from '../../../core/services/task-list.service';
import { WriteGuardService } from '../../../core/services/write-guard.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProjectFormDialogComponent } from '../project-form-dialog/project-form-dialog.component';
import { TaskFormDialogComponent } from '../../tasks/task-form-dialog/task-form-dialog.component';
import { TaskDetailDialogComponent } from '../../tasks/task-detail-dialog/task-detail-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { statusLabel, priorityLabel, statusColor, priorityColor, projectStatusColor } from '../../../core/utils/task-meta';
import { parseApiDate, isPastDay } from '../../../core/utils/date-utils';

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
    CommonModule, FormsModule, DragDropModule, MatIconModule, MatButtonModule,
    MatMenuModule, MatFormFieldModule, MatInputModule, MatProgressBarModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  columns: BoardColumn[] = [];
  loading = true;
  projectId!: number;

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
    private taskService: TaskService,
    private taskListService: TaskListService,
    private dialog: MatDialog,
    private toast: ToastService,
    private writeGuard: WriteGuardService
  ) {}

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject();
  }

  /** Guests browse read-only — used to disable drag-and-drop on the board. */
  get isGuest(): boolean {
    return this.writeGuard.isGuest;
  }

  loadProject(): void {
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
        width: '560px',
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
    if (this.writeGuard.blockGuest()) return;
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
    if (this.writeGuard.blockGuest()) return;
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
    if (this.writeGuard.blockGuest()) return;
    this.openDialog(ProjectFormDialogComponent, { width: '520px', data: { project: this.project } })
      .subscribe(() => this.loadProject());
  }

  deleteProject(): void {
    if (!this.project) return;
    if (this.writeGuard.blockGuest()) return;
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

  /** Run `action` only once the write guard grants access (pops login if guest). */
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
