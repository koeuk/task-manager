<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Demo data for the 2026 calendar year: 10 users and 230 tasks spread over a
 * handful of projects.
 *
 * Additive by design — it never truncates, so running it alongside real data is
 * safe. Run it more than once and you simply get another batch.
 *
 *   php artisan db:seed --class=DemoDataSeeder
 */
class DemoDataSeeder extends Seeder
{
    private const USER_COUNT = 10;
    private const TASK_COUNT = 230;
    private const PROJECT_COUNT = 8;
    private const PASSWORD = 'password123';

    private const LIST_NAMES = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];

    public function run(): void
    {
        DB::transaction(function () {
            $users = $this->createUsers();
            $projects = $this->createProjects($users);
            $listsByProject = $this->createTaskLists($projects);

            $this->createTasks($projects, $listsByProject, $users);
            $this->grantAccess($projects, $users);
        });

        $this->command->newLine();
        $this->command->info(sprintf(
            'Seeded %d users, %d projects and %d tasks across 2026.',
            self::USER_COUNT,
            self::PROJECT_COUNT,
            self::TASK_COUNT
        ));
        $this->command->line('  Sign in as any seeded user with password: ' . self::PASSWORD);
    }

    /** @return \Illuminate\Support\Collection<int, User> */
    private function createUsers()
    {
        return User::factory()
            ->count(self::USER_COUNT)
            ->create([
                'password' => Hash::make(self::PASSWORD),
                'role' => 'user',
            ]);
    }

    /** @return \Illuminate\Support\Collection<int, Project> */
    private function createProjects($users)
    {
        return collect(range(1, self::PROJECT_COUNT))->map(
            fn ($i) => Project::factory()->create([
                'owner_id' => $users->random()->id,
            ])
        );
    }

    /**
     * Give every project the same five columns, in board order.
     *
     * @return array<int, \Illuminate\Support\Collection<int, TaskList>>
     */
    private function createTaskLists($projects): array
    {
        $listsByProject = [];

        foreach ($projects as $project) {
            $listsByProject[$project->id] = collect(self::LIST_NAMES)->map(
                fn ($name, $index) => TaskList::factory()->create([
                    'project_id' => $project->id,
                    'name' => $name,
                    'position' => $index,
                ])
            );
        }

        return $listsByProject;
    }

    /**
     * Spread the tasks over the projects, dropping each into the column that
     * matches its status so the board reads correctly instead of every card
     * sitting in one pile.
     */
    private function createTasks($projects, array $listsByProject, $users): void
    {
        $statusToList = [
            'todo' => 'To Do',
            'in_progress' => 'In Progress',
            'review' => 'Review',
            'completed' => 'Done',
        ];

        $positions = [];

        for ($i = 0; $i < self::TASK_COUNT; $i++) {
            $project = $projects[$i % self::PROJECT_COUNT];
            $lists = $listsByProject[$project->id];

            $task = Task::factory()->make([
                'project_id' => $project->id,
                'created_by' => $users->random()->id,
                // Roughly one in six is left unassigned, so the "Unassigned"
                // filter has something to show.
                'assigned_to' => fake()->boolean(83) ? $users->random()->id : null,
            ]);

            $listName = $statusToList[$task->status];
            $list = $lists->firstWhere('name', $listName);

            $key = $list->id;
            $positions[$key] = ($positions[$key] ?? -1) + 1;

            $task->task_list_id = $list->id;
            $task->position = $positions[$key];
            $task->save();
        }
    }

    /**
     * Attach members so the seeded data is actually reachable.
     *
     * Projects are scoped by ownership (Project::scopeVisibleTo), so without a
     * pivot row this data would be invisible to everyone except each project's
     * owner — the seeder would look like it had silently done nothing. The guest
     * account is included because the user portal signs in as it by default.
     */
    private function grantAccess($projects, $users): void
    {
        $memberIds = $users->pluck('id')->all();

        $guestId = User::where('email', 'guest@example.com')->value('id');
        if ($guestId) {
            $memberIds[] = $guestId;
        }

        $pivot = array_fill_keys($memberIds, ['role' => 'editor']);

        foreach ($projects as $project) {
            $project->members()->syncWithoutDetaching($pivot);
        }
    }
}
