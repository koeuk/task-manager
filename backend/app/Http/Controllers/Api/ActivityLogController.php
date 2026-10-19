<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Get activities accessible to the user
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = ActivityLog::with(['user', 'project', 'task'])
            ->latest('id');

        if (! $user->isAdmin()) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhereHas('project', function ($pq) use ($user) {
                        $pq->visibleTo($user);
                    });
            });
        } else {
            // Admin can see all users or filter by a specific user_id
            if ($request->filled('user_id')) {
                $query->where('user_id', $request->user_id);
            }
        }

        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = min((int) $request->get('per_page', 20), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get activities specifically for a project
     */
    public function forProject(Request $request, string $projectId)
    {
        $project = Project::findOrFail($projectId);
        if (! $project->isVisibleTo($request->user())) {
            abort(404);
        }

        $query = ActivityLog::with(['user', 'task'])
            ->where('project_id', $projectId)
            ->latest('id');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Get activities specifically for a task
     */
    public function forTask(Request $request, string $taskId)
    {
        $task = Task::with('project')->findOrFail($taskId);
        if (!$task->project || !$task->project->isVisibleTo($request->user())) {
            abort(404);
        }

        $query = ActivityLog::with(['user'])
            ->where('task_id', $taskId)
            ->latest('id');

        $perPage = min((int) $request->get('per_page', 50), 100);

        return response()->json($query->paginate($perPage));
    }

    /**
     * Admin: get all system-wide audit logs
     */
    public function adminAuditLogs(Request $request)
    {
        $query = ActivityLog::with(['user', 'project', 'task'])
            ->latest('id');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('project', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = min((int) $request->get('per_page', 25), 100);

        return response()->json($query->paginate($perPage));
    }
}
