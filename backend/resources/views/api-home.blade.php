<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ config('app.name', 'Task Management') }} - API</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            line-height: 1.6;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 40px 20px;
        }
        
        .container {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
            max-width: 1000px;
            width: 100%;
            overflow: hidden;
        }
        
        .header {
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            padding: 36px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }
        
        .header-title h1 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.02em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .header-title .version {
            font-size: 0.875rem;
            color: #64748b;
            margin-top: 4px;
            font-weight: 500;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #ecfdf5;
            color: #065f46;
            border: 1px solid #a7f3d0;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 0.8125rem;
            font-weight: 600;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
        
        .content {
            padding: 40px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 16px;
            margin-bottom: 36px;
        }
        
        .info-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 18px 20px;
            border-radius: 12px;
        }
        
        .info-card h3 {
            color: #64748b;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
            margin-bottom: 6px;
        }
        
        .info-card p {
            font-size: 1.05rem;
            font-weight: 600;
            color: #0f172a;
            font-family: 'JetBrains Mono', monospace;
            word-break: break-all;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
            flex-wrap: wrap;
            gap: 12px;
        }
        
        .section-header h2 {
            color: #0f172a;
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.01em;
        }

        .search-box {
            position: relative;
            max-width: 280px;
            width: 100%;
        }

        .search-input {
            width: 100%;
            padding: 8px 14px 8px 34px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            font-size: 0.875rem;
            color: #0f172a;
            outline: none;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .search-input:focus {
            border-color: #0f172a;
            box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
        }

        .search-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
            font-size: 0.875rem;
            pointer-events: none;
        }
        
        .endpoints {
            display: grid;
            gap: 16px;
        }
        
        .endpoint-group {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            padding: 20px 24px;
            border-radius: 12px;
        }
        
        .endpoint-group h3 {
            color: #0f172a;
            margin-bottom: 14px;
            font-size: 0.9375rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .endpoint {
            display: flex;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;
            transition: background-color 0.1s ease;
        }
        
        .endpoint:last-child {
            border-bottom: none;
        }
        
        .method {
            padding: 3px 10px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 0.75rem;
            font-family: 'JetBrains Mono', monospace;
            margin-right: 14px;
            min-width: 62px;
            text-align: center;
            letter-spacing: 0.02em;
        }
        
        .method.get {
            background: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
        }
        
        .method.post {
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
        }
        
        .method.put {
            background: #fffbeb;
            color: #b45309;
            border: 1px solid #fde68a;
        }
        
        .method.delete {
            background: #fef2f2;
            color: #b91c1c;
            border: 1px solid #fecaca;
        }
        
        .path {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.875rem;
            color: #1e293b;
            font-weight: 500;
            flex: 1;
        }
        
        .description {
            color: #64748b;
            font-size: 0.875rem;
            margin-left: auto;
            padding-left: 20px;
        }
        
        .links {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 20px;
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 18px;
            background: #0f172a;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 0.875rem;
            border: 1px solid #0f172a;
            transition: all 0.15s ease;
        }
        
        .btn:hover {
            background: #1e293b;
            border-color: #1e293b;
            transform: translateY(-1px);
        }
        
        .btn.secondary {
            background: #ffffff;
            color: #334155;
            border: 1px solid #cbd5e1;
        }
        
        .btn.secondary:hover {
            background: #f8fafc;
            border-color: #94a3b8;
            color: #0f172a;
        }

        .auth-snippet {
            background: #f8fafc;
            color: #0f172a;
            border: 1px solid #e2e8f0;
            padding: 14px 18px;
            border-radius: 8px;
            margin-top: 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .auth-snippet code {
            font-family: inherit;
        }
        
        .footer {
            text-align: center;
            padding: 24px;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 0.8125rem;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 16px 12px;
            }

            .content {
                padding: 24px 20px;
            }

            .header {
                padding: 24px 20px;
            }

            .header-title h1 {
                font-size: 1.4rem;
            }
            
            .endpoint {
                flex-direction: column;
                align-items: flex-start;
                gap: 6px;
            }
            
            .description {
                margin-left: 0;
                padding-left: 0;
            }

            .search-box {
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="header-title">
                <h1>{{ config('app.name', 'Task Management') }}</h1>
                <p class="version">REST API v1.0.0</p>
            </div>
            <div>
                <span class="status-badge">
                    <span class="status-dot"></span>
                    API Active
                </span>
            </div>
        </header>
        
        <main class="content">
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
                    <p>v{{ app()->version() }}</p>
                </div>
                <div class="info-card">
                    <h3>PHP</h3>
                    <p>v{{ PHP_VERSION }}</p>
                </div>
            </div>
            
            <section class="section">
                <div class="section-header">
                    <h2>Available Endpoints</h2>
                    <div class="search-box">
                        <span class="search-icon">🔍</span>
                        <input type="text" id="endpointSearch" class="search-input" placeholder="Filter endpoints (e.g. auth, tasks)..." autocomplete="off">
                    </div>
                </div>
                
                <div class="endpoints" id="endpointsList">
                    <div class="endpoint-group">
                        <h3>Authentication</h3>
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
                            <span class="path">/api/auth/forgot-password</span>
                            <span class="description">Request password reset token</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/reset-password</span>
                            <span class="description">Reset password</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/logout</span>
                            <span class="description">User logout</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/auth/me</span>
                            <span class="description">Get current user</span>
                        </div>
                        <div class="endpoint">
                            <span class="method put">PUT</span>
                            <span class="path">/api/auth/profile</span>
                            <span class="description">Update profile</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/change-password</span>
                            <span class="description">Change password</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/avatar</span>
                            <span class="description">Upload avatar</span>
                        </div>
                    </div>
                    
                    <div class="endpoint-group">
                        <h3>Projects</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/projects</span>
                            <span class="description">List all accessible projects</span>
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
                        <h3>Task Lists</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/task-lists</span>
                            <span class="description">List task lists</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/task-lists</span>
                            <span class="description">Create task list</span>
                        </div>
                        <div class="endpoint">
                            <span class="method put">PUT</span>
                            <span class="path">/api/task-lists/{id}</span>
                            <span class="description">Update task list</span>
                        </div>
                        <div class="endpoint">
                            <span class="method delete">DELETE</span>
                            <span class="path">/api/task-lists/{id}</span>
                            <span class="description">Delete task list</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/task-lists/reorder</span>
                            <span class="description">Reorder task lists</span>
                        </div>
                    </div>

                    <div class="endpoint-group">
                        <h3>Tasks</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/tasks</span>
                            <span class="description">List tasks</span>
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
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/tasks/reorder</span>
                            <span class="description">Reorder tasks</span>
                        </div>
                    </div>
                    
                    <div class="endpoint-group">
                        <h3>Comments</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/tasks/{task}/comments</span>
                            <span class="description">Get comments for a task</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/comments</span>
                            <span class="description">Create comment</span>
                        </div>
                        <div class="endpoint">
                            <span class="method put">PUT</span>
                            <span class="path">/api/comments/{id}</span>
                            <span class="description">Update comment</span>
                        </div>
                        <div class="endpoint">
                            <span class="method delete">DELETE</span>
                            <span class="path">/api/comments/{id}</span>
                            <span class="description">Delete comment</span>
                        </div>
                    </div>

                    <div class="endpoint-group">
                        <h3>Dashboard</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/dashboard</span>
                            <span class="description">Get user dashboard summary metrics</span>
                        </div>
                    </div>
                    
                    <div class="endpoint-group">
                        <h3>Admin (Requires Admin Role)</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/admin/dashboard</span>
                            <span class="description">Admin dashboard metrics & stats</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/admin/reports</span>
                            <span class="description">Generate system reports</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/admin/users</span>
                            <span class="description">List all registered users</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/admin/users</span>
                            <span class="description">Create new user account</span>
                        </div>
                        <div class="endpoint">
                            <span class="method put">PUT</span>
                            <span class="path">/api/admin/users/{user}/role</span>
                            <span class="description">Update user role (admin/user)</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/admin/users/{user}/reset-password</span>
                            <span class="description">Force reset user password</span>
                        </div>
                    </div>
                </div>
            </section>
            
            <section class="section">
                <div class="section-header">
                    <h2>Quick Links</h2>
                </div>
                <div class="links">
                    <a href="{{ url('/api') }}" class="btn">API Root</a>
                    @if(file_exists(public_path('docs/index.html')))
                    <a href="{{ url('/docs') }}" class="btn secondary">API Documentation</a>
                    @endif
                    <a href="http://localhost:4200" class="btn secondary" target="_blank" rel="noopener">User App (:4200)</a>
                    <a href="http://localhost:4201" class="btn secondary" target="_blank" rel="noopener">Admin Panel (:4201)</a>
                </div>
            </section>
            
            <section class="section" style="margin-bottom: 0;">
                <div class="section-header">
                    <h2>Authentication Header</h2>
                </div>
                <p style="color: #64748b; font-size: 0.875rem;">Protected endpoints require a Bearer token in the Authorization request header:</p>
                <div class="auth-snippet">
                    <code>Authorization: Bearer &lt;your_token_here&gt;</code>
                </div>
            </section>
        </main>
        
        <footer class="footer">
            <p>Built with Laravel {{ app()->version() }} • PHP {{ PHP_VERSION }} • Port 8001</p>
            <p style="margin-top: 4px; color: #94a3b8;">&copy; {{ date('Y') }} {{ config('app.name', 'Task Management System') }}</p>
        </footer>
    </div>

    <script>
        const searchInput = document.getElementById('endpointSearch');
        const groups = document.querySelectorAll('.endpoint-group');

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            groups.forEach(group => {
                const endpoints = group.querySelectorAll('.endpoint');
                let visibleCount = 0;

                endpoints.forEach(ep => {
                    const text = ep.textContent.toLowerCase();
                    if (!query || text.includes(query)) {
                        ep.style.display = 'flex';
                        visibleCount++;
                    } else {
                        ep.style.display = 'none';
                    }
                });

                group.style.display = (visibleCount > 0) ? 'block' : 'none';
            });
        });
    </script>
</body>
</html>
