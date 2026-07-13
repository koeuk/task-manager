<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TaskListController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\UserController;
use Illuminate\Support\Facades\Route;

// Public routes - Auth (tighter rate limit: 10 requests/min per IP)
Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Protected routes (general rate limit: 60 requests/min per user)
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // Authentication
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'user']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/avatar', [AuthController::class, 'uploadAvatar']);
    });

    // Projects
    Route::apiResource('projects', ProjectController::class);
    
    // Task Lists
    Route::apiResource('task-lists', TaskListController::class);
    Route::post('/task-lists/reorder', [TaskListController::class, 'reorder']);
    
    // Tasks
    Route::apiResource('tasks', TaskController::class);
    Route::post('/tasks/reorder', [TaskController::class, 'reorder']);
    
    // Comments
    Route::apiResource('comments', CommentController::class);
    Route::get('/tasks/{task}/comments', [CommentController::class, 'byTask']);
    
    // User Dashboard
    Route::get('/dashboard', [ProjectController::class, 'dashboard']);

    // Admin routes
    Route::middleware([\App\Http\Middleware\IsAdmin::class])->prefix('admin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/reports', [DashboardController::class, 'reports']);
        
        // User management
        Route::apiResource('users', UserController::class);
        Route::put('/users/{user}/role', [UserController::class, 'updateRole']);
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
    });
});