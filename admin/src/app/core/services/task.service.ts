import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task } from '../models/project.model';
import { PaginatedResponse } from './user.service';

export interface TaskFilters {
  project_id?: number;
  task_list_id?: number;
  status?: string;
  priority?: string;
  assigned_to?: number;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface TaskDto {
  project_id: number;
  task_list_id?: number;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  assigned_to?: number;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(filters?: TaskFilters): Observable<PaginatedResponse<Task>> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Task>>(this.apiUrl, { params });
  }

  getTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  createTask(data: TaskDto): Observable<{ message: string; task: Task }> {
    return this.http.post<{ message: string; task: Task }>(this.apiUrl, data);
  }

  updateTask(id: number, data: Partial<TaskDto>): Observable<{ message: string; task: Task }> {
    return this.http.put<{ message: string; task: Task }>(`${this.apiUrl}/${id}`, data);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
