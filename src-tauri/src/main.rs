#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod db;

use tauri::{Manager, State};
use db::{Database, LoginRequest, LoginResponse, User, UserRole};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct CreateUserRequest {
    username: String,
    password: String,
    name: String,
    role: UserRole,
}

#[derive(Debug, Serialize, Deserialize)]
struct UpdateUserRequest {
    id: String,
    name: String,
    role: UserRole,
    is_active: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct ResetPasswordRequest {
    id: String,
    new_password: String,
}

#[tauri::command]
async fn login(
    db: State<'_, Database>,
    request: LoginRequest,
) -> Result<Option<LoginResponse>, String> {
    db.authenticate(&request)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn validate_session(
    db: State<'_, Database>,
    token: String,
) -> Result<Option<User>, String> {
    db.validate_session(&token)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn logout(
    db: State<'_, Database>,
    token: String,
) -> Result<(), String> {
    db.logout(&token)
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize database
            let app_dir = app.path().app_data_dir().unwrap();
            std::fs::create_dir_all(&app_dir).unwrap();
            let db_path = app_dir.join("pos.db");
            let db = Database::new(db_path.to_str().unwrap()).unwrap();
            
            // Create default admin user
            db.create_default_admin().unwrap();
            
            // Add database to app state
            app.manage(db);
            
            // Developer tools will be opened manually if needed
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            login,
            validate_session,
            logout,
            get_all_users,
            create_user,
            update_user,
            reset_password
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn get_all_users(
    db: State<'_, Database>,
) -> Result<Vec<User>, String> {
    db.get_all_users()
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_user(
    db: State<'_, Database>,
    request: CreateUserRequest,
) -> Result<User, String> {
    db.create_user(&request.username, &request.password, &request.name, &request.role)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_user(
    db: State<'_, Database>,
    request: UpdateUserRequest,
) -> Result<(), String> {
    db.update_user(&request.id, &request.name, &request.role, request.is_active)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn reset_password(
    db: State<'_, Database>,
    request: ResetPasswordRequest,
) -> Result<(), String> {
    db.reset_password(&request.id, &request.new_password)
        .map_err(|e| e.to_string())
}