<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * @group Admin · Dashboard
 *
 * System-wide stats and reports. Requires an authenticated **admin** account.
 *
 * @authenticated
 */
class DashboardController extends Controller
{
    /**
     * Admin dashboard
     *
     * System-wide totals plus task/priority/role breakdowns and recent activity.
     *
     * @response 200 {"total_users": 5, "total_projects": 3, "total_tasks": 12, "completed_tasks": 5, "active_projects": 2, "tasks_by_status": [], "tasks_by_priority": [], "recent_projects": [], "recent_tasks": [], "user_stats": []}
     */
    public function index()
    {
        $stats = [
            'total_users' => User::count(),
            'total_projects' => Project::count(),
            'total_tasks' => Task::count(),
            'completed_tasks' => Task::where('status', 'completed')->count(),
            'active_projects' => Project::where('status', 'active')->count(),
            'tasks_by_status' => Task::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'tasks_by_priority' => Task::select('priority', DB::raw('count(*) as count'))
                ->groupBy('priority')
                ->get(),
            'recent_projects' => Project::with('tasks')
                ->latest()
                ->take(5)
                ->get(),
            'recent_tasks' => Task::with(['project', 'assignee', 'creator'])
                ->latest()
                ->take(10)
                ->get(),
            'user_stats' => User::select('role', DB::raw('count(*) as count'))
                ->groupBy('role')
                ->get()
        ];

        return response()->json($stats);
    }

    /**
     * Reports (date range)
     *
     * Aggregated metrics over a date range plus per-user productivity. Defaults to the last month.
     *
     * @queryParam start_date date Range start (Y-m-d). Example: 2026-06-14
     * @queryParam end_date date Range end (Y-m-d). Example: 2026-07-14
     * @response 200 {"tasks_created": 8, "tasks_completed": 5, "projects_created": 2, "new_users": 1, "productivity_by_user": []}
     */
    public function reports(Request $request)
    {
        $startDate = $request->input('start_date', now()->subMonth());
        $endDate = $request->input('end_date', now());

        $data = [
            'tasks_created' => Task::whereBetween('created_at', [$startDate, $endDate])->count(),
            'tasks_completed' => Task::whereBetween('completed_at', [$startDate, $endDate])->count(),
            'projects_created' => Project::whereBetween('created_at', [$startDate, $endDate])->count(),
            'new_users' => User::whereBetween('created_at', [$startDate, $endDate])->count(),
            'productivity_by_user' => User::withCount([
                'assignedTasks as completed_tasks' => function ($query) use ($startDate, $endDate) {
                    $query->where('status', 'completed')
                        ->whereBetween('completed_at', [$startDate, $endDate]);
                }
            ])->get(),
            'project_progress' => Project::with(['tasks' => function ($query) {
                $query->select('project_id', 'status', DB::raw('count(*) as count'))
                    ->groupBy('project_id', 'status');
            }])->get()
        ];

        return response()->json($data);
    }
}