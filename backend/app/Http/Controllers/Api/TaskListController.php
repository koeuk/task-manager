<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\TaskList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        $user = $request->user();

        $query = TaskList::with(['tasks'])
            ->whereHas('project', fn ($p) => $p->visibleTo($user));

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

        $this->authorizeProject($validated['project_id'], $request);

        // Default position to the end of the list within the project. The null
        // coalesce matters on an empty project: max() returns null there, and
        // null + 1 would start the first column at position 1 instead of 0.
        if (!isset($validated['position'])) {
            $max = TaskList::where('project_id', $validated['project_id'])->max('position');
            $validated['position'] = ($max ?? -1) + 1;
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
    public function show(Request $request, string $id)
    {
        $taskList = TaskList::with([
            'project',
            'tasks.assignee',
            'tasks.creator'
        ])->findOrFail($id);

        if (!$taskList->project || !$taskList->project->isVisibleTo($request->user())) {
            abort(404);
        }

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

        $this->authorizeProject($taskList->project_id, $request);

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
    public function destroy(Request $request, string $id)
    {
        $taskList = TaskList::findOrFail($id);

        $this->authorizeProject($taskList->project_id, $request);

        $taskList->delete();

        return response()->json([
            'message' => 'Task list deleted successfully'
        ]);
    }

    /**
     * Reject writes to a list in a project the user may not modify.
     *
     * Invisible projects yield a 404 rather than a 403 so IDs cannot be probed.
     */
    private function authorizeProject(?int $projectId, Request $request): void
    {
        $user = $request->user();
        $project = Project::find($projectId);

        if (!$project || !$project->isVisibleTo($user)) {
            abort(404);
        }

        if (!$project->isWritableBy($user)) {
            abort(403, 'You do not have permission to modify this project.');
        }
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

        // Authorize every list before writing any of them, so a payload mixing
        // owned and foreign lists cannot reorder the owned ones before aborting.
        $projectIds = TaskList::whereIn('id', collect($validated['task_lists'])->pluck('id'))
            ->pluck('project_id')
            ->unique();

        foreach ($projectIds as $projectId) {
            $this->authorizeProject($projectId, $request);
        }

        // One transaction so a mid-loop failure cannot leave half the board at new
        // positions and half at old ones.
        DB::transaction(function () use ($validated) {
            foreach ($validated['task_lists'] as $listData) {
                TaskList::where('id', $listData['id'])->update([
                    'position' => $listData['position']
                ]);
            }
        });

        return response()->json([
            'message' => 'Task lists reordered successfully'
        ]);
    }
}
