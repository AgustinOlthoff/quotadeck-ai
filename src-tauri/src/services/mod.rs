//! Backend services for QuotaDeck AI.
//!
//! Each service encapsulates a specific domain of functionality
//! and is called by Tauri commands (IPC handlers).

pub mod database;
pub mod crypto;
pub mod antigravity;
pub mod paths;
pub mod oauth;
pub mod oauth_server;
pub mod quota;
