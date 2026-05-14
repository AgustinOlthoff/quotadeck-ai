//! Tauri IPC command handlers.
//!
//! These functions are exposed to the frontend via `tauri::command`
//! and serve as the bridge between the React UI and Rust services.

pub mod accounts;
pub mod platform;
pub mod settings;
pub mod oauth;
pub mod quota;
