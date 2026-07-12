# Task Management System

A full-stack task management application built with Laravel (Backend) and Angular (Frontend).

## Project Structure

```
task-management/
├── backend/   # Laravel 11 REST API
├── admin/     # Angular 18 Admin Panel
└── user/      # Angular 18 User Application
```

## Features

### User Features
- User registration and authentication
- Create, edit, and delete projects
- Create and manage task lists within projects
- Create, assign, and track tasks
- Add comments to tasks
- Update task status (todo, in_progress, review, completed)
- Set task priorities (low, medium, high, critical)
- Filter and search tasks

### Admin Features
- Dashboard with system statistics
- User management
- View reports and analytics
- Monitor project progress
- Track user productivity

## Technology Stack

### Backend (Laravel)
- **Framework**: Laravel 11
- **Database**: MySQL
- **Authentication**: Laravel Sanctum
- **API**: RESTful JSON API

### Frontend (Angular)
- **Framework**: Angular 18
- **Admin Panel**: Separate Angular app for administrators
- **User App**: Dedicated Angular app for regular users
- **UI Library**: Angular Material
- **HTTP Client**: Angular HttpClient
- **CSS Framework**: SCSS
- **Theming**: Light/dark mode with a persisted toggle

## Installation

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- npm
- MySQL

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
composer install
```

3. Configure environment:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=task_manager
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

5. Generate application key:
```bash
php artisan key:generate
```

6. Run migrations:
```bash
php artisan migrate
```

7. Start the server:
```bash
php artisan serve --port=8000
```

### Frontend Setup

#### User Application

1. Navigate to user frontend directory:
```bash
cd user
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
ng serve --port=4200
```

4. Access the user application at `http://localhost:4200`

#### Admin Panel

1. Navigate to admin frontend directory:
```bash
cd admin
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
ng serve --port=4201
```

4. Access the admin panel at `http://localhost:4201`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get authenticated user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/{id}` - Get task details
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `POST /api/tasks/reorder` - Reorder tasks

### Task Lists
- `GET /api/task-lists` - List all task lists
- `POST /api/task-lists` - Create task list
- `PUT /api/task-lists/{id}` - Update task list
- `DELETE /api/task-lists/{id}` - Delete task list
- `POST /api/task-lists/reorder` - Reorder task lists

### Comments
- `GET /api/tasks/{taskId}/comments` - List task comments
- `POST /api/comments` - Add comment
- `PUT /api/comments/{id}` - Update comment
- `DELETE /api/comments/{id}` - Delete comment

### Admin Endpoints
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/reports` - Generate reports
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/{id}/role` - Update user role

## User Roles

### User
- Can create and manage their own projects
- Can create and complete tasks
- Can add comments

### Admin
- All user permissions
- Access to admin dashboard
- Can manage all users
- Can view system-wide statistics
- Can generate reports

## Database Schema

The database consists of the following main tables:
- users (with role field for admin/user)
- projects
- task_lists
- tasks
- comments

For detailed schema information, see `backend/DATABASE_SCHEMA.md`

## Development Status

✅ Backend API (Laravel)
- Database migrations
- Models and relationships
- Authentication with Sanctum
- API controllers (projects, task lists, tasks, comments, admin)
- Admin middleware
- CORS configuration

✅ Admin Panel (Angular)
- Login, dashboard (with charts), users, projects, tasks, reports, profile, settings
- CRUD with search/filter/pagination and API integration
- Light/dark mode

✅ User App (Angular)
- Login/register, dashboard, projects (list + detail), tasks, profile, settings
- Refresh-safe authentication and API integration
- Light/dark mode

## License

This project is open-source software.