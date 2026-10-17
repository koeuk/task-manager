import { User } from './user.model';
import { Project, Task } from './project.model';

export interface ActivityLog {
  id: number;
  user_id?: number | null;
  project_id?: number | null;
  task_id?: number | null;
  action: string;
  entity_type?: string | null;
  entity_id?: number | null;
  description: string;
  properties?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  user?: User | null;
  project?: Project | null;
  task?: Task | null;
  created_at: string;
  updated_at: string;
}
