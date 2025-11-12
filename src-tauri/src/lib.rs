// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;

#[derive(Serialize, Deserialize, Debug)]
struct ConnectionConfig {
    host: String,
    port: u16,
    database: String,
    username: String,
    password: String,
}

#[tauri::command]
async fn test_postgres_connection(config: ConnectionConfig) -> Result<String, String> {
    // build connection string
    let connection_string = format!(
        "postgres://{}:{}@{}:{}/{}",
        config.username,
        config.password,
        config.host,
        config.port,
        config.database
    );

    // Try to connect
    let pool = PgPool::connect(&connection_string)
        .await
        .map_err(|e| format!("Error connecting to database: {}", e))?;

    // Close the connection
    pool.close().await;

    Ok(format!("Successfully connected to {}:{}/{}", config.host, config.port, config.database))
}


#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, test_postgres_connection])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
