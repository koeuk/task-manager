<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\TaskList;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaskList>
 */
class TaskListFactory extends Factory
{
    protected $model = TaskList::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'name' => fake()->randomElement(['Backlog', 'To Do', 'In Progress', 'Review', 'Done']),
            'position' => 0,
        ];
    }
}
