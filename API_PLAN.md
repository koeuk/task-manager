# API Documentation & Plan

## Base URL
```
http://localhost:8000/api
```

## Authentication
All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer {token}
```

## API Endpoints

### 1. Authentication Endpoints

#### Register
- **Method**: POST
- **URL**: `/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "password_confirmation": "string",
  "phone": "string (optional)"
}
```
- **Response**:
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00"
  },
  "token": "jwt_token_here",
  "token_type": "Bearer"
}
```

#### Login
- **Method**: POST
- **URL**: `/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
- **Response**: Same as Register

#### Logout
- **Method**: POST
- **URL**: `/auth/logout`
- **Access**: Protected
- **Response**:
```json
{
  "message": "Successfully logged out"
}
```

#### Get Current User
- **Method**: GET
- **URL**: `/auth/me`
- **Access**: Protected
- **Response**: User object

#### Update Profile
- **Method**: PUT
- **URL**: `/auth/profile`
- **Access**: Protected
- **Request Body**:
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "avatar": "string (optional)"
}
```

#### Change Password
- **Method**: POST
- **URL**: `/auth/change-password`
- **Access**: Protected
- **Request Body**:
```json
{
  "current_password": "string",
  "password": "string",
  "password_confirmation": "string"
}
```

### 2. Project Endpoints

#### List Projects
- **Method**: GET
- **URL**: `/projects`
- **Access**: Protected
- **Query Parameters**:
  - `status`: Filter by status (planning, active, on_hold, completed, archived)
  - `search`: Search by name
  - `page`: Page number
  - `per_page`: Items per page (default: 15)
- **Response**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Project Name",
      "description": "Description",
      "color": "#3B82F6",
      "icon": "icon-name",
      "start_date": "2024-01-01",
      "due_date": "2024-12-31",
      "status": "active",
      "task_lists": [],
      "tasks": []
    }
  ],
  "links": {},
  "meta": {}
}
```

#### Get Project
- **Method**: GET
- **URL**: `/projects/{id}`
- **Access**: Protected
- **Response**: Single project with all relationships

#### Create Project
- **Method**: POST
- **URL**: `/projects`
- **Access**: Protected
- **Request Body**:
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "color": "string (optional)",
  "icon": "string (optional)",
  "start_date": "date (optional)",
  "due_date": "date (optional)",
  "status": "string (optional)"
}
```

#### Update Project
- **Method**: PUT
- **URL**: `/projects/{id}`
- **Access**: Protected
- **Request Body**: Same as Create (all fields optional)

#### Delete Project
- **Method**: DELETE
- **URL**: `/projects/{id}`
- **Access**: Protected

### 3. Task List Endpoints

#### List Task Lists
- **Method**: GET
- **URL**: `/task-lists`
- **Access**: Protected

#### Create Task List
- **Method**: POST
- **URL**: `/task-lists`
- **Access**: Protected
- **Request Body**:
```json
{
  "project_id": "integer (required)",
  "name": "string (required)",
  "position": "integer (optional)"
}
```

#### Update Task List
- **Method**: PUT
- **URL**: `/task-lists/{id}`
- **Access**: Protected

#### Delete Task List
- **Method**: DELETE
- **URL**: `/task-lists/{id}`
- **Access**: Protected

#### Reorder Task Lists
- **Method**: POST
- **URL**: `/task-lists/reorder`
- **Access**: Protected
- **Request Body**:
```json
{
  "task_lists": [
    {"id": 1, "position": 0},
    {"id": 2, "position": 1}
  ]
}
```

### 4. Task Endpoints

#### List Tasks
- **Method**: GET
- **URL**: `/tasks`
- **Access**: Protected
- **Query Parameters**:
  - `project_id`: Filter by project
  - `task_list_id`: Filter by task list
  - `status`: Filter by status (todo, in_progress, review, completed)
  - `priority`: Filter by priority (low, medium, high, critical)
  - `assigned_to`: Filter by assigned user
  - `search`: Search in title and description

#### Get Task
- **Method**: GET
- **URL**: `/tasks/{id}`
- **Access**: Protected

#### Create Task
- **Method**: POST
- **URL**: `/tasks`
- **Access**: Protected
- **Request Body**:
```json
{
  "project_id": "integer (required)",
  "task_list_id": "integer (optional)",
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "string (optional)",
  "status": "string (optional)",
  "assigned_to": "integer (optional)",
  "start_date": "datetime (optional)",
  "due_date": "datetime (optional)",
  "estimated_hours": "decimal (optional)",
  "position": "integer (optional)"
}
```

#### Update Task
- **Method**: PUT
- **URL**: `/tasks/{id}`
- **Access**: Protected
- **Request Body**: Same as Create (all fields optional except project_id)

#### Delete Task
- **Method**: DELETE
- **URL**: `/tasks/{id}`
- **Access**: Protected

#### Reorder Tasks
- **Method**: POST
- **URL**: `/tasks/reorder`
- **Access**: Protected
- **Request Body**:
```json
{
  "tasks": [
    {
      "id": 1, 
      "position": 0,
      "task_list_id": 1
    }
  ]
}
```

### 5. Comment Endpoints

#### List Comments for Task
- **Method**: GET
- **URL**: `/tasks/{taskId}/comments`
- **Access**: Protected

#### Create Comment
- **Method**: POST
- **URL**: `/comments`
- **Access**: Protected
- **Request Body**:
```json
{
  "task_id": "integer (required)",
  "comment": "string (required)"
}
```

#### Update Comment
- **Method**: PUT
- **URL**: `/comments/{id}`
- **Access**: Protected
- **Request Body**:
```json
{
  "comment": "string (required)"
}
```

#### Delete Comment
- **Method**: DELETE
- **URL**: `/comments/{id}`
- **Access**: Protected

### 6. Admin Endpoints (Requires Admin Role)

#### Admin Dashboard
- **Method**: GET
- **URL**: `/admin/dashboard`
- **Access**: Admin only
- **Response**:
```json
{
  "total_users": 100,
  "total_projects": 50,
  "total_tasks": 500,
  "completed_tasks": 200,
  "active_projects": 30,
  "tasks_by_status": [],
  "tasks_by_priority": [],
  "recent_projects": [],
  "recent_tasks": [],
  "user_stats": []
}
```

#### Admin Reports
- **Method**: GET
- **URL**: `/admin/reports`
- **Access**: Admin only
- **Query Parameters**:
  - `start_date`: Start date for report
  - `end_date`: End date for report
- **Response**:
```json
{
  "tasks_created": 100,
  "tasks_completed": 80,
  "projects_created": 10,
  "new_users": 5,
  "productivity_by_user": [],
  "project_progress": []
}
```

#### List All Users
- **Method**: GET
- **URL**: `/admin/users`
- **Access**: Admin only

#### Get User
- **Method**: GET
- **URL**: `/admin/users/{id}`
- **Access**: Admin only

#### Create User
- **Method**: POST
- **URL**: `/admin/users`
- **Access**: Admin only
- **Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "user|admin"
}
```

#### Update User
- **Method**: PUT
- **URL**: `/admin/users/{id}`
- **Access**: Admin only

#### Delete User
- **Method**: DELETE
- **URL**: `/admin/users/{id}`
- **Access**: Admin only

#### Update User Role
- **Method**: PUT
- **URL**: `/admin/users/{id}/role`
- **Access**: Admin only
- **Request Body**:
```json
{
  "role": "user|admin"
}
```

#### Reset User Password
- **Method**: POST
- **URL**: `/admin/users/{id}/reset-password`
- **Access**: Admin only
- **Request Body**:
```json
{
  "password": "string"
}
```

## Error Responses

### Validation Error (422)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": ["Error message"]
  }
}
```

### Unauthorized (401)
```json
{
  "message": "Unauthenticated."
}
```

### Forbidden (403)
```json
{
  "message": "Unauthorized. Admin access required."
}
```

### Not Found (404)
```json
{
  "message": "Resource not found."
}
```

### Server Error (500)
```json
{
  "message": "Server error occurred."
}
```

## Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": {}
}
```

### Pagination Response
```json
{
  "data": [],
  "links": {
    "first": "url",
    "last": "url",
    "prev": "url",
    "next": "url"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 10,
    "per_page": 15,
    "to": 15,
    "total": 150
  }
}
```

## Testing the API

### Using cURL

#### Register a new user:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","password_confirmation":"password123"}'
```

#### Login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

#### Create a project (authenticated):
```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"My Project","description":"Project description"}'
```

## Rate Limiting
- API requests are limited to 60 requests per minute per IP
- Authentication endpoints limited to 10 requests per minute

## CORS Configuration
Allowed origins:
- http://localhost:4200 (User frontend)
- http://localhost:4201 (Admin frontend)

## Security Notes
1. All passwords are hashed using bcrypt
2. Tokens expire after 24 hours
3. Admin endpoints require admin role
4. SQL injection prevention through Eloquent ORM
5. XSS protection enabled
6. CSRF protection for state-changing operations