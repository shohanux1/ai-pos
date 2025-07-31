# Authentication & User Management

## Overview
The POS system includes a secure authentication system with role-based access control (RBAC) supporting Admin and Cashier roles.

## Features Implemented

### 1. Secure Login System
- Username/password authentication
- Bcrypt password hashing
- Session-based authentication with tokens
- Automatic session expiration (24 hours)
- Default admin account: `admin` / `admin123`

### 2. User Roles
- **Admin**: Full system access, user management, reports, settings
- **Cashier**: Limited access to sales, products, and customers

### 3. User Management (Admin Only)
- Create new users with username, password, name, and role
- Update user information (name, role, active status)
- Reset user passwords
- Activate/deactivate users
- View all users and their last login times

### 4. Offline Support
- User credentials are cached locally using Zustand with persistence
- Sessions are validated locally first
- Database is stored locally using SQLite
- Full offline functionality maintained

### 5. Security Features
- Passwords are hashed using bcrypt with salt
- Sessions expire after 24 hours
- Inactive users cannot login
- Role-based route protection
- Secure token-based session management

## Technical Implementation

### Backend (Rust/Tauri)
- SQLite database with users and sessions tables
- Bcrypt for password hashing
- UUID for session tokens
- Tauri commands for authentication operations

### Frontend (Next.js)
- Zustand for state management with persistence
- React Hook Form for form handling
- Zod for validation
- Middleware for route protection
- shadcn/ui for UI components

## Database Schema

### Users Table
- id (UUID)
- username (unique)
- password (bcrypt hash)
- name
- role (ADMIN/CASHIER)
- is_active
- last_login
- created_at
- updated_at

### Sessions Table
- id (UUID)
- user_id (foreign key)
- token (unique)
- expires_at
- last_activity
- created_at

## API Endpoints

### Authentication
- `login(username, password)` - Authenticate user
- `validate_session(token)` - Check if session is valid
- `logout(token)` - End user session

### User Management (Admin Only)
- `get_all_users()` - List all users
- `create_user(username, password, name, role)` - Create new user
- `update_user(id, name, role, is_active)` - Update user details
- `reset_password(id, new_password)` - Reset user password

## Usage

1. **First Login**: Use default admin credentials (admin/admin123)
2. **Create Users**: Navigate to Users page from dashboard
3. **Manage Roles**: Assign Admin or Cashier roles as needed
4. **Security**: Change default admin password immediately

## Next Steps
- Add password complexity requirements
- Implement password recovery via email
- Add two-factor authentication
- Add audit logs for user actions
- Implement session timeout warnings