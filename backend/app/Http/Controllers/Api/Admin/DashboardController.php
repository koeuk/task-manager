<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
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