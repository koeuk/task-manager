import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { DashboardService } from './dashboard.service';

export interface AppNotification {
  id: number;
  icon: string;
  title: string;
  subtitle: string;
  time?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private dashboardService: DashboardService) {}

  /**
   * Derives a notification feed from the most recent tasks returned by the
   * admin dashboard endpoint (real data — no fake entries).
   */
  loadNotifications(): Observable<AppNotification[]> {
    return this.dashboardService.getDashboardStats().pipe(
      map(stats => (stats.recent_tasks || []).slice(0, 6).map((t: any) => ({
        id: t.id,
        icon: this.statusIcon(t.status),
        title: t.title,
        subtitle: this.subtitle(t),
        time: t.updated_at || t.created_at
      }))),
      catchError(() => of([]))
    );
  }

  private statusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'check_circle';
      case 'in_progress': return 'autorenew';
      case 'review': return 'rate_review';
      default: return 'radio_button_unchecked';
    }
  }

  private subtitle(t: any): string {
    const status = (t.status || '').replace('_', ' ');
    const project = t.project?.name ? ` · ${t.project.name}` : '';
    return `${status}${project}`;
  }
}
