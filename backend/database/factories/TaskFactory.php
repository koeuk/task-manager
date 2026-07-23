<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        // Spread work across the whole of 2026 so month-by-month reports have
        // something to show, with due dates on both sides of today (overdue and
        // upcoming) rather than all clustered in one direction.
        $start = fake()->dateTimeBetween('2026-01-01', '2026-12-15');
        $due = (clone $start)->modify('+' . fake()->numberBetween(1, 45) . ' days');

        // Keep everything inside the year. A start date in late December plus a
        // six-week lead time would otherwise land the due date in 2027 and leak
        // rows outside the seeded range.
        $endOfYear = new \DateTime('2026-12-31 23:59:59');
        if ($due > $endOfYear) {
            $due = $endOfYear;
        }

        $status = $this->plausibleStatus(Carbon::instance($due));

        return [
            'project_id' => Project::factory(),
            'created_by' => User::factory(),
            'assigned_to' => null,
            'title' => $this->title(),
            'description' => fake()->boolean(70) ? fake()->sentence(14) : null,
            'priority' => fake()->randomElement(['low', 'medium', 'medium', 'high', 'high', 'critical']),
            'status' => $status,
            'start_date' => $start->format('Y-m-d H:i:s'),
            'due_date' => $due->format('Y-m-d H:i:s'),
            // Mirrors TaskController: only completed tasks carry a completion stamp.
            'completed_at' => $status === 'completed'
                ? fake()->dateTimeBetween($start, $due)->format('Y-m-d H:i:s')
                : null,
            'position' => 0,
            'estimated_hours' => fake()->boolean(65) ? fake()->randomFloat(1, 0.5, 40) : null,
        ];
    }

    /**
     * Weight status by whether the due date has passed, so the data looks like a
     * real board: mostly-done in the past, mostly-open in the future, instead of
     * a uniform scatter that makes every chart look identical.
     */
    private function plausibleStatus(Carbon $due): string
    {
        if ($due->isPast()) {
            return fake()->randomElement([
                'completed', 'completed', 'completed', 'completed', 'completed', 'completed',
                'review', 'in_progress', 'todo',
            ]);
        }

        return fake()->randomElement([
            'todo', 'todo', 'todo', 'todo',
            'in_progress', 'in_progress', 'in_progress',
            'review', 'review',
            'completed',
        ]);
    }

    private function title(): string
    {
        $verb = fake()->randomElement([
            'Design', 'Build', 'Refactor', 'Fix', 'Review', 'Document', 'Test',
            'Migrate', 'Optimise', 'Investigate', 'Ship', 'Prototype', 'Audit',
        ]);

        $object = fake()->randomElement([
            'the checkout flow', 'the login screen', 'the dashboard widgets',
            'the export pipeline', 'the search index', 'the email templates',
            'the mobile navigation', 'the report builder', 'the API rate limits',
            'the onboarding wizard', 'the notification badges', 'the audit log',
            'the settings page', 'the file uploader', 'the permissions matrix',
            'the pricing table', 'the invoice PDF', 'the session handling',
        ]);

        return "{$verb} {$object}";
    }

    /** Task belongs to an existing project rather than creating a new one. */
    public function forProject(Project $project): static
    {
        return $this->state(fn () => ['project_id' => $project->id]);
    }
}
