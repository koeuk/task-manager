<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * @group Projects
 *
 * Create and manage projects. Each project holds task lists and tasks.
 *
 * @authenticated
 */
class ProjectController extends Controller
{
    /**
     * List projects
     *
     * Returns a paginated list of projects (with their task lists and tasks).
     *
     * @queryParam status string Filter by status: planning, active, on_hold, completed, archived. Example: active
     * @queryParam search string Filter by project name. Example: website
     * @queryParam per_page integer Results per page (default 15). Example: 15
     * @queryParam page integer Page number. Example: 1
     */
    public function index(Request $request)
    {
        $query = Project::with(['taskLists', 'tasks']);
        
        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $projects = $query->paginate($request->per_page ?? 15);

        return response()->json($projects);
    }

    /**
     * Create a project
     *
     * @bodyParam name string required The project name. Example: Website Redesign
     * @bodyParam description string A longer description. Example: Full redesign of the marketing site.
     * @bodyParam color string A hex color (max 7 chars). Example: #2196f3
     * @bodyParam icon string An icon name. Example: folder
     * @bodyParam start_date date Start date (Y-m-d). Example: 2026-07-01
     * @bodyParam due_date date Due date (Y-m-d), on/after start_date. Example: 2026-08-01
     * @bodyParam status string One of: planning, active, on_hold, completed, archived. Example: active
     * @response 201 {"message": "Project created successfully", "project": {"id": 1, "name": "Website Redesign", "status": "active"}}
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:50',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|in:planning,active,on_hold,completed,archived'
        ]);

        $project = Project::create($validated);

        return response()->json([
            'message' => 'Project created successfully',
            'project' => $project->load(['taskLists', 'tasks'])
        ], 201);
    }

    /**
     * Get a project
     *
     * Returns the project with its task lists, tasks, assignees, creators, and comments.
     *
     * @urlParam id integer required The project ID. Example: 1
     * @response 404 {"message": "No query results for model [App\\Models\\Project] 1"}
     */
    public function show(string $id)
    {
        $project = Project::with([
            'taskLists.tasks.assignee',
            'taskLists.tasks.creator',
            'tasks.assignee',
            'tasks.creator',
            'tasks.comments.user'
        ])->findOrFail($id);

        return response()->json($project);
    }

    /**
     * Update a project
     *
     * @urlParam id integer required The project ID. Example: 1
     * @bodyParam name string The project name. Example: Website Redesign v2
     * @bodyParam description string A longer description. Example: Updated scope.
     * @bodyParam color string A hex color (max 7 chars). Example: #10b981
     * @bodyParam icon string An icon name. Example: rocket
     * @bodyParam start_date date Start date (Y-m-d). Example: 2026-07-01
     * @bodyParam due_date date Due date (Y-m-d), on/after start_date. Example: 2026-09-01
     * @bodyParam status string One of: planning, active, on_hold, completed, archived. Example: completed
     * @response 200 {"message": "Project updated successfully", "project": {"id": 1, "name": "Website Redesign v2"}}
     */
    public function update(Request $request, string $id)
    {
        $project = Project::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:50',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|in:planning,active,on_hold,completed,archived'
        ]);

        $project->update($validated);

        return response()->json([
            'message' => 'Project updated successfully',
            'project' => $project->load(['taskLists', 'tasks'])
        ]);
    }

    /**
     * Delete a project
     *
     * Deletes the project and cascades to its tasks.
     *
     * @urlParam id integer required The project ID. Example: 1
     * @response 200 {"message": "Project deleted successfully"}
     */
    public function destroy(string $id)
    {
        $project = Project::findOrFail($id);
        $project->delete();

        return response()->json([
            'message' => 'Project deleted successfully'
        ]);
    }

    /**
     * User dashboard
     *
     * Aggregated stats for the authenticated user: project/task counts, recent
     * projects, upcoming tasks, and recent tasks.
     *
     * @group Dashboard
     * @response 200 {"total_projects": 3, "active_projects": 2, "completed_projects": 1, "total_tasks": 12, "pending_tasks": 4, "in_progress_tasks": 3, "completed_tasks": 5, "overdue_tasks": 1, "recent_projects": [], "upcoming_tasks": [], "recent_tasks": []}
     */
    public function dashboard()
    {
        $userId = Auth::id();

        // Projects table has no ownership column; scope "my projects" to the
        // projects this user is involved in (created or assigned a task there).
        $projectIds = Task::where('created_by', $userId)
            ->orWhere('assigned_to', $userId)
            ->distinct()
            ->pluck('project_id');

        // Get project statistics
        $projectStats = Project::whereIn('id', $projectIds)
            ->selectRaw('
                COUNT(*) as total_projects,
                SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active_projects,
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_projects
            ')
            ->first();
        
        // Get task statistics
        $taskStats = Task::where('created_by', $userId)
            ->orWhere('assigned_to', $userId)
            ->selectRaw('
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = "todo" THEN 1 ELSE 0 END) as pending_tasks,
                SUM(CASE WHEN status = "in_progress" THEN 1 ELSE 0 END) as in_progress_tasks,
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN due_date < CURDATE() AND status != "completed" THEN 1 ELSE 0 END) as overdue_tasks
            ')
            ->first();
        
        // Get recent projects (same "involved in" scope as the stats above)
        $recentProjects = Project::whereIn('id', $projectIds)
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get(['id', 'name', 'status', 'updated_at']);
        
        // Get upcoming tasks
        $upcomingTasks = Task::where(function($q) use ($userId) {
                $q->where('assigned_to', $userId)
                  ->orWhere('created_by', $userId);
            })
            ->where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->orderBy('due_date', 'asc')
            ->limit(5)
            ->get(['id', 'title', 'priority', 'due_date', 'status']);
        
        // Get recent tasks
        $recentTasks = Task::where(function($q) use ($userId) {
                $q->where('assigned_to', $userId)
                  ->orWhere('created_by', $userId);
            })
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get(['id', 'title', 'status', 'updated_at']);
        
        return response()->json([
            'total_projects' => $projectStats->total_projects ?? 0,
            'active_projects' => $projectStats->active_projects ?? 0,
            'completed_projects' => $projectStats->completed_projects ?? 0,
            'total_tasks' => $taskStats->total_tasks ?? 0,
            'pending_tasks' => $taskStats->pending_tasks ?? 0,
            'in_progress_tasks' => $taskStats->in_progress_tasks ?? 0,
            'completed_tasks' => $taskStats->completed_tasks ?? 0,
            'overdue_tasks' => $taskStats->overdue_tasks ?? 0,
            'recent_projects' => $recentProjects,
            'upcoming_tasks' => $upcomingTasks,
            'recent_tasks' => $recentTasks
        ]);
    }
}