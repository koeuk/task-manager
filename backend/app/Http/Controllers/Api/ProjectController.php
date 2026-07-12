<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
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
     * Store a newly created resource in storage.
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
     * Display the specified resource.
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
     * Update the specified resource in storage.
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
     * Remove the specified resource from storage.
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
     * Get dashboard statistics for the authenticated user
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