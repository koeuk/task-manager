<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Give projects an owner and a member list.
     *
     * Until now projects belonged to nobody, so every authenticated user could read,
     * edit and delete every project in the system. Ownership is what the visibility
     * scope in Project::scopeVisibleTo() is built on.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Nullable so the column can be added to existing rows before backfilling.
            $table->foreignId('owner_id')->nullable()->after('id')
                ->constrained('users')->nullOnDelete();
        });

        Schema::create('project_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['member', 'editor'])->default('member');
            $table->timestamps();

            $table->unique(['project_id', 'user_id']);
        });

        $this->backfill();
    }

    /**
     * Preserve today's effective access for existing data.
     *
     * Every user can currently see every project, so silently scoping the existing
     * rows would take access away from people who have it right now. Instead the
     * pre-existing projects keep their current audience: owned by the first admin,
     * with every existing user attached as a member. Only projects created after
     * this migration get the tighter default.
     */
    private function backfill(): void
    {
        $ownerId = DB::table('users')->where('role', 'admin')->orderBy('id')->value('id')
            ?? DB::table('users')->orderBy('id')->value('id');

        if (!$ownerId) {
            return;
        }

        DB::table('projects')->whereNull('owner_id')->update(['owner_id' => $ownerId]);

        $projectIds = DB::table('projects')->pluck('id');
        $userIds = DB::table('users')->pluck('id');
        $now = now();

        $rows = [];
        foreach ($projectIds as $projectId) {
            foreach ($userIds as $userId) {
                $rows[] = [
                    'project_id' => $projectId,
                    'user_id' => $userId,
                    'role' => 'editor',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('project_user')->insert($chunk);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('project_user');

        Schema::table('projects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('owner_id');
        });
    }
};
