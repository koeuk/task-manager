<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ActivityLogSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        $projects = Project::with(['tasks', 'owner'])->get();

        if ($users->isEmpty() || $projects->isEmpty()) {
            return;
        }

        $now = Carbon::now();

        foreach ($projects as $project) {
            $owner = $project->owner ?: $users->random();
            $createdAt = $project->created_at ?: $now->copy()->subDays(rand(10, 30));

            // Log project creation
            ActivityLog::create([
                'user_id' => $owner->id,
                'project_id' => $project->id,
                'action' => 'project_created',
                'entity_type' => 'project',
                'entity_id' => $project->id,
                'description' => "Created project '{$project->name}'",
                'properties' => ['status' => $project->status, 'color' => $project->color],
                'ip_address' => '127.0.0.1',
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            // For tasks in this project, log activities
            $tasks = $project->tasks->take(6);
            foreach ($tasks as $idx => $task) {
                $user = $task->creator ?: $users->random();
                $taskTime = $createdAt->copy()->addHours(($idx + 1) * rand(2, 8));

                ActivityLog::create([
                    'user_id' => $user->id,
                    'project_id' => $project->id,
                    'task_id' => $task->id,
                    'action' => 'task_created',
                    'entity_type' => 'task',
                    'entity_id' => $task->id,
                    'description' => "Created task '{$task->title}'",
                    'properties' => ['status' => $task->status, 'priority' => $task->priority],
                    'ip_address' => '127.0.0.1',
                    'created_at' => $taskTime,
                    'updated_at' => $taskTime,
                ]);

                if ($task->status === 'completed') {
                    $compTime = $taskTime->copy()->addDays(rand(1, 3));
                    ActivityLog::create([
                        'user_id' => $user->id,
                        'project_id' => $project->id,
                        'task_id' => $task->id,
                        'action' => 'task_completed',
                        'entity_type' => 'task',
                        'entity_id' => $task->id,
                        'description' => "Completed task '{$task->title}'",
                        'properties' => ['status' => 'completed'],
                        'ip_address' => '127.0.0.1',
                        'created_at' => $compTime,
                        'updated_at' => $compTime,
                    ]);
                } elseif ($task->status === 'in_progress') {
                    $progTime = $taskTime->copy()->addHours(rand(4, 24));
                    ActivityLog::create([
                        'user_id' => $user->id,
                        'project_id' => $project->id,
                        'task_id' => $task->id,
                        'action' => 'task_updated',
                        'entity_type' => 'task',
                        'entity_id' => $task->id,
                        'description' => "Moved task '{$task->title}' to In Progress",
                        'properties' => ['changes' => ['status' => 'in_progress']],
                        'ip_address' => '127.0.0.1',
                        'created_at' => $progTime,
                        'updated_at' => $progTime,
                    ]);
                }
            }
        }
    }
}
