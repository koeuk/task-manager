import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project } from '../models/project.model';
import { PaginatedResponse } from './user.service';

export interface ProjectFilters {
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface ProjectDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  start_date?: string;
  due_date?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  getProjects(filters?: ProjectFilters): Observable<PaginatedResponse<Project>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
    }

    return this.http.get<PaginatedResponse<Project>>(this.apiUrl, { params });
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  createProject(data: ProjectDto): Observable<{ message: string; project: Project }> {
    return this.http.post<{ message: string; project: Project }>(this.apiUrl, data);
  }

  updateProject(id: number, data: ProjectDto): Observable<{ message: string; project: Project }> {
    return this.http.put<{ message: string; project: Project }>(`${this.apiUrl}/${id}`, data);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
