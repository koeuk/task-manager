import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskList } from '../models/project.model';
import { environment } from '../../../environments/environment';

interface TaskListResponse {
  message: string;
  task_list: TaskList;
}

export interface ReorderListItem {
  id: number;
  position: number;
}

@Injectable({ providedIn: 'root' })
export class TaskListService {
  private apiUrl = `${environment.apiUrl}/task-lists`;

  constructor(private http: HttpClient) {}

  getTaskLists(projectId: number): Observable<TaskList[]> {
    const params = new HttpParams().set('project_id', projectId);
    return this.http.get<TaskList[]>(this.apiUrl, { params });
  }

  createTaskList(payload: { project_id: number; name: string; position?: number }): Observable<TaskListResponse> {
    return this.http.post<TaskListResponse>(this.apiUrl, payload);
  }

  updateTaskList(id: number, payload: { name?: string; position?: number }): Observable<TaskListResponse> {
    return this.http.put<TaskListResponse>(`${this.apiUrl}/${id}`, payload);
  }

  deleteTaskList(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  reorderTaskLists(taskLists: ReorderListItem[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reorder`, { task_lists: taskLists });
  }
}
