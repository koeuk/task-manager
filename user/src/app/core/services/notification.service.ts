import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TaskService } from './task.service';
import { Task } from '../models/project.model';

export interface AppNotification {
  id: number;
  icon: string;
  title: string;
  subtitle: string;
  dueDate?: string;
  overdue: boolean;
}

/** How many days ahead counts as "due soon". */
const DUE_SOON_DAYS = 3;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private taskService: TaskService) {}

  /**
   * Builds a real notification feed from the user's own tasks: anything not yet
   * completed that is overdue or due within the next few days. No fake entries —
   * an empty feed means there's genuinely nothing needing attention.
   */
  loadNotifications(): Observable<AppNotification[]> {
    return this.taskService.getTasks({ per_page: 100 }).pipe(
      map(res => this.buildFeed(res?.data ?? [])),
      catchError(() => of([]))
    );
  }

  private buildFeed(tasks: Task[]): AppNotification[] {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + DUE_SOON_DAYS);

    return tasks
      .filter(t => t.status !== 'completed' && !!t.due_date)
      .map(t => ({ task: t, due: new Date(t.due_date as string) }))
      .filter(({ due }) => !isNaN(due.getTime()) && due <= cutoff)
      .sort((a, b) => a.due.getTime() - b.due.getTime())
      .slice(0, 8)
      .map(({ task, due }) => {
        const overdue = due < now;
        const project = task.project?.name ? ` · ${task.project.name}` : '';
        return {
          id: task.id,
          icon: overdue ? 'error_outline' : 'schedule',
          title: task.title,
          subtitle: `${overdue ? 'Overdue' : 'Due soon'}${project}`,
          dueDate: task.due_date ?? undefined,
          overdue
        };
      });
  }
}
