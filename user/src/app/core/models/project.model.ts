import { User } from './user.model';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: number;
  workspace_id?: number;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  status: ProjectStatus;
  start_date?: string | null;
  due_date?: string | null;
  task_lists?: TaskList[];
  tasks?: Task[];
  created_at?: string;
  updated_at?: string;
}

export interface TaskList {
  id: number;
  project_id: number;
  name: string;
  position: number;
  tasks?: Task[];
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: number;
  project_id: number;
  task_list_id?: number | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  start_date?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  /** Laravel's `decimal:2` cast serialises this as a string (e.g. "4.50"). */
  estimated_hours?: number | string | null;
  created_by: number;
  assigned_to?: number | null;
  // Eager-loaded relations (snake_case JSON keys from Laravel)
  project?: Project;
  task_list?: TaskList;
  creator?: User;
  assignee?: User;
  comments?: Comment[];
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  user?: User;
  created_at?: string;
  updated_at?: string;
}

/** Laravel length-aware paginator envelope. */
export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}
