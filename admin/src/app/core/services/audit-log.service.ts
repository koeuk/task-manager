import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLog, AuditLogFilters } from '../models/audit-log.model';
import { PaginatedResponse } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private apiUrl = `${environment.apiUrl}/admin/audit-logs`;

  constructor(private http: HttpClient) {}

  getAuditLogs(filters?: AuditLogFilters): Observable<PaginatedResponse<AuditLog>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.action) params = params.set('action', filters.action);
      if (filters.entity_type) params = params.set('entity_type', filters.entity_type);
      if (filters.user_id) params = params.set('user_id', filters.user_id.toString());
      if (filters.project_id) params = params.set('project_id', filters.project_id.toString());
      if (filters.from_date) params = params.set('from_date', filters.from_date);
      if (filters.to_date) params = params.set('to_date', filters.to_date);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
    }

    return this.http.get<PaginatedResponse<AuditLog>>(this.apiUrl, { params });
  }
}
