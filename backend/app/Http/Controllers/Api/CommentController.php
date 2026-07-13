<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
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
        $query = Comment::with(['user', 'task']);

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
    public function show(string $id)
    {
        $comment = Comment::with(['user', 'task'])->findOrFail($id);

        return response()->json($comment);
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
    public function byTask(string $task)
    {
        $comments = Comment::with('user')
            ->where('task_id', $task)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($comments);
    }
}
