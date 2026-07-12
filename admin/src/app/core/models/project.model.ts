export interface Project {
  id: number;
  workspace_id?: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  start_date?: string;
  due_date?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  task_lists?: TaskList[];
  tasks?: Task[];
}

export interface TaskList {
  id: number;
  project_id: number;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
  tasks?: Task[];
}

export interface Task {
  id: number;
  project_id: number;
  task_list_id?: number;
  created_by: number;
  assigned_to?: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  position: number;
  estimated_hours?: number;
  created_at: string;
  updated_at: string;
  creator?: User;
  assignee?: User;
  comments?: Comment[];
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

import { User } from './user.model';