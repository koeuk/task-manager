<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'project_id',
        'task_id',
        'action',
        'entity_type',
        'entity_id',
        'description',
        'properties',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'properties' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Convenient static method to record an audit / activity log entry.
     */
    public static function record(
        string $action,
        string $description,
        ?Model $entity = null,
        array $properties = [],
        ?int $projectId = null,
        ?int $taskId = null,
        ?int $userId = null
    ): self {
        $user = auth()->user();
        $userId = $userId ?? ($user ? $user->id : null);

        $entityType = null;
        $entityId = null;
        if ($entity) {
            $entityType = strtolower(class_basename($entity));
            $entityId = $entity->getKey();

            if (!$projectId && isset($entity->project_id)) {
                $projectId = $entity->project_id;
            } elseif (!$projectId && $entity instanceof Project) {
                $projectId = $entity->id;
            }

            if (!$taskId && $entity instanceof Task) {
                $taskId = $entity->id;
            }
        }

        return self::create([
            'user_id' => $userId,
            'project_id' => $projectId,
            'task_id' => $taskId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
            'properties' => !empty($properties) ? $properties : null,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent() ? substr(Request::userAgent(), 0, 500) : null,
        ]);
    }
}
