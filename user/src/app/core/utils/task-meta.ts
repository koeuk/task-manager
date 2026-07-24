import { TaskStatus, TaskPriority, ProjectStatus } from '../models/project.model';

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' }
];

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
];

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  [...STATUS_OPTIONS, ...PROJECT_STATUS_OPTIONS].map(o => [o.value, o.label])
);
const PRIORITY_LABELS: Record<string, string> = Object.fromEntries(
  PRIORITY_OPTIONS.map(o => [o.value, o.label])
);

export const STATUS_COLORS: Record<string, string> = {
  todo: '#9e9e9e',
  in_progress: '#2196f3',
  review: '#ff9800',
  completed: '#4caf50'
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: '#4caf50',
  medium: '#ffc107',
  high: '#ff9800',
  critical: '#f44336'
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: '#9e9e9e',
  active: '#2196f3',
  on_hold: '#ff9800',
  completed: '#4caf50',
  archived: '#757575'
};

export function statusLabel(value: string): string {
  return STATUS_LABELS[value] ?? value;
}

export function priorityLabel(value: string): string {
  return PRIORITY_LABELS[value] ?? value;
}

export function statusColor(value: string): string {
  return STATUS_COLORS[value] ?? '#9e9e9e';
}

export function priorityColor(value: string): string {
  return PRIORITY_COLORS[value] ?? '#9e9e9e';
}

export function projectStatusColor(value: string): string {
  return PROJECT_STATUS_COLORS[value] ?? '#9e9e9e';
}
