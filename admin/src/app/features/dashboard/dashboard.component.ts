import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { ThemeService } from '../../core/services/theme.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statusChart') statusChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityChart!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  loading = true;
  error: string | null = null;

  private statusChartInstance?: Chart;
  private priorityChartInstance?: Chart;
  private themeSub?: Subscription;

  statsCards = [
    { title: 'Total Users', value: 0, icon: 'people', color: 'primary' },
    { title: 'Total Projects', value: 0, icon: 'folder', color: 'accent' },
    { title: 'Total Tasks', value: 0, icon: 'assignment', color: 'warn' },
    { title: 'Completed Tasks', value: 0, icon: 'check_circle', color: 'success' }
  ];

  constructor(
    private dashboardService: DashboardService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();

    // Re-render charts with theme-appropriate colors when the theme changes
    this.themeSub = this.themeService.isDark$.subscribe(() => {
      if (this.stats) {
        this.createCharts();
      }
    });
  }

  ngAfterViewInit(): void {
    // Charts will be created after data is loaded
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
    this.statusChartInstance?.destroy();
    this.priorityChartInstance?.destroy();
  }

  loadDashboardData(): void {
    this.dashboardService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.updateStatsCards();
        this.loading = false;
        // Delay chart creation to ensure canvas is rendered
        setTimeout(() => this.createCharts(), 100);
      },
      error: (error) => {
        this.error = 'Failed to load dashboard data';
        this.loading = false;
        console.error('Dashboard error:', error);
      }
    });
  }

  updateStatsCards(): void {
    if (this.stats) {
      this.statsCards[0].value = this.stats.total_users;
      this.statsCards[1].value = this.stats.total_projects;
      this.statsCards[2].value = this.stats.total_tasks;
      this.statsCards[3].value = this.stats.completed_tasks;
    }
  }

  createCharts(): void {
    if (!this.stats || !this.statusChart || !this.priorityChart) return;

    // Theme-aware colors for chart text, gridlines and slice borders
    const dark = this.themeService.isDark;
    const textColor = dark ? '#e5e7eb' : '#4b5563';
    const gridColor = dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    const borderColor = dark ? '#171d2e' : '#ffffff';

    // Recreate from scratch so a theme switch fully re-colors the charts
    this.statusChartInstance?.destroy();
    this.priorityChartInstance?.destroy();

    // Status Chart
    const statusCtx = this.statusChart.nativeElement.getContext('2d');
    if (statusCtx) {
      this.statusChartInstance = new Chart(statusCtx, {
        type: 'pie',
        data: {
          labels: this.stats.tasks_by_status.map(s => s.status || 'Unknown'),
          datasets: [{
            data: this.stats.tasks_by_status.map(s => s.count),
            backgroundColor: [
              '#9E9E9E', // todo
              '#2196F3', // in_progress
              '#FF9800', // review
              '#4CAF50'  // completed
            ],
            borderColor,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor }
            },
            title: {
              display: true,
              text: 'Tasks by Status',
              color: textColor
            }
          }
        }
      });
    }

    // Priority Chart
    const priorityCtx = this.priorityChart.nativeElement.getContext('2d');
    if (priorityCtx) {
      this.priorityChartInstance = new Chart(priorityCtx, {
        type: 'bar',
        data: {
          labels: this.stats.tasks_by_priority.map(p => p.priority || 'Unknown'),
          datasets: [{
            label: 'Tasks',
            data: this.stats.tasks_by_priority.map(p => p.count),
            backgroundColor: [
              '#4CAF50', // low
              '#FFC107', // medium
              '#FF9800', // high
              '#F44336'  // critical
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Tasks by Priority',
              color: textColor
            }
          },
          scales: {
            x: {
              ticks: { color: textColor },
              grid: { color: gridColor }
            },
            y: {
              beginAtZero: true,
              ticks: { color: textColor, stepSize: 1 },
              grid: { color: gridColor }
            }
          }
        }
      });
    }
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'todo': 'basic',
      'in_progress': 'primary',
      'review': 'accent',
      'completed': 'success'
    };
    return colors[status] || 'basic';
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'low': 'success',
      'medium': 'primary',
      'high': 'accent',
      'critical': 'warn'
    };
    return colors[priority] || 'basic';
  }
}
