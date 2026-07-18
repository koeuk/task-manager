# CLAUDE.md

Task management monorepo: a Laravel REST API plus two separate Angular 18 frontends.
There is no workspace tooling — each app has its own manifest and is installed/run independently.

## Layout

| Path | What | Runs on |
|---|---|---|
| `backend/` | Laravel 13.8 API (PHP 8.3, Sanctum, MySQL) | `:8000` |
| `admin/` | Angular 18 admin panel (adds chart.js) | `:4201`, calls `:8000` |
| `user/` | Angular 18 end-user app | `:4200`, calls `:8001` |

Note the two frontends target **different backend ports** (see `src/environments/`). Running
both against one API means overriding one of the environment files.

## Commands

```bash
# backend
cd backend
php artisan serve                 # :8000
php artisan serve --port=8001     # what the user app expects
php artisan migrate
composer test                     # clears config, then artisan test
./vendor/bin/pint                 # formatter — run before committing PHP
php artisan scribe:generate       # regenerates API docs at /docs

# frontends (identical scripts in admin/ and user/)
npm start                         # ng serve, defaults to :4200
npm start -- --port 4201          # admin — no port is set in angular.json
npm run build
```

## Domain model

`backend/app/Models/` — five entities:

```
User ──< Project ──< TaskList ──< Task ──< Comment
         (created_by / assigned_to both point at User)
```

- **Task** — priority `low|medium|high|critical`, status `todo|in_progress|review|completed`,
  plus `position` for drag-ordering and `completed_at`.
- **Project** — status `planning|active|on_hold|completed|archived`. Carries a nullable
  `workspace_id` that nothing uses; it's a placeholder, not a live feature.
- **User** — role `user|admin`, `isAdmin()` helper. Note this model configures itself with
  PHP attributes (`#[Fillable]`, `#[Hidden]`) rather than the usual `$fillable` properties.

Cascade behavior lives in `backend/database/migrations/2026_06_28_*`: task_lists and tasks
cascade with their project; `task_list_id` and `assigned_to` null out.

## API

Everything is declared in `backend/routes/api.php`:

- Public, `throttle:10,1` — `POST /api/auth/{register,login,forgot-password,reset-password}`
- `auth:sanctum` + `throttle:60,1` — auth profile endpoints, `apiResource` for projects /
  task-lists / tasks / comments, plus `GET /api/dashboard`
- `/api/admin/*` behind `App\Http\Middleware\IsAdmin` — dashboard, reports, user CRUD,
  role change, password reset

Controllers are deliberately thin: **no Form Requests and no API Resources**. Validation is
inline and Eloquent models are returned directly. Match that style rather than introducing a
resource layer for one endpoint. Scribe docblocks (`@group`, `@bodyParam`, `@response`) on the
controllers are the source for `/docs`.

Mail driver is `log`, so password-reset tokens land in `storage/logs`, not an inbox.

## Frontend conventions

Both apps: standalone components, lazy `loadComponent` routes, `core/{services,guards,interceptors,models,utils}`
and `features/<domain>/<component>/`. No NgRx — state is root-provided services holding RxJS
`BehaviorSubject`s (`AuthService.currentUser$`, `ThemeService.isDark$`, admin's `AppSettingsService.settings$`).
Components call the HTTP services directly and keep local state.

Two shared modules in `user/` that exist to prevent recurring bugs — use them, don't hand-roll:

- `user/src/app/shared/date-utils.ts` — `parseApiDate` / `toDateString`. API dates are parsed
  through these to avoid the UTC day-shift that caused several past fixes.
- `user/src/app/shared/task-meta.ts` — status/priority labels and colors, centralized.

`admin/` has no equivalents; the two frontends duplicate their models and services rather
than sharing a library. That's the existing state, not a target to refactor toward.

## Auth — read before touching

The two apps authenticate very differently.

**Admin** has a real login and rejects non-`admin` roles client-side in `auth.service.ts`.

**User is guest-first.** An `APP_INITIALIZER` in `user/src/app/app.config.ts` calls
`ensureGuestSession()`, which silently logs into a hardcoded shared account defined in
`user/src/app/core/services/auth.service.ts`. `authGuard` never blocks. Write actions are
gated only by `user/src/app/core/services/write-guard.service.ts`, which pops a login dialog.

That gate is **UI-only** — the guest token carries full API privileges and the backend has no
concept of a guest. Don't treat the write-guard as a security boundary.

Both apps store the Sanctum bearer token in `localStorage` under `auth_token`. The
`AuthInterceptor` injects `Injector` rather than `AuthService` to break a construction cycle,
and skips 401-logout for `/auth/*` URLs — both intentional.

## Known gaps

Worth knowing before you trust something, and fair game to fix if asked:

- **Projects have no owner column.** `ProjectController::index` doesn't scope by user, so every
  authenticated account sees every project. Only the dashboard and comment edit/delete check `Auth::id()`.
- **Prod env files are byte-identical to dev** in both frontends — a production build still calls localhost.
- `POST /tasks/reorder` and `/task-lists/reorder` are registered *after* their `apiResource`, so
  `tasks/{task}` can shadow them.
- **No real tests.** `backend/tests/` holds the untouched Laravel stubs; the Angular apps have
  Karma configured but no specs. Only `DatabaseSeeder` and `UserFactory` exist — no domain seeders.
- `README.md` says Laravel 11 (it's 13.8) and `.env.example` still ships sqlite (it's MySQL).
  The four planning docs (`API_PLAN.md`, `ADMIN_PLAN.md`, `USER_PLAN.md`,
  `backend/DATABASE_SCHEMA.md`) describe an `api.service.ts`, an `error.interceptor.ts`, and
  separate model files that were never built or got merged. Trust the code over the docs.
