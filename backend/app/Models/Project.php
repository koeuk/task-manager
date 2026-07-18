<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'owner_id',
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

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class)->withPivot('role')->withTimestamps();
    }

    /**
     * Limit a query to the projects a user is allowed to see.
     *
     * Admins are deliberately unscoped: the admin panel talks to this same
     * controller and is expected to show every project in the system.
     */
    public function scopeVisibleTo($query, User $user)
    {
        if ($user->isAdmin()) {
            return $query;
        }

        return $query->where(function ($q) use ($user) {
            $q->where('owner_id', $user->id)
                ->orWhereHas('members', fn ($m) => $m->where('users.id', $user->id));
        });
    }

    /** Whether the user may read this project. */
    public function isVisibleTo(User $user): bool
    {
        return $user->isAdmin()
            || $this->owner_id === $user->id
            || $this->members()->where('users.id', $user->id)->exists();
    }

    /**
     * Whether the user may modify this project or anything inside it.
     *
     * Plain members get read-only access; writing requires ownership, an
     * 'editor' pivot role, or admin.
     */
    public function isWritableBy(User $user): bool
    {
        return $user->isAdmin()
            || $this->owner_id === $user->id
            || $this->members()->where('users.id', $user->id)->wherePivot('role', 'editor')->exists();
    }
}