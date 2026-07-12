import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, Paginated, TaskStatus, TaskPriority } from '../models/project.model';
import { environment } from '../../../environments/environment';

export interface TaskFilters {
  project_id?: number;
  task_list_id?: number;
  status?: TaskStatus | '';
  priority?: TaskPriority | '';
  assigned_to?: number;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface TaskPayload {
  project_id: number;
  task_list_id?: number | null;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_to?: number | null;
  start_date?: string | null;
  due_date?: string | null;
  estimated_hours?: number | null;
  position?: number;
}

interface TaskResponse {
  message: string;
  task: Task;
}

export interface ReorderItem {
  id: number;
  position: number;
  task_list_id?: number | null;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(filters: TaskFilters = {}): Observable<Paginated<Task>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value as string | number);
      }
    });
    return this.http.get<Paginated<Task>>(this.apiUrl, { params });
  }

  getTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  createTask(payload: TaskPayload): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(this.apiUrl, payload);
  }

  updateTask(id: number, payload: Partial<TaskPayload>): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${this.apiUrl}/${id}`, payload);
  }

  updateStatus(id: number, status: TaskStatus): Observable<TaskResponse> {
    return this.updateTask(id, { status });
  }

  deleteTask(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  reorderTasks(tasks: ReorderItem[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reorder`, { tasks });
  }
}
