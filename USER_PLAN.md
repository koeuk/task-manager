# User Application Plan

## Overview
Angular-based task management application for regular users to manage their projects and tasks efficiently.

## Technology Stack
- Angular 18
- Angular Material UI
- RxJS for state management
- Angular Router for navigation
- Angular Forms (Reactive Forms)
- Drag & Drop CDK for task management

## Application Structure

```
user/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── project.service.ts
│   │   │   │   ├── task.service.ts
│   │   │   │   ├── comment.service.ts
│   │   │   │   └── notification.service.ts
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   └── models/
│   │   │       ├── user.model.ts
│   │   │       ├── project.model.ts
│   │   │       ├── task.model.ts
│   │   │       ├── task-list.model.ts
│   │   │       └── comment.model.ts
│   │   │
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── forgot-password/
│   │   │   ├── dashboard/
│   │   │   │   ├── overview/
│   │   │   │   ├── recent-tasks/
│   │   │   │   └── project-cards/
│   │   │   ├── projects/
│   │   │   │   ├── project-list/
│   │   │   │   ├── project-detail/
│   │   │   │   ├── project-create/
│   │   │   │   ├── project-edit/
│   │   │   │   └── project-board/
│   │   │   ├── tasks/
│   │   │   │   ├── task-list/
│   │   │   │   ├── task-detail/
│   │   │   │   ├── task-create/
│   │   │   │   ├── task-edit/
│   │   │   │   └── task-board/
│   │   │   ├── calendar/
│   │   │   │   └── task-calendar/
│   │   │   └── profile/
│   │   │       ├── profile-view/
│   │   │       ├── profile-edit/
│   │   │       └── change-password/
│   │   │
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   ├── sidebar/
│   │   │   │   ├── task-card/
│   │   │   │   ├── project-card/
│   │   │   │   ├── comment-list/
│   │   │   │   ├── priority-badge/
│   │   │   │   ├── status-badge/
│   │   │   │   ├── user-avatar/
│   │   │   │   └── confirm-dialog/
│   │   │   ├── pipes/
│   │   │   │   ├── time-ago.pipe.ts
│   │   │   │   └── truncate.pipe.ts
│   │   │   └── directives/
│   │   │       └── drag-drop.directive.ts
│   │   │
│   │   └── layouts/
│   │       ├── main-layout/
│   │       └── auth-layout/
```

## Pages and Features

### 1. Authentication

#### Login Page
- **Route**: `/login`
- **Features**:
  - Email/password login
  - Remember me option
  - Social login options (future)
  - Link to register
  - Link to forgot password

#### Register Page
- **Route**: `/register`
- **Features**:
  - Registration form:
    - Name
    - Email
    - Password
    - Confirm password
    - Phone (optional)
  - Terms acceptance
  - Auto-login after registration

#### Forgot Password
- **Route**: `/forgot-password`
- **Features**:
  - Email input for reset link
  - Success message
  - Back to login link

### 2. Dashboard

#### Main Dashboard
- **Route**: `/dashboard`
- **Features**:
  - Welcome message with user name
  - Statistics cards:
    - Active projects
    - Pending tasks
    - Completed this week
    - Overdue tasks
  - Recent projects (grid view)
  - Upcoming tasks (list)
  - Quick add task button
  - Activity timeline

### 3. Projects

#### Project List
- **Route**: `/projects`
- **Features**:
  - Grid/list view toggle
  - Project cards showing:
    - Name and description
    - Progress percentage
    - Task count (completed/total)
    - Due date
    - Status badge
    - Team members
  - Filters:
    - By status
    - By date
    - My projects/All projects
  - Search functionality
  - Create new project button
  - Sorting options

#### Project Detail
- **Route**: `/projects/:id`
- **Features**:
  - Project header:
    - Name and description
    - Edit button
    - Delete button
    - Status dropdown
  - Tabs:
    - Board view
    - List view
    - Calendar view
    - Team members
    - Settings
  - Task lists management
  - Progress tracking
  - Due date display
  - Activity feed

#### Project Board (Kanban)
- **Route**: `/projects/:id/board`
- **Features**:
  - Drag & drop task lists
  - Drag & drop tasks between lists
  - Add new list
  - Rename/delete lists
  - Task quick view
  - Filter tasks
  - Search tasks

#### Create/Edit Project
- **Route**: `/projects/new` or `/projects/:id/edit`
- **Features**:
  - Form fields:
    - Project name
    - Description
    - Start date
    - Due date
    - Color picker
    - Icon selector
    - Status
  - Validation
  - Save as draft
  - Cancel with confirmation

### 4. Tasks

#### Task List View
- **Route**: `/tasks`
- **Features**:
  - All tasks across projects
  - Table view with columns:
    - Title
    - Project
    - Priority
    - Status
    - Assignee
    - Due date
  - Inline status update
  - Inline priority change
  - Bulk selection
  - Bulk actions
  - Advanced filters

#### Task Detail
- **Route**: `/tasks/:id`
- **Features**:
  - Task information:
    - Title and description
    - Project and list
    - Priority and status
    - Dates (created, due, completed)
    - Assignee
    - Creator
    - Estimated hours
  - Comments section:
    - Add comment
    - Edit own comments
    - Delete own comments
    - Real-time updates
  - Activity history
  - File attachments (future)
  - Subtasks (future)

#### Create/Edit Task
- **Route**: `/tasks/new` or `/tasks/:id/edit`
- **Features**:
  - Form fields:
    - Title
    - Description (rich text editor)
    - Project selection
    - Task list selection
    - Priority selection
    - Status selection
    - Assignee selection
    - Start date
    - Due date
    - Estimated hours
  - Quick create mode
  - Save and create another

### 5. Calendar View

#### Task Calendar
- **Route**: `/calendar`
- **Features**:
  - Month/week/day views
  - Tasks displayed by due date
  - Drag to reschedule
  - Click to view task
  - Color coding by:
    - Project
    - Priority
    - Status
  - Filter by project
  - Quick add task

### 6. Profile

#### Profile View
- **Route**: `/profile`
- **Features**:
  - User information display
  - Avatar
  - Statistics:
    - Tasks completed
    - Projects involved
    - Member since
  - Recent activity

#### Edit Profile
- **Route**: `/profile/edit`
- **Features**:
  - Update:
    - Name
    - Email
    - Phone
    - Avatar upload
  - Notification preferences
  - Theme selection

#### Change Password
- **Route**: `/profile/change-password`
- **Features**:
  - Current password
  - New password
  - Confirm password
  - Password strength indicator

## Components Structure

### Core Components

#### 1. Header Component
```typescript
- Logo and app name
- Search bar
- Notifications dropdown
- User menu:
  - Profile
  - Settings
  - Logout
- Mobile menu toggle
```

#### 2. Sidebar Component
```typescript
- Navigation menu:
  - Dashboard
  - Projects
  - Tasks
  - Calendar
  - Profile
- Active route highlighting
- Collapsible on mobile
- Project shortcuts
```

#### 3. Task Card Component
```typescript
@Input() task: Task
@Input() draggable: boolean
@Output() onStatusChange: EventEmitter
@Output() onClick: EventEmitter
@Output() onEdit: EventEmitter
@Output() onDelete: EventEmitter

Features:
- Title and description preview
- Priority indicator
- Status badge
- Assignee avatar
- Due date
- Comments count
- Quick actions menu
```

#### 4. Project Card Component
```typescript
@Input() project: Project
@Input() view: 'grid' | 'list'
@Output() onClick: EventEmitter
@Output() onEdit: EventEmitter
@Output() onDelete: EventEmitter

Features:
- Name and description
- Progress bar
- Task statistics
- Status indicator
- Due date countdown
```

#### 5. Comment Component
```typescript
@Input() comment: Comment
@Input() canEdit: boolean
@Output() onEdit: EventEmitter
@Output() onDelete: EventEmitter

Features:
- User avatar
- Comment text
- Timestamp
- Edit/delete buttons
```

## Services

### 1. AuthService
```typescript
interface AuthService {
  login(credentials: LoginDto): Observable<AuthResponse>
  register(data: RegisterDto): Observable<AuthResponse>
  logout(): void
  getCurrentUser(): Observable<User>
  isAuthenticated(): Observable<boolean>
  updateProfile(data: UpdateProfileDto): Observable<User>
  changePassword(data: ChangePasswordDto): Observable<void>
}
```

### 2. ProjectService
```typescript
interface ProjectService {
  getProjects(filters?: ProjectFilters): Observable<Project[]>
  getProject(id: number): Observable<Project>
  createProject(data: CreateProjectDto): Observable<Project>
  updateProject(id: number, data: UpdateProjectDto): Observable<Project>
  deleteProject(id: number): Observable<void>
  getProjectTasks(projectId: number): Observable<Task[]>
}
```

### 3. TaskService
```typescript
interface TaskService {
  getTasks(filters?: TaskFilters): Observable<Task[]>
  getTask(id: number): Observable<Task>
  createTask(data: CreateTaskDto): Observable<Task>
  updateTask(id: number, data: UpdateTaskDto): Observable<Task>
  deleteTask(id: number): Observable<void>
  updateTaskStatus(id: number, status: string): Observable<Task>
  reorderTasks(tasks: ReorderDto[]): Observable<void>
}
```

### 4. TaskListService
```typescript
interface TaskListService {
  getTaskLists(projectId: number): Observable<TaskList[]>
  createTaskList(data: CreateTaskListDto): Observable<TaskList>
  updateTaskList(id: number, data: UpdateTaskListDto): Observable<TaskList>
  deleteTaskList(id: number): Observable<void>
  reorderTaskLists(lists: ReorderDto[]): Observable<void>
}
```

### 5. CommentService
```typescript
interface CommentService {
  getComments(taskId: number): Observable<Comment[]>
  createComment(data: CreateCommentDto): Observable<Comment>
  updateComment(id: number, text: string): Observable<Comment>
  deleteComment(id: number): Observable<void>
}
```

## State Management

### Using RxJS and Services

```typescript
// ProjectStateService
export class ProjectStateService {
  private projects$ = new BehaviorSubject<Project[]>([]);
  private selectedProject$ = new BehaviorSubject<Project | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);
  
  getProjects(): Observable<Project[]>
  getSelectedProject(): Observable<Project | null>
  selectProject(id: number): void
  loadProjects(): void
  addProject(project: Project): void
  updateProject(project: Project): void
  deleteProject(id: number): void
}
```

## UI/UX Guidelines

### Theme
- Primary Color: #2196F3 (Blue)
- Accent Color: #FFC107 (Amber)
- Success: #4CAF50
- Warning: #FF9800
- Error: #F44336
- Info: #2196F3

### Priority Colors
- Critical: #F44336 (Red)
- High: #FF9800 (Orange)
- Medium: #FFC107 (Amber)
- Low: #4CAF50 (Green)

### Status Colors
- Todo: #9E9E9E (Grey)
- In Progress: #2196F3 (Blue)
- Review: #FF9800 (Orange)
- Completed: #4CAF50 (Green)

### Layout
- Responsive design
- Mobile-first approach
- Sidebar navigation (collapsible)
- Fixed header
- Floating action button for quick actions

### Interactions
- Drag & drop for task management
- Inline editing where appropriate
- Keyboard shortcuts:
  - Ctrl+N: New task
  - Ctrl+P: New project
  - Ctrl+/: Search
  - Esc: Close dialogs
- Toast notifications
- Loading states
- Empty states
- Error states

## Features Priority

### MVP (Phase 1)
1. Authentication (login/register)
2. Project CRUD
3. Task CRUD
4. Basic task lists
5. Comments
6. Profile management

### Phase 2
1. Drag & drop functionality
2. Calendar view
3. Advanced filters
4. Search functionality
5. Notifications
6. Activity feed

### Phase 3
1. File attachments
2. Subtasks
3. Time tracking
4. Team collaboration
5. Email notifications
6. Mobile app

## Performance Optimization

### Strategies
1. Lazy loading modules
2. Virtual scrolling for long lists
3. OnPush change detection
4. Debounced search
5. Optimistic UI updates
6. Caching strategies
7. Image lazy loading
8. Service worker for offline support

## Security

### Measures
1. JWT token management
2. Auto-logout on inactivity
3. Secure password requirements
4. XSS prevention
5. Input sanitization
6. HTTPS only
7. Rate limiting awareness

## Testing Plan

### Unit Tests
- Services: 90% coverage
- Components: 80% coverage
- Guards: 100% coverage
- Pipes: 100% coverage

### Integration Tests
- API calls
- Form submissions
- Navigation flows
- State management

### E2E Tests
- User registration flow
- Login/logout
- Create project and tasks
- Drag & drop operations
- Comment functionality

## Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Considerations
- Bottom navigation
- Swipe gestures
- Touch-friendly buttons
- Simplified layouts
- Offline capability

## Accessibility

### Standards
- WCAG 2.1 Level AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus indicators
- ARIA labels

## Development Timeline

### Week 1
- Day 1: Project setup, authentication
- Day 2: Dashboard, project list
- Day 3: Project CRUD, task lists
- Day 4: Task CRUD, comments
- Day 5: Drag & drop, filters

### Week 2
- Day 1: Calendar view
- Day 2: Search and advanced filters
- Day 3: Profile management
- Day 4: UI polish, responsive design
- Day 5: Testing and bug fixes

## Deployment

### Commands
```bash
# Development
ng serve --port=4200

# Production build
ng build --configuration=production

# Testing
ng test
ng e2e

# Linting
ng lint
```

### Environment Configuration
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  appName: 'Task Manager',
  version: '1.0.0'
};
```

### Build Optimization
- Tree shaking
- Code splitting
- Minification
- Compression
- CDN for assets
- Progressive Web App features