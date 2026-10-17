<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ config('app.name', 'Task Management') }} - API & Database Schema</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
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
            max-width: 1060px;
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
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
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

        /* Top Navigation Tabs */
        .nav-tabs {
            display: flex;
            background: #f1f5f9;
            padding: 4px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            margin-bottom: 32px;
            gap: 4px;
        }

        .tab-btn {
            flex: 1;
            padding: 10px 16px;
            font-size: 0.875rem;
            font-weight: 600;
            color: #64748b;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            border: none;
            outline: none;
            background: transparent;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            text-decoration: none;
        }

        .tab-btn:hover:not(.active) {
            color: #0f172a;
        }

        .tab-btn.active {
            background: #ffffff;
            color: #0f172a;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .tab-badge {
            background: #e2e8f0;
            color: #475569;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 999px;
            font-family: 'JetBrains Mono', monospace;
        }

        .tab-btn.active .tab-badge {
            background: #0f172a;
            color: #ffffff;
        }
        
        .section {
            margin-bottom: 44px;
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
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .search-box {
            position: relative;
            max-width: 320px;
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

        /* Database Tables & Schema Styling */
        .table-pills {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 24px;
        }

        .table-pill {
            padding: 6px 14px;
            border-radius: 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #334155;
            font-size: 0.8125rem;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.15s ease;
        }

        .table-pill:hover {
            background: #0f172a;
            color: #ffffff;
            border-color: #0f172a;
            transform: translateY(-1px);
        }

        .schema-container {
            display: grid;
            gap: 24px;
        }

        .schema-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .schema-card-header {
            padding: 16px 20px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }

        .schema-table-title {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .schema-table-title h3 {
            font-size: 1rem;
            font-weight: 700;
            color: #0f172a;
            font-family: 'JetBrains Mono', monospace;
        }

        .schema-badge {
            font-size: 0.75rem;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 6px;
            background: #e2e8f0;
            color: #475569;
        }

        .schema-desc {
            font-size: 0.8125rem;
            color: #64748b;
        }

        .fields-table-wrapper {
            overflow-x: auto;
        }

        .fields-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.84rem;
        }

        .fields-table th {
            background: #ffffff;
            padding: 10px 18px;
            color: #64748b;
            font-size: 0.72rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e2e8f0;
        }

        .fields-table td {
            padding: 11px 18px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
            vertical-align: middle;
        }

        .fields-table tr:last-child td {
            border-bottom: none;
        }

        .fields-table tr:hover td {
            background: #fbfcfe;
        }

        .field-name {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 600;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .badge-key {
            font-size: 0.68rem;
            padding: 1px 5px;
            border-radius: 4px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
        }

        .badge-pk {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
        }

        .badge-fk {
            background: #eff6ff;
            color: #1e40af;
            border: 1px solid #bfdbfe;
        }

        .field-type {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.78rem;
            color: #0f172a;
            background: #f1f5f9;
            padding: 2px 7px;
            border-radius: 5px;
            display: inline-block;
            font-weight: 500;
        }

        .attr-pill {
            font-size: 0.75rem;
            padding: 2px 7px;
            border-radius: 5px;
            font-weight: 500;
            display: inline-block;
        }

        .attr-nullable {
            background: #f8fafc;
            color: #64748b;
            border: 1px solid #e2e8f0;
        }

        .attr-required {
            background: #f1f5f9;
            color: #334155;
            font-weight: 600;
        }

        .attr-unique {
            background: #ecfdf5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }

        .attr-default {
            color: #64748b;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.76rem;
            margin-left: 4px;
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

            .nav-tabs {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="header-title">
                <h1>{{ config('app.name', 'Task Management System') }}</h1>
                <p class="version">Laravel REST API & Database Schema Explorer</p>
            </div>
            <div>
                <span class="status-badge">
                    <span class="status-dot"></span>
                    API & Database Active
                </span>
            </div>
        </header>
        
        <main class="content">
            <!-- System Stats Grid -->
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
                    <h3>Database Tables</h3>
                    <p>7 Tables</p>
                </div>
                <div class="info-card">
                    <h3>Laravel / PHP</h3>
                    <p>v{{ app()->version() }} / {{ PHP_VERSION }}</p>
                </div>
            </div>

            <!-- View Switcher Tabs -->
            <div class="nav-tabs">
                <button type="button" class="tab-btn active" id="tabAll" onclick="switchView('all')">
                    <span>📑 All Overview</span>
                </button>
                <button type="button" class="tab-btn" id="tabEndpoints" onclick="switchView('endpoints')">
                    <span>⚡ API Endpoints</span>
                    <span class="tab-badge">33</span>
                </button>
                <button type="button" class="tab-btn" id="tabDatabase" onclick="switchView('database')">
                    <span>🗄️ Database Tables & Fields</span>
                    <span class="tab-badge">7</span>
                </button>
            </div>

            <!-- Unified Search Bar -->
            <div class="section-header" style="border-bottom: none; margin-bottom: 24px; padding-bottom: 0;">
                <div>
                    <h2 id="viewHeading">API Endpoints & Database Fields</h2>
                    <p style="font-size: 0.84rem; color: #64748b; margin-top: 2px;">Search across endpoints, HTTP methods, database tables, column names, and types</p>
                </div>
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="globalSearch" class="search-input" placeholder="Search routes, tables, or fields (e.g. users, status, due_date)..." autocomplete="off">
                </div>
            </div>

            <!-- ==================== SECTION: DATABASE TABLES & FIELDS ==================== -->
            <section class="section" id="databaseSection">
                <div class="section-header">
                    <h2>🗄️ Database Tables & Fields</h2>
                    <span class="schema-badge">MySQL Database Schema</span>
                </div>

                <!-- Quick jump pills -->
                <div class="table-pills">
                    <a href="#table-users" class="table-pill">users</a>
                    <a href="#table-projects" class="table-pill">projects</a>
                    <a href="#table-project_user" class="table-pill">project_user</a>
                    <a href="#table-task_lists" class="table-pill">task_lists</a>
                    <a href="#table-tasks" class="table-pill">tasks</a>
                    <a href="#table-comments" class="table-pill">comments</a>
                    <a href="#table-personal_access_tokens" class="table-pill">personal_access_tokens</a>
                </div>

                <div class="schema-container" id="schemaList">
                    <!-- TABLE 1: users -->
                    <div class="schema-card" id="table-users">
                        <div class="schema-card-header">
                            <div class="schema-table-title">
                                <h3>users</h3>
                                <span class="schema-badge">11 fields</span>
                            </div>
                            <span class="schema-desc">User accounts, authentication credentials, roles, and profile information</span>
                        </div>
                        <div class="fields-table-wrapper">
                            <table class="fields-table">
                                <thead>
                                    <tr>
                                        <th>Field</th>
                                        <th>Data Type</th>
                                        <th>Constraints / Default</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>id</code>
                                                <span class="badge-key badge-pk">PK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Auto Increment</span></td>
                                        <td>Primary key unique identifier</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>name</code></div></td>
                                        <td><span class="field-type">VARCHAR(255)</span></td>
                                        <td><span class="attr-pill attr-required">Required</span></td>
                                        <td>User's full display name</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>email</code></div></td>
                                        <td><span class="field-type">VARCHAR(255)</span></td>
                                        <td><span class="attr-pill attr-unique">UNIQUE</span></td>
                                        <td>Login email address</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>email_verified_at</code></div></td>
                                        <td><span class="field-type">TIMESTAMP</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Timestamp when email was verified</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>password</code></div></td>
                                        <td><span class="field-type">VARCHAR(255)</span></td>
                                        <td><span class="attr-pill attr-required">Required</span></td>
                                        <td>Bcrypt hashed password</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>avatar</code></div></td>
                                        <td><span class="field-type">VARCHAR(255)</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Avatar image URL or path</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>phone</code></div></td>
                                        <td><span class="field-type">VARCHAR(255)</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Optional contact phone number</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>role</code></div></td>
                                        <td><span class="field-type">ENUM('user', 'admin')</span></td>
                                        <td><span class="attr-default">default 'user'</span></td>
                                        <td>Access role for system permissions & admin routes</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>remember_token</code></div></td>
                                        <td><span class="field-type">VARCHAR(100)</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Session remember token</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>created_at</code></div></td>
                                        <td><span class="field-type">TIMESTAMP</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Account creation timestamp</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>updated_at</code></div></td>
                                        <td><span class="field-type">TIMESTAMP</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Profile last update timestamp</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- TABLE 2: projects -->
                    <div class="schema-card" id="table-projects">
                        <div class="schema-card-header">
                            <div class="schema-table-title">
                                <h3>projects</h3>
                                <span class="schema-badge">11 fields</span>
                            </div>
                            <span class="schema-desc">Projects containing task lists, tasks, team ownership and member access</span>
                        </div>
                        <div class="fields-table-wrapper">
                            <table class="fields-table">
                                <thead>
                                    <tr>
                                        <th>Field</th>
                                        <th>Data Type</th>
                                        <th>Constraints / Default</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>id</code>
                                                <span class="badge-key badge-pk">PK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Auto Increment</span></td>
                                        <td>Primary key unique identifier</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>owner_id</code>
                                                <span class="badge-key badge-fk">FK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span> <span class="attr-default">&rarr; users.id (nullOnDelete)</span></td>
                                        <td>Project owner user with full write/delete permissions</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>workspace_id</code></div></td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Workspace placeholder identifier</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>name</code></div></td>
                                        <td><span class="field-type">VARCHAR(255)</span></td>
                                        <td><span class="attr-pill attr-required">Required</span></td>
                                        <td>Project title / display name</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>description</code></div></td>
                                        <td><span class="field-type">TEXT</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Detailed description of project scope</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>color</code></div></td>
                                        <td><span class="field-type">VARCHAR(255)</span></td>
                                        <td><span class="attr-default">default '#3B82F6'</span></td>
                                        <td>Hex color code used for badges and UI accents</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>icon</code></div></td>
                                        <td><span class="field-type">VARCHAR(255)</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Optional icon name or emoji identifier</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>start_date</code></div></td>
                                        <td><span class="field-type">DATE</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Scheduled kick-off date (YYYY-MM-DD)</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>due_date</code></div></td>
                                        <td><span class="field-type">DATE</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Project target delivery deadline (YYYY-MM-DD)</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>status</code></div></td>
                                        <td><span class="field-type">ENUM('planning', 'active', 'on_hold', 'completed', 'archived')</span></td>
                                        <td><span class="attr-default">default 'planning'</span></td>
                                        <td>Project lifecycle phase status</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>created_at</code> / <code>updated_at</code></div></td>
                                        <td><span class="field-type">TIMESTAMP</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Project creation and update timestamps</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- TABLE 3: project_user (Pivot) -->
                    <div class="schema-card" id="table-project_user">
                        <div class="schema-card-header">
                            <div class="schema-table-title">
                                <h3>project_user</h3>
                                <span class="schema-badge">6 fields (Pivot)</span>
                            </div>
                            <span class="schema-desc">Project membership pivot table linking users to projects with roles</span>
                        </div>
                        <div class="fields-table-wrapper">
                            <table class="fields-table">
                                <thead>
                                    <tr>
                                        <th>Field</th>
                                        <th>Data Type</th>
                                        <th>Constraints / Default</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>id</code>
                                                <span class="badge-key badge-pk">PK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Auto Increment</span></td>
                                        <td>Unique pivot record ID</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>project_id</code>
                                                <span class="badge-key badge-fk">FK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Required</span> <span class="attr-default">&rarr; projects.id (cascadeOnDelete)</span></td>
                                        <td>Associated project</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>user_id</code>
                                                <span class="badge-key badge-fk">FK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Required</span> <span class="attr-default">&rarr; users.id (cascadeOnDelete)</span></td>
                                        <td>Associated team member user</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>role</code></div></td>
                                        <td><span class="field-type">ENUM('member', 'editor')</span></td>
                                        <td><span class="attr-default">default 'member'</span></td>
                                        <td>'member' (read-only) or 'editor' (can edit tasks & lists)</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>created_at</code> / <code>updated_at</code></div></td>
                                        <td><span class="field-type">TIMESTAMP</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Pivot membership timestamps</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- TABLE 4: task_lists -->
                    <div class="schema-card" id="table-task_lists">
                        <div class="schema-card-header">
                            <div class="schema-table-title">
                                <h3>task_lists</h3>
                                <span class="schema-badge">5 fields</span>
                            </div>
                            <span class="schema-desc">Task lists / Kanban board columns belonging to a project</span>
                        </div>
                        <div class="fields-table-wrapper">
                            <table class="fields-table">
                                <thead>
                                    <tr>
                                        <th>Field</th>
                                        <th>Data Type</th>
                                        <th>Constraints / Default</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>id</code>
                                                <span class="badge-key badge-pk">PK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Auto Increment</span></td>
                                        <td>Primary key unique identifier</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>project_id</code>
                                                <span class="badge-key badge-fk">FK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Required</span> <span class="attr-default">&rarr; projects.id (cascadeOnDelete)</span></td>
                                        <td>Parent project that owns this list</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>name</code></div></td>
                                        <td><span class="field-type">VARCHAR(255)</span></td>
                                        <td><span class="attr-pill attr-required">Required</span></td>
                                        <td>List header title (e.g. Backlog, Sprint 1, Done)</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>position</code></div></td>
                                        <td><span class="field-type">INTEGER</span></td>
                                        <td><span class="attr-default">default 0</span></td>
                                        <td>Display order index within the project board</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>created_at</code> / <code>updated_at</code></div></td>
                                        <td><span class="field-type">TIMESTAMP</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>List creation and update timestamps</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- TABLE 5: tasks -->
                    <div class="schema-card" id="table-tasks">
                        <div class="schema-card-header">
                            <div class="schema-table-title">
                                <h3>tasks</h3>
                                <span class="schema-badge">15 fields</span>
                            </div>
                            <span class="schema-desc">Core task items with status, priority, assignments, schedule and estimated hours</span>
                        </div>
                        <div class="fields-table-wrapper">
                            <table class="fields-table">
                                <thead>
                                    <tr>
                                        <th>Field</th>
                                        <th>Data Type</th>
                                        <th>Constraints / Default</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>id</code>
                                                <span class="badge-key badge-pk">PK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Auto Increment</span></td>
                                        <td>Primary key unique identifier</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>project_id</code>
                                                <span class="badge-key badge-fk">FK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Required</span> <span class="attr-default">&rarr; projects.id (cascadeOnDelete)</span></td>
                                        <td>Project this task belongs to</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>task_list_id</code>
                                                <span class="badge-key badge-fk">FK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span> <span class="attr-default">&rarr; task_lists.id (set null on delete)</span></td>
                                        <td>Optional list/column grouping inside project</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>created_by</code>
                                                <span class="badge-key badge-fk">FK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Required</span> <span class="attr-default">&rarr; users.id (cascadeOnDelete)</span></td>
                                        <td>User who authored the task</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>assigned_to</code>
                                                <span class="badge-key badge-fk">FK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span> <span class="attr-default">&rarr; users.id (set null on delete)</span></td>
                                        <td>User assigned to work on the task</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>title</code></div></td>
                                        <td><span class="field-type">VARCHAR(255)</span></td>
                                        <td><span class="attr-pill attr-required">Required</span></td>
                                        <td>Task title / short summary</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>description</code></div></td>
                                        <td><span class="field-type">TEXT</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Detailed task description or specifications</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>priority</code></div></td>
                                        <td><span class="field-type">ENUM('low', 'medium', 'high', 'critical')</span></td>
                                        <td><span class="attr-default">default 'medium'</span></td>
                                        <td>Priority level for scheduling and urgency</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>status</code></div></td>
                                        <td><span class="field-type">ENUM('todo', 'in_progress', 'review', 'completed')</span></td>
                                        <td><span class="attr-default">default 'todo'</span></td>
                                        <td>Current execution progress state</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>start_date</code></div></td>
                                        <td><span class="field-type">DATETIME</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Scheduled task start date and time</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>due_date</code></div></td>
                                        <td><span class="field-type">DATETIME</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Task completion deadline date and time</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>completed_at</code></div></td>
                                        <td><span class="field-type">TIMESTAMP</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Timestamp when status moved to 'completed'</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>position</code></div></td>
                                        <td><span class="field-type">INTEGER</span></td>
                                        <td><span class="attr-default">default 0</span></td>
                                        <td>Sort order position within the task list</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>estimated_hours</code></div></td>
                                        <td><span class="field-type">DECIMAL(5, 2)</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Estimated effort in hours (e.g. 4.50)</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>created_at</code> / <code>updated_at</code></div></td>
                                        <td><span class="field-type">TIMESTAMP</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Task creation and update timestamps</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- TABLE 6: comments -->
                    <div class="schema-card" id="table-comments">
                        <div class="schema-card-header">
                            <div class="schema-table-title">
                                <h3>comments</h3>
                                <span class="schema-badge">5 fields</span>
                            </div>
                            <span class="schema-desc">Task discussion comments posted by team members</span>
                        </div>
                        <div class="fields-table-wrapper">
                            <table class="fields-table">
                                <thead>
                                    <tr>
                                        <th>Field</th>
                                        <th>Data Type</th>
                                        <th>Constraints / Default</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>id</code>
                                                <span class="badge-key badge-pk">PK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Auto Increment</span></td>
                                        <td>Primary key unique identifier</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>task_id</code>
                                                <span class="badge-key badge-fk">FK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Required</span> <span class="attr-default">&rarr; tasks.id (cascadeOnDelete)</span></td>
                                        <td>Target task for this comment</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>user_id</code>
                                                <span class="badge-key badge-fk">FK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Required</span> <span class="attr-default">&rarr; users.id (cascadeOnDelete)</span></td>
                                        <td>Author who wrote the comment</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>comment</code></div></td>
                                        <td><span class="field-type">TEXT</span></td>
                                        <td><span class="attr-pill attr-required">Required</span></td>
                                        <td>Message content of the comment</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>created_at</code> / <code>updated_at</code></div></td>
                                        <td><span class="field-type">TIMESTAMP</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Comment posted and updated timestamps</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- TABLE 7: personal_access_tokens -->
                    <div class="schema-card" id="table-personal_access_tokens">
                        <div class="schema-card-header">
                            <div class="schema-table-title">
                                <h3>personal_access_tokens</h3>
                                <span class="schema-badge">10 fields (Sanctum)</span>
                            </div>
                            <span class="schema-desc">Laravel Sanctum bearer tokens for API authentication and session authorization</span>
                        </div>
                        <div class="fields-table-wrapper">
                            <table class="fields-table">
                                <thead>
                                    <tr>
                                        <th>Field</th>
                                        <th>Data Type</th>
                                        <th>Constraints / Default</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div class="field-name">
                                                <code>id</code>
                                                <span class="badge-key badge-pk">PK</span>
                                            </div>
                                        </td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Auto Increment</span></td>
                                        <td>Primary key unique identifier</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>tokenable_type</code></div></td>
                                        <td><span class="field-type">VARCHAR(255)</span></td>
                                        <td><span class="attr-pill attr-required">Required</span></td>
                                        <td>Polymorphic model type ('App\Models\User')</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>tokenable_id</code></div></td>
                                        <td><span class="field-type">BIGINT UNSIGNED</span></td>
                                        <td><span class="attr-pill attr-required">Required</span></td>
                                        <td>Polymorphic foreign key pointing to users.id</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>name</code></div></td>
                                        <td><span class="field-type">VARCHAR(255)</span></td>
                                        <td><span class="attr-pill attr-required">Required</span></td>
                                        <td>Token name identifier (e.g. 'auth_token')</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>token</code></div></td>
                                        <td><span class="field-type">VARCHAR(64)</span></td>
                                        <td><span class="attr-pill attr-unique">UNIQUE</span></td>
                                        <td>SHA-256 hashed bearer token hash</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>abilities</code></div></td>
                                        <td><span class="field-type">TEXT</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>JSON encoded array of token abilities</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>last_used_at</code></div></td>
                                        <td><span class="field-type">TIMESTAMP</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Timestamp when token was last used to call the API</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>expires_at</code></div></td>
                                        <td><span class="field-type">TIMESTAMP</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Token expiry timestamp</td>
                                    </tr>
                                    <tr>
                                        <td><div class="field-name"><code>created_at</code> / <code>updated_at</code></div></td>
                                        <td><span class="field-type">TIMESTAMP</span></td>
                                        <td><span class="attr-pill attr-nullable">Nullable</span></td>
                                        <td>Token generation and refresh timestamps</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ==================== SECTION: API ENDPOINTS ==================== -->
            <section class="section" id="endpointsSection">
                <div class="section-header">
                    <h2>⚡ Available Endpoints</h2>
                    <span class="schema-badge">33 REST Routes</span>
                </div>
                
                <div class="endpoints" id="endpointsList">
                    <div class="endpoint-group">
                        <h3>🔐 Authentication</h3>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/register</span>
                            <span class="description">Register new user account</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/login</span>
                            <span class="description">User login and token generation</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/forgot-password</span>
                            <span class="description">Request password reset token</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/reset-password</span>
                            <span class="description">Reset password with token</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/logout</span>
                            <span class="description">Revoke bearer token and log out</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/auth/me</span>
                            <span class="description">Get current authenticated user profile</span>
                        </div>
                        <div class="endpoint">
                            <span class="method put">PUT</span>
                            <span class="path">/api/auth/profile</span>
                            <span class="description">Update name and email profile</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/change-password</span>
                            <span class="description">Change account password</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/auth/avatar</span>
                            <span class="description">Upload user profile avatar image</span>
                        </div>
                    </div>
                    
                    <div class="endpoint-group">
                        <h3>📁 Projects</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/projects</span>
                            <span class="description">List all projects (filtered by ownership / membership)</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/projects</span>
                            <span class="description">Create project</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/projects/{id}</span>
                            <span class="description">Get project details with lists and task statistics</span>
                        </div>
                        <div class="endpoint">
                            <span class="method put">PUT</span>
                            <span class="path">/api/projects/{id}</span>
                            <span class="description">Update project (owner or editor)</span>
                        </div>
                        <div class="endpoint">
                            <span class="method delete">DELETE</span>
                            <span class="path">/api/projects/{id}</span>
                            <span class="description">Delete project (owner only)</span>
                        </div>
                    </div>
                    
                    <div class="endpoint-group">
                        <h3>📝 Task Lists</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/task-lists</span>
                            <span class="description">List task lists across projects</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/task-lists</span>
                            <span class="description">Create task list / column</span>
                        </div>
                        <div class="endpoint">
                            <span class="method put">PUT</span>
                            <span class="path">/api/task-lists/{id}</span>
                            <span class="description">Update task list title</span>
                        </div>
                        <div class="endpoint">
                            <span class="method delete">DELETE</span>
                            <span class="path">/api/task-lists/{id}</span>
                            <span class="description">Delete task list</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/task-lists/reorder</span>
                            <span class="description">Batch reorder task lists positions</span>
                        </div>
                    </div>

                    <div class="endpoint-group">
                        <h3>✅ Tasks</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/tasks</span>
                            <span class="description">List tasks with filters (project, priority, status)</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/tasks</span>
                            <span class="description">Create task item</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/tasks/{id}</span>
                            <span class="description">Get single task details with author and comments</span>
                        </div>
                        <div class="endpoint">
                            <span class="method put">PUT</span>
                            <span class="path">/api/tasks/{id}</span>
                            <span class="description">Update task details, status, or priority</span>
                        </div>
                        <div class="endpoint">
                            <span class="method delete">DELETE</span>
                            <span class="path">/api/tasks/{id}</span>
                            <span class="description">Delete task</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/tasks/reorder</span>
                            <span class="description">Batch reorder tasks position in list</span>
                        </div>
                    </div>
                    
                    <div class="endpoint-group">
                        <h3>💬 Comments</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/tasks/{task}/comments</span>
                            <span class="description">List all comments for a specific task</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/comments</span>
                            <span class="description">Create comment on a task</span>
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
                        <h3>📊 Dashboard</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/dashboard</span>
                            <span class="description">Get user dashboard summary metrics, counts, and recent tasks</span>
                        </div>
                    </div>
                    
                    <div class="endpoint-group">
                        <h3>👑 Admin (Requires Admin Role)</h3>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/admin/dashboard</span>
                            <span class="description">System-wide admin dashboard statistics</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/admin/reports</span>
                            <span class="description">Generate system-wide analytics reports</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <span class="path">/api/admin/users</span>
                            <span class="description">List all registered users (paginated)</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/admin/users</span>
                            <span class="description">Admin create new user account</span>
                        </div>
                        <div class="endpoint">
                            <span class="method put">PUT</span>
                            <span class="path">/api/admin/users/{user}/role</span>
                            <span class="description">Update user role (user &harr; admin)</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <span class="path">/api/admin/users/{user}/reset-password</span>
                            <span class="description">Force reset user password</span>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- Quick Links -->
            <section class="section">
                <div class="section-header">
                    <h2>🔗 Quick Links</h2>
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
            
            <!-- Authentication Header Snippet -->
            <section class="section" style="margin-bottom: 0;">
                <div class="section-header">
                    <h2>🔐 Authentication Header</h2>
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
        // Tab switching
        function switchView(view) {
            const tabAll = document.getElementById('tabAll');
            const tabEndpoints = document.getElementById('tabEndpoints');
            const tabDatabase = document.getElementById('tabDatabase');
            const databaseSec = document.getElementById('databaseSection');
            const endpointsSec = document.getElementById('endpointsSection');
            const heading = document.getElementById('viewHeading');

            tabAll.classList.remove('active');
            tabEndpoints.classList.remove('active');
            tabDatabase.classList.remove('active');

            if (view === 'endpoints') {
                tabEndpoints.classList.add('active');
                endpointsSec.style.display = 'block';
                databaseSec.style.display = 'none';
                heading.textContent = 'Available API Endpoints';
            } else if (view === 'database') {
                tabDatabase.classList.add('active');
                endpointsSec.style.display = 'none';
                databaseSec.style.display = 'block';
                heading.textContent = 'Database Tables & Schema Fields';
            } else {
                tabAll.classList.add('active');
                endpointsSec.style.display = 'block';
                databaseSec.style.display = 'block';
                heading.textContent = 'API Endpoints & Database Fields';
            }
        }

        // Live interactive search across endpoints & database schema
        const searchInput = document.getElementById('globalSearch');
        const endpointGroups = document.querySelectorAll('.endpoint-group');
        const schemaCards = document.querySelectorAll('.schema-card');

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            // Filter Endpoints
            endpointGroups.forEach(group => {
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

            // Filter Database Tables & Fields
            schemaCards.forEach(card => {
                const tableName = card.querySelector('h3')?.textContent.toLowerCase() || '';
                const rows = card.querySelectorAll('tbody tr');
                let visibleRows = 0;

                rows.forEach(row => {
                    const rowText = row.textContent.toLowerCase();
                    if (!query || tableName.includes(query) || rowText.includes(query)) {
                        row.style.display = '';
                        visibleRows++;
                    } else {
                        row.style.display = 'none';
                    }
                });

                card.style.display = (visibleRows > 0) ? 'block' : 'none';
            });
        });
    </script>
</body>
</html>
