<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaskList;
use Illuminate\Http\Request;

class TaskListController extends Controller
{
    /**
     * Display a listing of the resource.
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
     * Store a newly created resource in storage.
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
     * Display the specified resource.
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
     * Update the specified resource in storage.
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
     * Remove the specified resource from storage.
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
     * Update task list positions
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
