import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService } from '../../../core/services/project.service';
import { Project, Task } from '../../../core/models/project.model';

interface Segment { label: string; key: string; count: number; pct: number; }

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {
  project?: Project;
  tasks: Task[] = [];
  loading = true;
  notFound = false;

  taskColumns = ['title', 'status', 'priority', 'assignee', 'due_date'];

  completion = 0;
  overdue = 0;
  statusSegments: Segment[] = [];
  prioritySegments: Segment[] = [];

  private statusDefs = [
    { key: 'todo', label: 'To Do' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'review', label: 'Review' },
    { key: 'completed', label: 'Completed' }
  ];
  private priorityDefs = [
    { key: 'low', label: 'Low' },
    { key: 'medium', label: 'Medium' },
    { key: 'high', label: 'High' },
    { key: 'critical', label: 'Critical' }
  ];

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.notFound = true;
      this.loading = false;
      return;
    }

    this.projectService.getProject(id).subscribe({
      next: (project) => {
        this.project = project;
        this.tasks = project.tasks ?? [];
        this.computeAnalytics();
        this.loading = false;
      },
      error: () => {
        this.notFound = true;
        this.loading = false;
      }
    });
  }

  private computeAnalytics(): void {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.status === 'completed').length;
    this.completion = total ? Math.round((completed / total) * 100) : 0;

    const now = Date.now();
    this.overdue = this.tasks.filter(t =>
      t.status !== 'completed' && t.due_date && new Date(t.due_date).getTime() < now
    ).length;

    this.statusSegments = this.statusDefs.map(d => {
      const count = this.tasks.filter(t => t.status === d.key).length;
      return { ...d, count, pct: total ? Math.round((count / total) * 100) : 0 };
    });
    this.prioritySegments = this.priorityDefs.map(d => {
      const count = this.tasks.filter(t => t.priority === d.key).length;
      return { ...d, count, pct: total ? Math.round((count / total) * 100) : 0 };
    });
  }

  statusLabel(status: string): string {
    return status.replace('_', ' ');
  }
}
