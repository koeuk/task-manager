import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { TaskService } from '../../../core/services/task.service';
import { User } from '../../../core/models/user.model';
import { Task } from '../../../core/models/project.model';
import { isPastDay } from '../../../core/utils/date-utils';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
  user?: User;
  tasks: Task[] = [];
  loading = true;
  notFound = false;

  taskColumns = ['title', 'status', 'priority', 'due_date'];

  stats = { total: 0, completed: 0, in_progress: 0, overdue: 0 };

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.notFound = true;
      this.loading = false;
      return;
    }

    forkJoin({
      user: this.userService.getUser(id),
      tasks: this.taskService.getTasks({ assigned_to: id, per_page: 100 })
    }).subscribe({
      next: ({ user, tasks }) => {
        this.user = user;
        this.tasks = tasks.data;
        this.computeStats();
        this.loading = false;
      },
      error: () => {
        this.notFound = true;
        this.loading = false;
      }
    });
  }

  private computeStats(): void {
    this.stats = {
      total: this.tasks.length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      in_progress: this.tasks.filter(t => t.status === 'in_progress').length,
      overdue: this.tasks.filter(t => t.status !== 'completed' && isPastDay(t.due_date)).length
    };
  }

  statusLabel(status: string): string {
    return status.replace('_', ' ');
  }

  get initials(): string {
    return (this.user?.name || '?').charAt(0).toUpperCase();
  }
}
