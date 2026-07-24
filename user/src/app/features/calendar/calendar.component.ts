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
  templateUrl: './calendar.component.html'
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
