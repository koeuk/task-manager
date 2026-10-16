# 🚀 Quick Start Guide

## Starting the Application

### 1. Backend (Laravel API) - Port 8001

```bash
cd backend
php artisan serve --port=8001
```

**Access:** http://localhost:8001

The backend home page displays:
- ✅ API status and version information
- 📋 Complete list of available endpoints
- 🔗 Quick links to frontends
- ℹ️ Authentication instructions

---

### 2. User Frontend - Port 4200

```bash
cd user
npm install  # First time only
npm start
```

**Access:** http://localhost:4200

**Features:**
- User registration and authentication
- Project and task management
- Dashboard with statistics
- Light/dark mode toggle

---

### 3. Admin Frontend - Port 4201

```bash
cd admin
npm install  # First time only
npm start -- --port 4201
```

**Access:** http://localhost:4201

**Features:**
- Admin dashboard with charts
- User management
- Reports and analytics
- System administration

---

## Database Setup (First Time Only)

```bash
cd backend

# Run migrations
php artisan migrate

# (Optional) Seed sample data
php artisan db:seed
```

---

## Testing the API

### Quick Health Check
```bash
curl http://localhost:8001/api
```

### Register a User
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

## Ports Summary

| Service | Port | URL |
|---------|------|-----|
| **Backend API** | 8001 | http://localhost:8001 |
| **User App** | 4200 | http://localhost:4200 |
| **Admin Panel** | 4201 | http://localhost:4201 |
| **MySQL** | 3306 | localhost:3306 |

---

## System Requirements

- ✅ PHP 8.2+ (You have: 8.4.20)
- ✅ Composer (You have: 2.7.1)
- ✅ Node.js 18+ (You have: 22.22.2)
- ✅ npm (You have: 10.9.7)
- ✅ MySQL (Running on port 3306)

---

## Common Commands

### Backend
```bash
# Format code
./vendor/bin/pint

# Run tests
composer test

# Generate API docs
php artisan scribe:generate

# Clear cache
php artisan cache:clear
php artisan config:clear
```

### Frontend
```bash
# Build for production
npm run build

# Run linting
npm run lint
```

---

## Environment Files

### Backend: `backend/.env`
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=task_manager
DB_USERNAME=root
DB_PASSWORD=koeuk
```

### User App: `user/src/environments/environment.ts`
```typescript
apiUrl: 'http://localhost:8001/api'
```

### Admin App: `admin/src/environments/environment.ts`
```typescript
apiUrl: 'http://localhost:8001/api'
```

---

## Troubleshooting

### Backend won't start
- Check if port 8001 is available: `lsof -i :8001`
- Verify database connection in `.env`
- Run `php artisan key:generate`

### Frontend won't start
- Delete `node_modules` and run `npm install` again
- Check if ports 4200/4201 are available
- Clear npm cache: `npm cache clean --force`

### Database connection error
- Make sure MySQL is running
- Verify credentials in `backend/.env`
- Run migrations: `php artisan migrate`

---

## Next Steps

1. ✅ Start all three services
2. 📱 Open http://localhost:4200 for the user app
3. 👑 Open http://localhost:4201 for admin panel
4. 📚 View API docs at http://localhost:8001

**Need help?** Check the detailed plans:
- `API_PLAN.md` - Complete API documentation
- `USER_PLAN.md` - User frontend details
- `ADMIN_PLAN.md` - Admin panel details
- `CLAUDE.md` - Technical reference
