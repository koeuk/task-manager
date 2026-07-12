<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'name',
        'description',
        'color',
        'icon',
        'start_date',
        'due_date',
        'status'
    ];

    protected $casts = [
        'start_date' => 'date',
        'due_date' => 'date'
    ];

    public function taskLists()
    {
        return $this->hasMany(TaskList::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}