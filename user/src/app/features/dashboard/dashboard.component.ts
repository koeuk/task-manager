import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

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
    MatChipsModule,
    MatListModule,
    MatBadgeModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  userName = '';

  statsCards = [
    { title: 'Active Projects', value: 0, icon: 'folder_open', color: 'primary' },
    { title: 'Total Tasks', value: 0, icon: 'task', color: 'accent' },
    { title: 'In Progress', value: 0, icon: 'pending', color: 'warn' },
    { title: 'Completed', value: 0, icon: 'check_circle', color: 'success' }
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = user.name;
      }
    });
  }

  loadDashboardData(): void {
    this.http.get<DashboardStats>('http://localhost:8000/api/dashboard')
      .subscribe({
        next: (data) => {
          this.stats = data;
          this.updateStatsCards();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard:', error);
          this.loading = false;
        }
      });
  }

  updateStatsCards(): void {
    if (this.stats) {
      this.statsCards[0].value = this.stats.active_projects;
      this.statsCards[1].value = this.stats.total_tasks;
      this.statsCards[2].value = this.stats.in_progress_tasks;
      this.statsCards[3].value = this.stats.completed_tasks;
    }
  }

  getTaskPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      urgent: 'warn',
      high: 'accent',
      medium: 'primary',
      low: ''
    };
    return colors[priority] || '';
  }

  getTaskStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      todo: '',
      in_progress: 'primary',
      review: 'accent',
      completed: 'success'
    };
    return colors[status] || '';
  }

  getProjectStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      planning: '',
      active: 'primary',
      on_hold: 'warn',
      completed: 'success',
      cancelled: 'warn'
    };
    return colors[status] || '';
  }

  calculateProgress(): number {
    if (!this.stats || this.stats.total_tasks === 0) return 0;
    return Math.round((this.stats.completed_tasks / this.stats.total_tasks) * 100);
  }
}