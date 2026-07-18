<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Task;
use Illuminate\Http\Request;

/**
 * @group Comments
 *
 * Comments on tasks. Users may only edit or delete their own comments.
 *
 * @authenticated
 */
class CommentController extends Controller
{
    /**
     * List comments
     *
     * @queryParam task_id integer Filter by task. Example: 1
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Comments inherit visibility from the project their task lives in —
        // otherwise this endpoint would leak discussion (and author names and
        // emails) from every project in the system.
        $query = Comment::with(['user', 'task'])
            ->whereHas('task.project', fn ($p) => $p->visibleTo($user));

        // Filter by task
        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        $comments = $query->orderBy('created_at', 'desc')->get();

        return response()->json($comments);
    }

    /**
     * Create a comment
     *
     * The authenticated user is recorded as the author.
     *
     * @bodyParam task_id integer required The task to comment on. Example: 1
     * @bodyParam comment string required The comment text. Example: Looks great, shipping now!
     * @response 201 {"message": "Comment created successfully", "comment": {"id": 1, "task_id": 1, "comment": "Looks great, shipping now!"}}
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'comment' => 'required|string'
        ]);

        // exists:tasks,id only proves the task exists — check the caller can
        // actually reach the project it belongs to before letting them post.
        $this->authorizeTask($validated['task_id'], $request);

        $validated['user_id'] = $request->user()->id;

        $comment = Comment::create($validated);

        return response()->json([
            'message' => 'Comment created successfully',
            'comment' => $comment->load('user')
        ], 201);
    }

    /**
     * Get a comment
     *
     * @urlParam id integer required The comment ID. Example: 1
     */
    public function show(Request $request, string $id)
    {
        $comment = Comment::with(['user', 'task'])->findOrFail($id);

        $this->authorizeTask($comment->task_id, $request);

        return response()->json($comment);
    }

    /**
     * Reject access to a comment on a task the user cannot see.
     *
     * Read access is enough here: commenting is a normal member activity, so it
     * does not require the 'editor' role that structural edits do.
     */
    private function authorizeTask(?int $taskId, Request $request): void
    {
        $task = Task::with('project')->find($taskId);

        if (!$task || !$task->project || !$task->project->isVisibleTo($request->user())) {
            abort(404);
        }
    }

    /**
     * Update a comment
     *
     * Only the author may edit their comment.
     *
     * @urlParam id integer required The comment ID. Example: 1
     * @bodyParam comment string required The updated text. Example: Edited comment.
     * @response 403 scenario="Not the author" {"message": "Unauthorized. You can only edit your own comments."}
     */
    public function update(Request $request, string $id)
    {
        $comment = Comment::findOrFail($id);

        // Only the author may edit their comment
        if ($comment->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized. You can only edit your own comments.'
            ], 403);
        }

        $validated = $request->validate([
            'comment' => 'required|string'
        ]);

        $comment->update($validated);

        return response()->json([
            'message' => 'Comment updated successfully',
            'comment' => $comment->load('user')
        ]);
    }

    /**
     * Delete a comment
     *
     * Only the author may delete their comment.
     *
     * @urlParam id integer required The comment ID. Example: 1
     * @response 200 {"message": "Comment deleted successfully"}
     * @response 403 scenario="Not the author" {"message": "Unauthorized. You can only delete your own comments."}
     */
    public function destroy(Request $request, string $id)
    {
        $comment = Comment::findOrFail($id);

        // Only the author may delete their comment
        if ($comment->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized. You can only delete your own comments.'
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully'
        ]);
    }

    /**
     * List a task's comments
     *
     * Returns all comments for a task (newest first), each with its author.
     *
     * @urlParam task integer required The task ID. Example: 1
     */
    public function byTask(Request $request, string $task)
    {
        $this->authorizeTask((int) $task, $request);

        $comments = Comment::with('user')
            ->where('task_id', $task)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($comments);
    }
}
