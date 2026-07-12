# Task Management System - Database Schema

## Project Structure
```
task-management/
├── backend/      # Laravel REST API
└── frontend/     # Angular Application
```

## Project Overview
A comprehensive task management system built with Laravel (Backend API) and Angular (Frontend) with role-based access control (Admin/User).

## MVP Implementation Phase

### Phase 1: Core Tables (MVP)
These tables will be implemented first to get the basic functionality working:

#### 1. **users**
- `id` (bigint, primary key)
- `name` (string)
- `email` (string, unique)
- `password` (string, hashed)
- `avatar` (string, nullable)
- `phone` (string, nullable)
- `email_verified_at` (timestamp, nullable)
- `remember_token` (string, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 2. **projects**
- `id` (bigint, primary key)
- `workspace_id` (bigint, nullable for MVP)
- `name` (string)
- `description` (text, nullable)
- `color` (string, default: '#3B82F6')
- `icon` (string, nullable)
- `start_date` (date, nullable)
- `due_date` (date, nullable)
- `status` (enum: 'planning', 'active', 'on_hold', 'completed', 'archived')
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 3. **task_lists**
- `id` (bigint, primary key)
- `project_id` (bigint, foreign key)
- `name` (string)
- `position` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 4. **tasks**
- `id` (bigint, primary key)
- `project_id` (bigint, foreign key)
- `task_list_id` (bigint, foreign key, nullable)
- `created_by` (bigint, foreign key to users)
- `assigned_to` (bigint, foreign key to users, nullable)
- `title` (string)
- `description` (text, nullable)
- `priority` (enum: 'low', 'medium', 'high', 'critical')
- `status` (enum: 'todo', 'in_progress', 'review', 'completed')
- `start_date` (datetime, nullable)
- `due_date` (datetime, nullable)
- `completed_at` (timestamp, nullable)
- `position` (integer)
- `estimated_hours` (decimal, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 5. **comments**
- `id` (bigint, primary key)
- `task_id` (bigint, foreign key)
- `user_id` (bigint, foreign key)
- `comment` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

## Phase 2: Extended Features
These tables will be added once the core functionality is stable:

### Categories & Tags
#### 6. **categories**
- `id` (bigint, primary key)
- `workspace_id` (bigint, foreign key)
- `name` (string)
- `color` (string)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 7. **task_categories** (Pivot Table)
- `task_id` (bigint, foreign key)
- `category_id` (bigint, foreign key)

#### 8. **tags**
- `id` (bigint, primary key)
- `workspace_id` (bigint, foreign key)
- `name` (string)
- `color` (string)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 9. **task_tags** (Pivot Table)
- `task_id` (bigint, foreign key)
- `tag_id` (bigint, foreign key)

### File Management
#### 10. **attachments**
- `id` (bigint, primary key)
- `task_id` (bigint, foreign key)
- `uploaded_by` (bigint, foreign key to users)
- `file_name` (string)
- `original_name` (string)
- `file_path` (string)
- `file_size` (bigint)
- `mime_type` (string)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Task Features
#### 11. **task_checklists**
- `id` (bigint, primary key)
- `task_id` (bigint, foreign key)
- `title` (string)
- `is_completed` (boolean, default: false)
- `position` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Notifications & Reminders
#### 12. **notifications**
- `id` (bigint, primary key)
- `user_id` (bigint, foreign key)
- `title` (string)
- `message` (text)
- `type` (string)
- `is_read` (boolean, default: false)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 13. **reminders**
- `id` (bigint, primary key)
- `task_id` (bigint, foreign key)
- `remind_at` (datetime)
- `sent` (boolean, default: false)
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

## Phase 3: Workspace & Collaboration
These tables enable multi-workspace support and team collaboration:

#### 14. **workspaces**
- `id` (bigint, primary key)
- `owner_id` (bigint, foreign key to users)
- `name` (string)
- `description` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 15. **workspace_members**
- `id` (bigint, primary key)
- `workspace_id` (bigint, foreign key)
- `user_id` (bigint, foreign key)
- `role` (enum: 'owner', 'admin', 'member', 'viewer')
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Activity Tracking
#### 16. **task_activity_logs**
- `id` (bigint, primary key)
- `task_id` (bigint, foreign key)
- `user_id` (bigint, foreign key)
- `action` (string)
- `old_value` (json, nullable)
- `new_value` (json, nullable)
- `created_at` (timestamp)

### User Preferences
#### 17. **user_settings**
- `id` (bigint, primary key)
- `user_id` (bigint, foreign key)
- `theme` (enum: 'light', 'dark', 'auto')
- `language` (string, default: 'en')
- `timezone` (string, default: 'UTC')
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

## Model Relationships

### User
- HasMany: projects (created), tasks (created), tasks (assigned), comments, attachments, notifications
- BelongsToMany: workspaces (through workspace_members)

### Project
- BelongsTo: workspace (optional in MVP)
- HasMany: task_lists, tasks

### TaskList
- BelongsTo: project
- HasMany: tasks

### Task
- BelongsTo: project, task_list (optional), created_by (User), assigned_to (User)
- HasMany: comments, attachments, checklists, activity_logs, reminders
- BelongsToMany: categories, tags

### Comment
- BelongsTo: task, user

---

## API Endpoints (MVP)

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get authenticated user

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Task Lists
- `GET /api/projects/{projectId}/task-lists` - List task lists
- `POST /api/projects/{projectId}/task-lists` - Create task list
- `PUT /api/task-lists/{id}` - Update task list
- `DELETE /api/task-lists/{id}` - Delete task list
- `POST /api/task-lists/reorder` - Reorder task lists

### Tasks
- `GET /api/tasks` - List all tasks (with filters)
- `GET /api/projects/{projectId}/tasks` - List project tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/{id}` - Get task details
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `POST /api/tasks/reorder` - Reorder tasks

### Comments
- `GET /api/tasks/{taskId}/comments` - List task comments
- `POST /api/tasks/{taskId}/comments` - Add comment
- `PUT /api/comments/{id}` - Update comment
- `DELETE /api/comments/{id}` - Delete comment

---

## Development Plan

### Backend (Laravel)
1. ✅ Project setup
2. Database configuration
3. Create migrations (MVP tables)
4. Create models with relationships
5. Set up Sanctum authentication
6. Create API controllers
7. Define API routes
8. Add validation and policies
9. Write tests

### Frontend (Angular)
1. Project setup with Angular CLI
2. Install UI framework (Angular Material)
3. Create authentication module
4. Create project management module
5. Create task management module
6. Set up routing
7. Create services for API communication
8. Implement state management
9. Add responsive design
10. Write tests

---

## Technology Stack

### Backend
- **Framework**: Laravel 11
- **Database**: MySQL/PostgreSQL
- **Authentication**: Laravel Sanctum
- **API**: RESTful JSON API
- **Testing**: PHPUnit

### Frontend
- **Framework**: Angular 18
- **UI Library**: Angular Material
- **HTTP Client**: Angular HttpClient
- **State Management**: RxJS/NgRx
- **CSS Framework**: Tailwind CSS
- **Testing**: Jasmine/Karma

---

## Security Considerations
- Password hashing using bcrypt
- API authentication using Sanctum tokens
- CORS configuration for frontend-backend communication
- Input validation on both frontend and backend
- SQL injection prevention through Eloquent ORM
- XSS protection through Angular's built-in sanitization