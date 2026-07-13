<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaskList;
use Illuminate\Http\Request;

/**
 * @group Task Lists
 *
 * Columns within a project (e.g. "To Do", "In Progress") that group tasks on the board.
 *
 * @authenticated
 */
class TaskListController extends Controller
{
    /**
     * List task lists
     *
     * @queryParam project_id integer Filter by project. Example: 1
     */
    public function index(Request $request)
    {
        $query = TaskList::with(['tasks']);

        // Filter by project
        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        $taskLists = $query->orderBy('position')->get();

        return response()->json($taskLists);
    }

    /**
     * Create a task list
     *
     * @bodyParam project_id integer required The parent project ID. Example: 1
     * @bodyParam name string required The list name. Example: To Do
     * @bodyParam position integer Ordering position (defaults to the end). Example: 0
     * @response 201 {"message": "Task list created successfully", "task_list": {"id": 1, "project_id": 1, "name": "To Do", "position": 0}}
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'name' => 'required|string|max:255',
            'position' => 'nullable|integer'
        ]);

        // Default position to the end of the list within the project
        if (!isset($validated['position'])) {
            $validated['position'] = TaskList::where('project_id', $validated['project_id'])->max('position') + 1;
        }

        $taskList = TaskList::create($validated);

        return response()->json([
            'message' => 'Task list created successfully',
            'task_list' => $taskList->load('tasks')
        ], 201);
    }

    /**
     * Get a task list
     *
     * @urlParam id integer required The task list ID. Example: 1
     */
    public function show(string $id)
    {
        $taskList = TaskList::with([
            'project',
            'tasks.assignee',
            'tasks.creator'
        ])->findOrFail($id);

        return response()->json($taskList);
    }

    /**
     * Update a task list
     *
     * @urlParam id integer required The task list ID. Example: 1
     * @bodyParam name string The list name. Example: In Progress
     * @bodyParam position integer Ordering position. Example: 1
     */
    public function update(Request $request, string $id)
    {
        $taskList = TaskList::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'position' => 'nullable|integer'
        ]);

        $taskList->update($validated);

        return response()->json([
            'message' => 'Task list updated successfully',
            'task_list' => $taskList->load('tasks')
        ]);
    }

    /**
     * Delete a task list
     *
     * @urlParam id integer required The task list ID. Example: 1
     * @response 200 {"message": "Task list deleted successfully"}
     */
    public function destroy(string $id)
    {
        $taskList = TaskList::findOrFail($id);
        $taskList->delete();

        return response()->json([
            'message' => 'Task list deleted successfully'
        ]);
    }

    /**
     * Reorder task lists
     *
     * Persists new positions for a set of task lists.
     *
     * @bodyParam task_lists object[] required The lists with new positions.
     * @bodyParam task_lists[].id integer required The task list ID. Example: 1
     * @bodyParam task_lists[].position integer required The new position. Example: 0
     * @response 200 {"message": "Task lists reordered successfully"}
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'task_lists' => 'required|array',
            'task_lists.*.id' => 'required|exists:task_lists,id',
            'task_lists.*.position' => 'required|integer'
        ]);

        foreach ($validated['task_lists'] as $listData) {
            TaskList::where('id', $listData['id'])->update([
                'position' => $listData['position']
            ]);
        }

        return response()->json([
            'message' => 'Task lists reordered successfully'
        ]);
    }
}
