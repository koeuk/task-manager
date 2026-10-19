export interface FieldChange {
  field: string;
  label: string;
  from?: string | null;
  to?: string | null;
  value?: string | null;
}

export function formatFieldLabel(field: string): string {
  const map: Record<string, string> = {
    status: 'Status',
    priority: 'Priority',
    title: 'Title',
    name: 'Name',
    description: 'Description',
    due_date: 'Due Date',
    start_date: 'Start Date',
    completed_at: 'Completed At',
    estimated_hours: 'Estimate',
    assigned_to: 'Assignee',
    created_by: 'Creator',
    owner_id: 'Owner',
    task_list_id: 'Task List',
    workspace_id: 'Workspace',
    color: 'Color',
    icon: 'Icon',
    task_title: 'Task'
  };

  if (map[field]) return map[field];
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

export function formatFieldValue(val: any, field?: string): string {
  if (val === null || val === undefined || val === '') return 'None';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') return JSON.stringify(val);
  const s = String(val);
  // Truncate ISO timestamp to date if it's an ISO timestamp
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    return s.split('T')[0];
  }
  // Format hours
  if (field === 'estimated_hours' && !isNaN(Number(val))) {
    return `${val}h`;
  }
  // Humanize common enum values like in_progress
  if (['todo', 'in_progress', 'review', 'completed', 'planning', 'active', 'on_hold', 'archived', 'low', 'medium', 'high', 'critical'].includes(s)) {
    return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  // Truncate very long text (e.g. descriptions) to keep chips compact
  if (s.length > 60) {
    return s.substring(0, 57) + '...';
  }
  return s;
}

export function getActivityChanges(properties?: Record<string, any> | null): FieldChange[] {
  if (!properties || typeof properties !== 'object') return [];

  const changes: FieldChange[] = [];
  const processedKeys = new Set<string>();

  // 1. Detailed diff { [field]: { from, to, from_name?, to_name? } }
  if (properties['diff'] && typeof properties['diff'] === 'object') {
    for (const [key, diffObj] of Object.entries(properties['diff'])) {
      if (key === 'updated_at') continue;
      const d = diffObj as any;
      const fromVal = d?.from_name !== undefined ? d?.from_name : d?.from;
      const toVal = d?.to_name !== undefined ? d?.to_name : d?.to;
      changes.push({
        field: key,
        label: formatFieldLabel(key),
        from: formatFieldValue(fromVal, key),
        to: formatFieldValue(toVal, key)
      });
      processedKeys.add(key);
    }
  }

  // 2. from_status & to_status
  if (!processedKeys.has('status') && properties['from_status'] && properties['to_status']) {
    changes.push({
      field: 'status',
      label: 'Status',
      from: formatFieldValue(properties['from_status']),
      to: formatFieldValue(properties['to_status'])
    });
    processedKeys.add('status');
  }

  // 3. from_priority & to_priority
  if (!processedKeys.has('priority') && properties['from_priority'] && properties['to_priority']) {
    changes.push({
      field: 'priority',
      label: 'Priority',
      from: formatFieldValue(properties['from_priority']),
      to: formatFieldValue(properties['to_priority'])
    });
    processedKeys.add('priority');
  }

  // 4. changes { [field]: newValue }
  if (properties['changes'] && typeof properties['changes'] === 'object') {
    for (const [key, val] of Object.entries(properties['changes'])) {
      if (key === 'updated_at' || processedKeys.has(key)) continue;
      changes.push({
        field: key,
        label: formatFieldLabel(key),
        to: formatFieldValue(val)
      });
      processedKeys.add(key);
    }
  }

  // 5. Any other scalar properties (e.g. status, priority, color, due_date from creation/deletion logs)
  const skipTopKeys = new Set(['diff', 'changes', 'from_status', 'to_status', 'from_priority', 'to_priority', 'updated_at', 'task_title']);
  for (const [key, val] of Object.entries(properties)) {
    if (skipTopKeys.has(key) || processedKeys.has(key)) continue;
    if (val !== null && val !== undefined && typeof val !== 'object') {
      changes.push({
        field: key,
        label: formatFieldLabel(key),
        value: formatFieldValue(val)
      });
      processedKeys.add(key);
    }
  }

  return changes;
}
