<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        $start = fake()->dateTimeBetween('2026-01-01', '2026-10-31');
        $due = (clone $start)->modify('+' . fake()->numberBetween(30, 150) . ' days');

        return [
            'owner_id' => User::factory(),
            'name' => fake()->unique()->randomElement($this->projectNames()) . ' ' . fake()->randomElement(['Rollout', 'Revamp', 'Initiative', 'Programme', 'Sprint Series']),
            'description' => fake()->sentence(12),
            'color' => fake()->randomElement(['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']),
            'icon' => fake()->randomElement(['folder', 'rocket', 'dashboard', 'insights', 'campaign', 'build']),
            'start_date' => $start->format('Y-m-d'),
            'due_date' => $due->format('Y-m-d'),
            'status' => fake()->randomElement(['planning', 'active', 'active', 'active', 'on_hold', 'completed']),
        ];
    }

    private function projectNames(): array
    {
        return [
            'Website Redesign', 'Mobile App', 'Customer Portal', 'Billing Platform',
            'Data Migration', 'Design System', 'Onboarding Flow', 'Search Revamp',
            'Reporting Suite', 'Notification Service', 'Payment Gateway', 'Admin Console',
            'API Gateway', 'Content Hub', 'Booking Engine',
        ];
    }
}
