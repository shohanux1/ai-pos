use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{DateTime, Utc, Duration};
use uuid::Uuid;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum UserRole {
    ADMIN,
    CASHIER,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub name: String,
    pub role: UserRole,
    pub is_active: bool,
    pub last_login: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub user: User,
    pub token: String,
}

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;
        
        // Create tables
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                last_login TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token TEXT UNIQUE NOT NULL,
                expires_at TEXT NOT NULL,
                last_activity TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create indexes
        conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)", [])?;

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    pub fn create_default_admin(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // Check if admin already exists
        let exists: Result<i32> = conn.query_row(
            "SELECT COUNT(*) FROM users WHERE username = 'admin'",
            [],
            |row| row.get(0),
        );

        if exists.unwrap_or(0) == 0 {
            let id = Uuid::new_v4().to_string();
            let password_hash = hash("admin123", DEFAULT_COST).unwrap();
            let now = Utc::now().to_rfc3339();

            conn.execute(
                "INSERT INTO users (id, username, password, name, role, created_at, updated_at) 
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                &[&id, "admin", &password_hash, "Administrator", "ADMIN", &now, &now],
            )?;
        }

        Ok(())
    }

    pub fn authenticate(&self, login: &LoginRequest) -> Result<Option<LoginResponse>> {
        let conn = self.conn.lock().unwrap();

        let result = conn.query_row(
            "SELECT id, username, password, name, role, is_active, last_login, created_at, updated_at 
             FROM users WHERE username = ?1",
            [&login.username],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, i32>(5)?,
                    row.get::<_, Option<String>>(6)?,
                    row.get::<_, String>(7)?,
                    row.get::<_, String>(8)?,
                ))
            },
        );

        match result {
            Ok((id, username, password_hash, name, role_str, is_active, last_login, created_at, updated_at)) => {
                if is_active == 0 {
                    return Ok(None);
                }

                if verify(&login.password, &password_hash).unwrap_or(false) {
                    let role = match role_str.as_str() {
                        "ADMIN" => UserRole::ADMIN,
                        _ => UserRole::CASHIER,
                    };

                    let user = User {
                        id: id.clone(),
                        username,
                        name,
                        role,
                        is_active: true,
                        last_login: last_login.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|dt| dt.with_timezone(&Utc))),
                        created_at: DateTime::parse_from_rfc3339(&created_at).unwrap().with_timezone(&Utc),
                        updated_at: DateTime::parse_from_rfc3339(&updated_at).unwrap().with_timezone(&Utc),
                    };

                    // Update last login
                    let now = Utc::now().to_rfc3339();
                    conn.execute(
                        "UPDATE users SET last_login = ?1, updated_at = ?2 WHERE id = ?3",
                        [&now, &now, &id],
                    )?;

                    // Create session
                    let session_id = Uuid::new_v4().to_string();
                    let token = Uuid::new_v4().to_string();
                    let expires_at = (Utc::now() + Duration::hours(24)).to_rfc3339();

                    conn.execute(
                        "INSERT INTO sessions (id, user_id, token, expires_at, last_activity, created_at) 
                         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                        [&session_id, &id, &token, &expires_at, &now, &now],
                    )?;

                    Ok(Some(LoginResponse { user, token }))
                } else {
                    Ok(None)
                }
            }
            Err(_) => Ok(None),
        }
    }

    pub fn validate_session(&self, token: &str) -> Result<Option<User>> {
        let conn = self.conn.lock().unwrap();

        let result = conn.query_row(
            "SELECT u.id, u.username, u.name, u.role, u.is_active, u.last_login, u.created_at, u.updated_at, s.expires_at
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             WHERE s.token = ?1",
            [token],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, i32>(4)?,
                    row.get::<_, Option<String>>(5)?,
                    row.get::<_, String>(6)?,
                    row.get::<_, String>(7)?,
                    row.get::<_, String>(8)?,
                ))
            },
        );

        match result {
            Ok((id, username, name, role_str, is_active, last_login, created_at, updated_at, expires_at)) => {
                if is_active == 0 {
                    return Ok(None);
                }

                let expires = DateTime::parse_from_rfc3339(&expires_at).unwrap().with_timezone(&Utc);
                if expires < Utc::now() {
                    // Session expired
                    conn.execute("DELETE FROM sessions WHERE token = ?1", [token])?;
                    return Ok(None);
                }

                // Update last activity
                let now = Utc::now().to_rfc3339();
                conn.execute(
                    "UPDATE sessions SET last_activity = ?1 WHERE token = ?2",
                    [&now, token],
                )?;

                let role = match role_str.as_str() {
                    "ADMIN" => UserRole::ADMIN,
                    _ => UserRole::CASHIER,
                };

                Ok(Some(User {
                    id,
                    username,
                    name,
                    role,
                    is_active: true,
                    last_login: last_login.and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|dt| dt.with_timezone(&Utc))),
                    created_at: DateTime::parse_from_rfc3339(&created_at).unwrap().with_timezone(&Utc),
                    updated_at: DateTime::parse_from_rfc3339(&updated_at).unwrap().with_timezone(&Utc),
                }))
            }
            Err(_) => Ok(None),
        }
    }

    pub fn logout(&self, token: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM sessions WHERE token = ?1", [token])?;
        Ok(())
    }

    pub fn get_all_users(&self) -> Result<Vec<User>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, username, name, role, is_active, last_login, created_at, updated_at 
             FROM users ORDER BY created_at DESC"
        )?;

        let users_iter = stmt.query_map([], |row| {
            let role = match row.get::<_, String>(3)?.as_str() {
                "ADMIN" => UserRole::ADMIN,
                _ => UserRole::CASHIER,
            };

            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                name: row.get(2)?,
                role,
                is_active: row.get::<_, i32>(4)? == 1,
                last_login: row.get::<_, Option<String>>(5)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok().map(|dt| dt.with_timezone(&Utc))),
                created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?).unwrap().with_timezone(&Utc),
                updated_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?).unwrap().with_timezone(&Utc),
            })
        })?;

        users_iter.collect()
    }

    pub fn create_user(&self, username: &str, password: &str, name: &str, role: &UserRole) -> Result<User> {
        let conn = self.conn.lock().unwrap();
        
        let id = Uuid::new_v4().to_string();
        let password_hash = hash(password, DEFAULT_COST).unwrap();
        let now = Utc::now();
        let now_str = now.to_rfc3339();
        let role_str = match role {
            UserRole::ADMIN => "ADMIN",
            UserRole::CASHIER => "CASHIER",
        };

        conn.execute(
            "INSERT INTO users (id, username, password, name, role, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            &[&id, username, &password_hash, name, role_str, &now_str, &now_str],
        )?;

        Ok(User {
            id,
            username: username.to_string(),
            name: name.to_string(),
            role: role.clone(),
            is_active: true,
            last_login: None,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn update_user(&self, id: &str, name: &str, role: &UserRole, is_active: bool) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();
        let role_str = match role {
            UserRole::ADMIN => "ADMIN",
            UserRole::CASHIER => "CASHIER",
        };

        conn.execute(
            "UPDATE users SET name = ?1, role = ?2, is_active = ?3, updated_at = ?4 WHERE id = ?5",
            [name, role_str, &(is_active as i32).to_string(), &now, id],
        )?;

        Ok(())
    }

    pub fn reset_password(&self, id: &str, new_password: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let password_hash = hash(new_password, DEFAULT_COST).unwrap();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE users SET password = ?1, updated_at = ?2 WHERE id = ?3",
            [&password_hash, &now, id],
        )?;

        Ok(())
    }
}