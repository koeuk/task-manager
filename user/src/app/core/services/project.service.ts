import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, Paginated, ProjectStatus } from '../models/project.model';

export interface ProjectFilters {
  status?: ProjectStatus | '';
  search?: string;
  per_page?: number;
  page?: number;
}

export interface ProjectPayload {
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  status?: ProjectStatus;
}

interface ProjectResponse {
  message: string;
  project: Project;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = 'http://localhost:8000/api/projects';

  constructor(private http: HttpClient) {}

  getProjects(filters: ProjectFilters = {}): Observable<Paginated<Project>> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.per_page) params = params.set('per_page', filters.per_page);
    if (filters.page) params = params.set('page', filters.page);
    return this.http.get<Paginated<Project>>(this.apiUrl, { params });
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  createProject(payload: ProjectPayload): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(this.apiUrl, payload);
  }

  updateProject(id: number, payload: Partial<ProjectPayload>): Observable<ProjectResponse> {
    return this.http.put<ProjectResponse>(`${this.apiUrl}/${id}`, payload);
  }

  deleteProject(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
