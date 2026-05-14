//! QuotaDeck AI — Application Entry Point
//!
//! Sets up the Tauri application with all plugins, services,
//! system tray, and IPC command handlers.

mod commands;
mod error;
mod models;
mod services;

use services::database::Database;
use services::paths;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter,
    Manager,
};

/// Initializes and runs the QuotaDeck AI desktop application.
///
/// # Setup Process
///
/// 1. Resolves the database path for the current OS
/// 2. Initializes SQLite with schema migrations
/// 3. Registers all Tauri plugins (dialog, fs, notifications)
/// 4. Sets up the system tray with quick-switch menu
/// 5. Registers all IPC command handlers
/// 6. Starts the application event loop
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load environment variables from .env file
    let _ = dotenvy::from_filename(
        std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join(".env")
    );

    // Initialize the database
    let db_path = paths::database_path()
        .expect("Failed to resolve database path. Ensure your OS config directory is accessible.");

    let database = Database::new(&db_path)
        .expect("Failed to initialize database. Check file permissions.");

    tracing::info!("Database initialized at: {:?}", db_path);

    tauri::Builder::default()
        // ── Plugins ──
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        // ── Managed State ──
        .manage(database)
        // ── System Tray ──
        .setup(|app| {
            // Build tray menu
            let show = MenuItem::with_id(app, "show", "Show QuotaDeck AI", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let refresh = MenuItem::with_id(app, "refresh", "Refresh Quotas", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show, &separator, &refresh, &quit])?;

            // Use the default app icon for the tray
            let icon = app.default_window_icon().cloned()
                .expect("Default window icon not found. Ensure icons are configured in tauri.conf.json.");

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .tooltip("QuotaDeck AI — AI IDE Quota Manager")
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "refresh" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.emit("tray-refresh", ());
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        // ── IPC Commands ──
        .invoke_handler(tauri::generate_handler![
            // Account commands
            commands::accounts::get_accounts,
            commands::accounts::add_account,
            commands::accounts::update_account,
            commands::accounts::remove_account,
            commands::accounts::switch_account,
            commands::accounts::restart_antigravity,
            // OAuth commands
            commands::oauth::prepare_oauth,
            commands::oauth::wait_for_oauth_callback,
            commands::oauth::cancel_oauth,
            commands::oauth::submit_oauth_callback,
            commands::oauth::import_with_token,
            commands::oauth::import_from_antigravity,
            // Platform commands
            commands::platform::detect_antigravity,
            commands::platform::get_antigravity_status,
            // Settings commands
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::get_activity_log,
            // Quota commands
            commands::quota::fetch_account_quota,
            commands::quota::fetch_all_quotas,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running QuotaDeck AI");
}
