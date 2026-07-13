<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;

/**
 * @group Tasks
 *
 * Create and manage tasks within projects and task lists.
 *
 * @authenticated
 */
class TaskController extends Controller
{
    /**
     * List tasks
     *
     * Returns a paginated list of tasks (with project, list, creator, assignee, comments).
     *
     * @queryParam project_id integer Filter by project. Example: 1
     * @queryParam task_list_id integer Filter by task list. Example: 2
     * @queryParam status string Filter by status: todo, in_progress, review, completed. Example: in_progress
     * @queryParam priority string Filter by priority: low, medium, high, critical. Example: high
     * @queryParam assigned_to integer Filter by assignee user ID. Example: 3
     * @queryParam search string Search title/description. Example: homepage
     * @queryParam per_page integer Results per page (default 15). Example: 15
     */
    public function index(Request $request)
    {
        $query = Task::with(['project', 'taskList', 'creator', 'assignee', 'comments']);
        
        // Filter by project
        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        // Filter by task list
        if ($request->has('task_list_id')) {
            $query->where('task_list_id', $request->task_list_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filter by assigned user
        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        // Search
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        // Order by position
        $query->orderBy('position');

        $tasks = $query->paginate($request->per_page ?? 15);

        return response()->json($tasks);
    }

    /**
     * Create a task
     *
     * The authenticated user is recorded as the creator.
     *
     * @bodyParam project_id integer required The project ID. Example: 1
     * @bodyParam task_list_id integer The task list (column) ID. Example: 2
     * @bodyParam title string required The task title. Example: Design the homepage
     * @bodyParam description string A longer description. Example: Hero, nav, and footer.
     * @bodyParam priority string One of: low, medium, high, critical. Example: high
     * @bodyParam status string One of: todo, in_progress, review, completed. Example: todo
     * @bodyParam assigned_to integer User ID to assign. Example: 3
     * @bodyParam start_date date Start date/time. Example: 2026-07-10
     * @bodyParam due_date date Due date/time, on/after start_date. Example: 2026-07-20
     * @bodyParam estimated_hours number Estimated hours. Example: 4.5
     * @bodyParam position integer Ordering position within the list. Example: 0
     * @response 201 {"message": "Task created successfully", "task": {"id": 1, "title": "Design the homepage", "status": "todo", "priority": "high"}}
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'task_list_id' => 'nullable|exists:task_lists,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|in:low,medium,high,critical',
            'status' => 'nullable|in:todo,in_progress,review,completed',
            'assigned_to' => 'nullable|exists:users,id',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'estimated_hours' => 'nullable|numeric|min:0',
            'position' => 'nullable|integer'
        ]);

        $validated['created_by'] = $request->user()->id;

        $task = Task::create($validated);

        return response()->json([
            'message' => 'Task created successfully',
            'task' => $task->load(['project', 'taskList', 'creator', 'assignee'])
        ], 201);
    }

    /**
     * Get a task
     *
     * Returns the task with project, list, creator, assignee, and comments.
     *
     * @urlParam id integer required The task ID. Example: 1
     */
    public function show(string $id)
    {
        $task = Task::with([
            'project',
            'taskList',
            'creator',
            'assignee',
            'comments.user'
        ])->findOrFail($id);

        return response()->json($task);
    }

    /**
     * Update a task
     *
     * Setting status to `completed` stamps completed_at automatically.
     *
     * @urlParam id integer required The task ID. Example: 1
     * @bodyParam task_list_id integer Move to another list. Example: 3
     * @bodyParam title string The task title. Example: Design the homepage v2
     * @bodyParam description string A longer description. Example: Updated brief.
     * @bodyParam priority string One of: low, medium, high, critical. Example: critical
     * @bodyParam status string One of: todo, in_progress, review, completed. Example: completed
     * @bodyParam assigned_to integer User ID to assign. Example: 3
     * @bodyParam start_date date Start date/time. Example: 2026-07-10
     * @bodyParam due_date date Due date/time. Example: 2026-07-25
     * @bodyParam estimated_hours number Estimated hours. Example: 6
     * @bodyParam position integer Ordering position. Example: 1
     * @response 200 {"message": "Task updated successfully", "task": {"id": 1, "status": "completed"}}
     */
    public function update(Request $request, string $id)
    {
        $task = Task::findOrFail($id);

        $validated = $request->validate([
            'task_list_id' => 'nullable|exists:task_lists,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|in:low,medium,high,critical',
            'status' => 'nullable|in:todo,in_progress,review,completed',
            'assigned_to' => 'nullable|exists:users,id',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'estimated_hours' => 'nullable|numeric|min:0',
            'position' => 'nullable|integer'
        ]);

        // Auto-set completed_at when status changes to completed
        if (isset($validated['status']) && $validated['status'] === 'completed' && $task->status !== 'completed') {
            $validated['completed_at'] = now();
        } elseif (isset($validated['status']) && $validated['status'] !== 'completed') {
            $validated['completed_at'] = null;
        }

        $task->update($validated);

        return response()->json([
            'message' => 'Task updated successfully',
            'task' => $task->load(['project', 'taskList', 'creator', 'assignee'])
        ]);
    }

    /**
     * Delete a task
     *
     * @urlParam id integer required The task ID. Example: 1
     * @response 200 {"message": "Task deleted successfully"}
     */
    public function destroy(string $id)
    {
        $task = Task::findOrFail($id);
        $task->delete();

        return response()->json([
            'message' => 'Task deleted successfully'
        ]);
    }

    /**
     * Reorder tasks
     *
     * Persists new positions (and optionally new task lists) for a set of tasks —
     * used by the board's drag-and-drop.
     *
     * @bodyParam tasks object[] required The tasks with new positions.
     * @bodyParam tasks[].id integer required The task ID. Example: 1
     * @bodyParam tasks[].position integer required The new position. Example: 0
     * @bodyParam tasks[].task_list_id integer The list the task now belongs to. Example: 2
     * @response 200 {"message": "Tasks reordered successfully"}
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'tasks' => 'required|array',
            'tasks.*.id' => 'required|exists:tasks,id',
            'tasks.*.position' => 'required|integer',
            'tasks.*.task_list_id' => 'nullable|exists:task_lists,id'
        ]);

        foreach ($validated['tasks'] as $taskData) {
            Task::where('id', $taskData['id'])->update([
                'position' => $taskData['position'],
                'task_list_id' => $taskData['task_list_id'] ?? null
            ]);
        }

        return response()->json([
            'message' => 'Tasks reordered successfully'
        ]);
    }
}