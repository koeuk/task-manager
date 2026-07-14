import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../core/models/project.model';
import { TaskDetailDialogComponent } from '../tasks/task-detail-dialog/task-detail-dialog.component';

interface CalendarDay {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="calendar-page">
      <div class="cal-header">
        <h1 class="page-title">Calendar</h1>
        <div class="cal-nav">
          <button mat-stroked-button (click)="today()">Today</button>
          <button mat-icon-button (click)="prevMonth()" aria-label="Previous month"><mat-icon>chevron_left</mat-icon></button>
          <span class="cal-month">{{ monthLabel }}</span>
          <button mat-icon-button (click)="nextMonth()" aria-label="Next month"><mat-icon>chevron_right</mat-icon></button>
        </div>
      </div>

      <mat-card class="cal-card">
        <div *ngIf="loading" class="cal-loading">
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        </div>

        <div *ngIf="!loading" class="cal-grid">
          <div class="cal-weekday" *ngFor="let d of weekdays">{{ d }}</div>

          <div class="cal-cell"
               *ngFor="let day of days"
               [class.other-month]="!day.inMonth"
               [class.today]="day.isToday">
            <div class="cell-date">{{ day.date.getDate() }}</div>
            <div class="cell-tasks">
              <button class="task-chip"
                      *ngFor="let t of day.tasks"
                      [ngClass]="'p-' + t.priority"
                      [matTooltip]="t.title + ' · ' + t.status"
                      (click)="openTask(t)">
                {{ t.title }}
              </button>
            </div>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .calendar-page { width: 100%; }
    .cal-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
    .page-title { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
    .cal-nav { display: flex; align-items: center; gap: 8px; }
    .cal-month { font-size: 16px; font-weight: 600; min-width: 150px; text-align: center; }
    .cal-loading { display: flex; justify-content: center; padding: 60px; }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: rgba(128,128,128,0.18); border: 1px solid rgba(128,128,128,0.18); border-radius: 8px; overflow: hidden; }
    .cal-weekday { padding: 10px 8px; text-align: center; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; opacity: .7; background: rgba(128,128,128,0.06); }
    .cal-cell { min-height: 104px; padding: 6px; background: var(--cal-cell-bg, #fff); display: flex; flex-direction: column; gap: 4px; }
    .cal-cell.other-month { opacity: .45; }
    .cal-cell.today .cell-date { background: #764ba2; color: #fff; }
    .cell-date { align-self: flex-start; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 13px; font-weight: 600; }
    .cell-tasks { display: flex; flex-direction: column; gap: 3px; overflow: hidden; }
    .task-chip { border: none; text-align: left; cursor: pointer; font-size: 11px; padding: 2px 6px; border-radius: 4px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .task-chip.p-low { background: #10b981; }
    .task-chip.p-medium { background: #f59e0b; }
    .task-chip.p-high { background: #f97316; }
    .task-chip.p-critical { background: #ef4444; }
  `]
})
export class CalendarComponent implements OnInit {
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  days: CalendarDay[] = [];
  monthLabel = '';
  loading = true;

  private viewDate = new Date();
  private tasksByDay = new Map<string, Task[]>();

  constructor(
    private taskService: TaskService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.viewDate.setDate(1);
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getTasks({ per_page: 500 }).subscribe({
      next: (res) => {
        this.tasksByDay.clear();
        for (const task of res.data) {
          if (!task.due_date) continue;
          const key = task.due_date.substring(0, 10);
          const list = this.tasksByDay.get(key) ?? [];
          list.push(task);
          this.tasksByDay.set(key, list);
        }
        this.buildGrid();
        this.loading = false;
      },
      error: () => {
        this.buildGrid();
        this.loading = false;
      }
    });
  }

  private buildGrid(): void {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    this.monthLabel = this.viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay()); // back to Sunday

    const today = new Date();
    const todayKey = this.dateKey(today);

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = this.dateKey(date);
      days.push({
        date,
        key,
        inMonth: date.getMonth() === month,
        isToday: key === todayKey,
        tasks: this.tasksByDay.get(key) ?? []
      });
    }
    this.days = days;
  }

  private dateKey(d: Date): string {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  prevMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.buildGrid();
  }

  nextMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.buildGrid();
  }

  today(): void {
    this.viewDate = new Date();
    this.viewDate.setDate(1);
    this.buildGrid();
  }

  openTask(task: Task): void {
    this.dialog.open(TaskDetailDialogComponent, { width: '600px', data: { task } })
      .afterClosed().subscribe(result => { if (result) this.loadTasks(); });
  }
}
