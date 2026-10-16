<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ config('app.name') }} - API</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 1000px;
            width: 100%;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header .version {
            font-size: 1rem;
            opacity: 0.9;
        }
        
        .status {
            background: #10b981;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 15px;
            font-weight: 600;
        }
        
        .content {
            padding: 40px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .info-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        
        .info-card h3 {
            color: #667eea;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        
        .info-card p {
            font-size: 1.2rem;
            font-weight: 600;
            color: #333;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.5rem;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        
        .endpoints {
            display: grid;
            gap: 15px;
        }
        
        .endpoint-group {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
        }
        
        .endpoint-group h3 {
            color: #764ba2;
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        
        .endpoint {
            display: flex;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .endpoint:last-child {
            border-bottom: none;
        }
        
        .method {
            padding: 4px 12px;
            border-radius: 5px;
            font-weight: 700;
            font-size: 0.8rem;
            margin-right: 15px;
            min-width: 60px;
            text-align: center;
        }
        
        .method.get {
            background: #10b981;
            color: white;
        }
        
        .method.post {
            background: #3b82f6;
            color: white;
        }
        
        .method.put {
            background: #f59e0b;
            color: white;
        }
        
        .method.delete {
            background: #ef4444;
            color: white;
        }
        
        .path {
            font-family: 'Courier New', monospace;
            color: #333;
            flex: 1;
        }
        
        .description {
            color: #666;
            font-size: 0.9rem;
            margin-left: auto;
            padding-left: 20px;
        }
        
        .links {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-top: 30px;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s;
        }
        
        .btn:hover {
            background: #764ba2;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .btn.secondary {
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
        }
        
        .btn.secondary:hover {
            background: #667eea;
            color: white;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 1.8rem;
            }
            
            .endpoint {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .description {
                margin-left: 0;
                padding-left: 0;
                margin-top: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 {{ config('app.name', 'Task Management System') }}</h1>
            <p class="version">REST API v1.0.0</p>
            <span class="status">✓ API Running</span>
        </div>
        
        <div class="content">
            <div class="info-grid">
                <div class="info-card">
                    <h3>Base URL</h3>
                    <p>{{ url('/api') }}</p>
                </div>
                <div class="info-card">
                    <h3>Environment</h3>
                    <p>{{ ucfirst(config('app.env')) }}</p>
                </div>
                <div class="info-card">
                    <h3>Laravel</h3>
                    <p>{{ app()->version() }}</p>
                </div>
                <div class="info-card">
                    <h3>PHP</h3>
                    <p>{{ PHP_VERSION }}</p>
                </div>
            </div>
            
            <div class="section">
                <h2>📋 Available Endpoints</h2>
                
                <div class="endpoints">
                    <div class="endpoint-group">
                        <h3>🔐 Authentication</h3>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/register</span>
                            <span class="description">Register new user</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/login</span>
                            <span class="description">User login</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/logout</span>
                            <span class="description">User logout</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/auth/me</span>
                            <span class="description">Current user</span>
                        </div>
                    </div>
                    
                    <div class="endpoint-group">
                        <h3>📁 Projects</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/projects</span>
                            <span class="description">List all projects</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/projects</span>
                            <span class="description">Create project</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/projects/{id}</span>
                            <span class="description">Get project details</span>
                        </div>
                        <div class="endpoint">
                            <span class="method put">PUT</span>
                            <span class="path">/api/projects/{id}</span>
                            <span class="description">Update project</span>
                        </div>
                        <div class="endpoint">
                            <span class="method delete">DELETE</span>
                            <span class="path">/api/projects/{id}</span>
                            <span class="description">Delete project</span>
                        </div>
                    </div>
                    
                    <div class="endpoint-group">
                        <h3>✅ Tasks</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/tasks</span>
                            <span class="description">List all tasks</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/tasks</span>
                            <span class="description">Create task</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/tasks/{id}</span>
                            <span class="description">Get task details</span>
                        </div>
                        <div class="endpoint">
                            <span class="method put">PUT</span>
                            <span class="path">/api/tasks/{id}</span>
                            <span class="description">Update task</span>
                        </div>
                        <div class="endpoint">
                            <span class="method delete">DELETE</span>
                            <span class="path">/api/tasks/{id}</span>
                            <span class="description">Delete task</span>
                        </div>
                    </div>
                    
                    <div class="endpoint-group">
                        <h3>📝 Task Lists</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/task-lists</span>
                            <span class="description">List all task lists</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/task-lists</span>
                            <span class="description">Create task list</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/task-lists/reorder</span>
                            <span class="description">Reorder task lists</span>
                        </div>
                    </div>
                    
                    <div class="endpoint-group">
                        <h3>💬 Comments</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/tasks/{taskId}/comments</span>
                            <span class="description">Get task comments</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/comments</span>
                            <span class="description">Create comment</span>
                        </div>
                    </div>
                    
                    <div class="endpoint-group">
                        <h3>👑 Admin (Requires Admin Role)</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/admin/dashboard</span>
                            <span class="description">Admin dashboard stats</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/admin/users</span>
                            <span class="description">List all users</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/admin/reports</span>
                            <span class="description">Generate reports</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🔗 Quick Links</h2>
                <div class="links">
                    <a href="{{ url('/api') }}" class="btn">API Root</a>
                    @if(file_exists(public_path('docs/index.html')))
                    <a href="{{ url('/docs') }}" class="btn secondary">API Documentation</a>
                    @endif
                    <a href="http://localhost:4200" class="btn secondary">User App</a>
                    <a href="http://localhost:4201" class="btn secondary">Admin Panel</a>
                </div>
            </div>
            
            <div class="section">
                <h2>ℹ️ Authentication</h2>
                <p>Protected endpoints require Bearer token in Authorization header:</p>
                <div style="background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 8px; margin-top: 15px; font-family: 'Courier New', monospace; font-size: 0.9rem;">
                    Authorization: Bearer {your_token_here}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Built with Laravel {{ app()->version() }} • Running on PHP {{ PHP_VERSION }}</p>
            <p style="margin-top: 5px;">© {{ date('Y') }} Task Management System</p>
        </div>
    </div>
</body>
</html>
