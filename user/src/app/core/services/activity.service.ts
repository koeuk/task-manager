import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivityLog } from '../models/activity.model';
import { Paginated } from '../models/project.model';
import { environment } from '../../../environments/environment';

export interface ActivityFilters {
  entity_type?: string;
  action?: string;
  search?: string;
  user_id?: number | string;
  per_page?: number;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private apiUrl = `${environment.apiUrl}/activities`;

  constructor(private http: HttpClient) {}

  getActivities(filters: ActivityFilters = {}): Observable<Paginated<ActivityLog>> {
    let params = new HttpParams();
    if (filters.entity_type) params = params.set('entity_type', filters.entity_type);
    if (filters.action) params = params.set('action', filters.action);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.user_id) params = params.set('user_id', filters.user_id.toString());
    if (filters.per_page) params = params.set('per_page', filters.per_page);
    if (filters.page) params = params.set('page', filters.page);

    return this.http.get<Paginated<ActivityLog>>(this.apiUrl, { params });
  }

  getProjectActivities(projectId: number, filters: ActivityFilters = {}): Observable<Paginated<ActivityLog>> {
    let params = new HttpParams();
    if (filters.action) params = params.set('action', filters.action);
    if (filters.per_page) params = params.set('per_page', filters.per_page);
    if (filters.page) params = params.set('page', filters.page);

    return this.http.get<Paginated<ActivityLog>>(`${environment.apiUrl}/projects/${projectId}/activities`, { params });
  }
}
