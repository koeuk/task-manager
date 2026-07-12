import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  total_users: number;
  total_projects: number;
  total_tasks: number;
  completed_tasks: number;
  active_projects: number;
  tasks_by_status: Array<{ status: string; count: number }>;
  tasks_by_priority: Array<{ priority: string; count: number }>;
  recent_projects: any[];
  recent_tasks: any[];
  user_stats: Array<{ role: string; count: number }>;
}

export interface ReportData {
  tasks_created: number;
  tasks_completed: number;
  projects_created: number;
  new_users: number;
  productivity_by_user: any[];
  project_progress: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
  }

  getReports(startDate?: string, endDate?: string): Observable<ReportData> {
    let params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    return this.http.get<ReportData>(`${this.apiUrl}/reports`, { params });
  }
}