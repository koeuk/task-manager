import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment } from '../models/project.model';

interface CommentResponse {
  message: string;
  comment: Comment;
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getByTask(taskId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/tasks/${taskId}/comments`);
  }

  createComment(taskId: number, comment: string): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(`${this.apiUrl}/comments`, { task_id: taskId, comment });
  }

  updateComment(id: number, comment: string): Observable<CommentResponse> {
    return this.http.put<CommentResponse>(`${this.apiUrl}/comments/${id}`, { comment });
  }

  deleteComment(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/comments/${id}`);
  }
}
