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
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Project, Task } from '../../../core/models/project.model';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService, ReorderItem } from '../../../core/services/task.service';
import { TaskListService } from '../../../core/services/task-list.service';
import { WriteGuardService } from '../../../core/services/write-guard.service';
import { ProjectFormDialogComponent } from '../project-form-dialog/project-form-dialog.component';
import { TaskFormDialogComponent } from '../../tasks/task-form-dialog/task-form-dialog.component';
import { TaskDetailDialogComponent } from '../../tasks/task-detail-dialog/task-detail-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { statusLabel, priorityLabel, statusColor, priorityColor, projectStatusColor } from '../../../shared/task-meta';

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
    private snackBar: MatSnackBar,
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
        this.snackBar.open('Failed to load project', 'Close', { duration: 4000 });
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
        this.snackBar.open('Failed to save order — refreshing', 'Close', { duration: 3000 });
        this.loadProject();
      }
    });
  }

  // ---- Tasks ----
  openTask(task: Task): void {
    const ref = this.dialog.open(TaskDetailDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { task }
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadProject();
    });
  }

  addTask(column: BoardColumn): void {
    this.writeGuard.requireWrite().subscribe(ok => {
      if (!ok) return;
      const ref = this.dialog.open(TaskFormDialogComponent, {
        width: '560px',
        data: { projectId: this.projectId, taskListId: column.id }
      });
      ref.afterClosed().subscribe((result) => {
        if (result) this.loadProject();
      });
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
      error: () => this.snackBar.open('Failed to create list', 'Close', { duration: 4000 })
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
      error: () => this.snackBar.open('Failed to rename list', 'Close', { duration: 4000 })
    });
  }

  deleteList(column: BoardColumn): void {
    if (column.id == null) return;
    if (this.writeGuard.blockGuest()) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete list',
        message: `Delete the "${column.name}" list? Its tasks will be affected.`,
        confirmText: 'Delete',
        danger: true
      }
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed && column.id != null) {
        this.taskListService.deleteTaskList(column.id).subscribe({
          next: () => this.loadProject(),
          error: () => this.snackBar.open('Failed to delete list', 'Close', { duration: 4000 })
        });
      }
    });
  }

  // ---- Project ----
  editProject(): void {
    if (!this.project) return;
    if (this.writeGuard.blockGuest()) return;
    const ref = this.dialog.open(ProjectFormDialogComponent, {
      width: '520px',
      data: { project: this.project }
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadProject();
    });
  }

  deleteProject(): void {
    if (!this.project) return;
    if (this.writeGuard.blockGuest()) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete project',
        message: `Delete "${this.project.name}" and all its tasks? This cannot be undone.`,
        confirmText: 'Delete',
        danger: true
      }
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed && this.project) {
        this.projectService.deleteProject(this.project.id).subscribe({
          next: () => {
            this.snackBar.open('Project deleted', 'Close', { duration: 3000 });
            this.router.navigate(['/projects']);
          },
          error: () => this.snackBar.open('Failed to delete project', 'Close', { duration: 4000 })
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}
