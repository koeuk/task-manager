# Implementation Plan: Prevent Unauthenticated Users from Accessing Data

## Current State Analysis

### User Frontend
- **Auth Guard**: Currently always allows access by auto-establishing a guest session (`guest@example.com` / `guest-access-123`)
- **Route Protection**: All routes under `UserLayoutComponent` use `authGuard`, but it never blocks — it silently logs in as guest
- **Guest Session**: `APP_INITIALIZER` in `app.config.ts` calls `ensureGuestSession()` at startup, automatically creating a guest token
- **Write Guard**: `WriteGuardService` blocks guest users from write operations but allows them full read access
- **Dashboard**: Loads all data without checking if user is a real account — guests can see everything

### Admin Frontend  
- **Auth Guard**: Properly redirects to `/login` if not authenticated as admin
- **No Guest Mode**: Admin portal requires explicit login

### Backend
- **API Protection**: All data endpoints (projects, tasks, comments, dashboard) require `auth:sanctum` middleware ✅
- **Guest User**: The seeder references `guest@example.com` but doesn't create it — the user frontend expects this account to exist
- **Authorization**: Projects use `scopeVisibleTo()` and `isVisibleTo()` to filter by ownership/membership

### The Problem
The user frontend is designed as a "public browsing mode" app where guests can view data but must log in to edit. **This contradicts the requirement**: users without accounts should see an empty page and cannot access ANY data.

## Implementation Strategy

The requirement fundamentally changes the app's design philosophy from "public browsing with write-gating" to "authentication-required for any access." We need to:

1. **Backend**: Remove guest account assumption and ensure authorization checks reject unauthenticated/guest users
2. **User Frontend**: Block route access for non-authenticated real users, show empty/welcome state instead of guest auto-login
3. **Remove Guest Mode**: Disable the automatic guest session and write-guard pattern

## Implementation Plan

- [ ] 1. **Remove guest session auto-initialization from user frontend**
      Delete the `APP_INITIALIZER` provider that calls `ensureGuestSession()` in `/mnt/DriveBeltie/Projects/task-management/user/src/app/app.config.ts`.
      Remove the `ensureGuestSession()` call and its associated logic from `AuthService`.
      Files: `/mnt/DriveBeltie/Projects/task-management/user/src/app/app.config.ts`, `/mnt/DriveBeltie/Projects/task-management/user/src/app/core/services/auth.service.ts`
      Verify: `npm run build --prefix /mnt/DriveBeltie/Projects/task-management/user` — build completes without errors.

- [ ] 2. **Update auth guard to block unauthenticated users**
      Modify `/mnt/DriveBeltie/Projects/task-management/user/src/app/core/guards/auth.guard.ts` to check if a real (non-guest) user is authenticated. If not, return `false` (block access). Remove the `ensureGuestSession()` call.
      Files: `/mnt/DriveBeltie/Projects/task-management/user/src/app/core/guards/auth.guard.ts`
      Verify: `npm run build --prefix /mnt/DriveBeltie/Projects/task-management/user` — build completes without errors.

- [ ] 3. **Create empty state landing component for unauthenticated users**
      Create a new standalone component at `/mnt/DriveBeltie/Projects/task-management/user/src/app/features/auth/landing/landing.component.ts`. This component should display a welcome message, brief description of the app, and buttons to "Login" and "Register". The login button opens `LoginDialogComponent`, and register button navigates to `/register`. Use Angular Material card and buttons for consistency.
      Files: `/mnt/DriveBeltie/Projects/task-management/user/src/app/features/auth/landing/landing.component.ts`, `/mnt/DriveBeltie/Projects/task-management/user/src/app/features/auth/landing/landing.component.html`, `/mnt/DriveBeltie/Projects/task-management/user/src/app/features/auth/landing/landing.component.scss`
      Verify: `npm run build --prefix /mnt/DriveBeltie/Projects/task-management/user` — build completes and component is registered.

- [ ] 4. **Update route configuration to show landing page for unauthenticated access**
      Modify `/mnt/DriveBeltie/Projects/task-management/user/src/app/app.routes.ts`:
      - Add a new public route for the landing component at path `'landing'`
      - Update the auth guard to redirect to `/landing` when blocking unauthenticated users (return `router.createUrlTree(['/landing'])` instead of `false`)
      - Change the catch-all `**` redirect to go to `'landing'` instead of `'dashboard'`
      - Keep register and forgot-password routes public
      Files: `/mnt/DriveBeltie/Projects/task-management/user/src/app/app.routes.ts`, `/mnt/DriveBeltie/Projects/task-management/user/src/app/core/guards/auth.guard.ts`
      Verify: `npm run build --prefix /mnt/DriveBeltie/Projects/task-management/user` — build completes without errors.

- [ ] 5. **Update AuthService to remove guest-related methods and properties**
      Remove or stub out `ensureGuestSession()`, `isGuest` getter, and the `guestCredentials` constant from `/mnt/DriveBeltie/Projects/task-management/user/src/app/core/services/auth.service.ts`. Update `isAuthenticated()` to check for both token presence AND that the user is not the old guest user (email check). Update `finishLogout()` to navigate to `/landing` instead of calling `ensureGuestSession()`.
      Files: `/mnt/DriveBeltie/Projects/task-management/user/src/app/core/services/auth.service.ts`
      Verify: `npm run build --prefix /mnt/DriveBeltie/Projects/task-management/user` — build completes without errors.

- [ ] 6. **Update WriteGuardService since guest mode is removed**
      Since there's no longer a guest mode, `WriteGuardService.requireWrite()` should always return `of(true)` if authenticated, and `blockGuest()` should always return `false`. Alternatively, remove the service entirely and update all components that use it to simply check `authService.isAuthenticated()`. For this plan, we'll simplify the service.
      Files: `/mnt/DriveBeltie/Projects/task-management/user/src/app/core/services/write-guard.service.ts`
      Verify: `npm run build --prefix /mnt/DriveBeltie/Projects/task-management/user` — build completes without TypeScript errors.

- [ ] 7. **Update dashboard and data-loading components to handle auth state**
      The dashboard component (`/mnt/DriveBeltie/Projects/task-management/user/src/app/features/dashboard/dashboard.component.ts`) and other components that load data (projects, tasks, calendar) should already be protected by the route guard, but ensure they gracefully handle 401 errors from the API (by redirecting to landing or showing a login prompt). Review HTTP interceptor to catch 401s and call `authService.clearSession()` then navigate to `/landing`.
      Files: `/mnt/DriveBeltie/Projects/task-management/user/src/app/core/interceptors/auth.interceptor.ts` (if exists, otherwise `/mnt/DriveBeltie/Projects/task-management/user/src/app/core/interceptors/` directory)
      Verify: `npm run build --prefix /mnt/DriveBeltie/Projects/task-management/user` — build completes without errors.

- [ ] 8. **Backend: Remove or document guest account dependency**
      The seeder (`/mnt/DriveBeltie/Projects/task-management/backend/database/seeders/DemoDataSeeder.php`) references `guest@example.com` but doesn't create it. Since the user frontend no longer auto-logs in as guest, remove the guest account references from the seeder to avoid confusion.
      Files: `/mnt/DriveBeltie/Projects/task-management/backend/database/seeders/DemoDataSeeder.php`
      Verify: `php -l /mnt/DriveBeltie/Projects/task-management/backend/database/seeders/DemoDataSeeder.php` — syntax check passes.

- [ ] 9. **Backend: Verify authorization prevents guest/unauthenticated access**
      All data endpoints already require `auth:sanctum` middleware, which rejects requests without a valid token. Verify that `ProjectController::dashboard()`, `ProjectController::index()`, and `TaskController` methods all sit behind the `auth:sanctum` middleware group in `/mnt/DriveBeltie/Projects/task-management/backend/routes/api.php`. No changes needed if already protected — this is a verification step.
      Files: `/mnt/DriveBeltie/Projects/task-management/backend/routes/api.php` (read-only check)
      Verify: `grep -A 20 "middleware.*auth:sanctum" /mnt/DriveBeltie/Projects/task-management/backend/routes/api.php` — confirm all data routes are protected.

- [ ] 10. **Update landing component to handle post-login navigation**
      After successful login via `LoginDialogComponent` from the landing page, the user should be redirected to `/dashboard`. Ensure `LoginDialogComponent` closes with a success result, and the landing component subscribes to that result and navigates accordingly.
      Files: `/mnt/DriveBeltie/Projects/task-management/user/src/app/features/auth/landing/landing.component.ts`
      Verify: `npm run build --prefix /mnt/DriveBeltie/Projects/task-management/user` — build completes without errors.

- [ ] 11. **Test the complete flow**
      Manually test the user frontend:
      - Start fresh (clear localStorage) and load `http://localhost:4200` — should redirect to `/landing` with welcome message
      - Click "Register" — should navigate to `/register` page
      - Complete registration — should log in and navigate to `/dashboard` with data visible
      - Log out — should redirect back to `/landing` with empty state
      - Try to navigate directly to `/dashboard` while logged out — should redirect to `/landing`
      - Click "Login" on landing page, enter credentials — should authenticate and navigate to `/dashboard`
      Files: Manual browser testing
      Verify: All navigation and data access follows the new authentication-required pattern.

## Verification Summary

After implementing all steps:

1. **Build the user frontend**: `cd /mnt/DriveBeltie/Projects/task-management/user && npm run build` — should complete without errors
2. **Check TypeScript compilation**: All auth-related services and components should have no type errors
3. **Backend syntax check**: `php -l` on modified PHP files
4. **Manual end-to-end test**: Follow step 11 to verify the complete user flow
5. **API endpoint protection**: All data endpoints return 401 Unauthorized when accessed without a valid token

## Key Design Decisions

1. **Landing page over login page**: The app has register, forgot-password, and dashboard routes, but no standalone login page. The landing component serves as the entry point with an embedded login dialog option, maintaining the existing pattern of dialog-based login.

2. **Auth guard returns URL tree**: Using `router.createUrlTree(['/landing'])` instead of manual navigation in the guard allows Angular's router to handle the redirect properly and maintain the URL state.

3. **Keep write-guard service**: Although guest mode is removed, the service is simplified rather than deleted to avoid breaking existing component dependencies. Future refactoring can remove it entirely.

4. **Backend unchanged**: The backend already correctly protects all data endpoints with `auth:sanctum` middleware. The only change is documentation cleanup (removing guest account references in seeders).

5. **No empty state in dashboard**: Instead of conditionally showing empty state in the dashboard, we prevent access entirely with the auth guard and show the landing page. This is cleaner and matches the requirement that users "cannot see data" without an account.

## Affected Files Summary

### User Frontend (Angular)
- `/mnt/DriveBeltie/Projects/task-management/user/src/app/app.config.ts` — remove APP_INITIALIZER
- `/mnt/DriveBeltie/Projects/task-management/user/src/app/app.routes.ts` — add landing route, update redirects
- `/mnt/DriveBeltie/Projects/task-management/user/src/app/core/guards/auth.guard.ts` — block unauthenticated, redirect to landing
- `/mnt/DriveBeltie/Projects/task-management/user/src/app/core/services/auth.service.ts` — remove guest mode logic
- `/mnt/DriveBeltie/Projects/task-management/user/src/app/core/services/write-guard.service.ts` — simplify (no guest checks)
- `/mnt/DriveBeltie/Projects/task-management/user/src/app/core/interceptors/auth.interceptor.ts` — handle 401 redirect to landing
- `/mnt/DriveBeltie/Projects/task-management/user/src/app/features/auth/landing/` — NEW landing component (3 files)

### Backend (Laravel)
- `/mnt/DriveBeltie/Projects/task-management/backend/database/seeders/DemoDataSeeder.php` — remove guest account references

### No Changes Required
- Admin frontend — already has proper auth guard
- Backend API routes — already protected with `auth:sanctum`
- Backend controllers — already check user permissions
