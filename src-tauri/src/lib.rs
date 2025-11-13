// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use sqlx::{Row, Column};

#[derive(Serialize, Deserialize, Debug)]
struct ConnectionConfig {
    host: String,
    port: u16,
    database: String,
    username: String,
    password: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct QueryResult {
    columns: Vec<String>,
    rows: Vec<Vec<serde_json::Value>>,
    row_count: usize,
    execution_time_ms: u128,
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
async fn execute_query(config: ConnectionConfig, query: String) -> Result<QueryResult, String> {
    let start = std::time::Instant::now();
    
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

    // Execute query
    let rows = sqlx::query(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Error executing query: {}", e))?;

    // Close the connection
    pool.close().await;

    // Extract column names
    let mut columns = Vec::new();
    if let Some(first_row) = rows.first() {
        for column in first_row.columns() {
            columns.push(column.name().to_string());
        }
    }

    // Convert rows to JSON
    let mut result_rows = Vec::new();
    for row in rows.iter() {
        let mut result_row = Vec::new();
        for (i, _column) in row.columns().iter().enumerate() {
            // Try to get value as different types
            let value = if let Ok(v) = row.try_get::<String, _>(i) {
                serde_json::json!(v)
            } else if let Ok(v) = row.try_get::<i32, _>(i) {
                serde_json::json!(v)
            } else if let Ok(v) = row.try_get::<i64, _>(i) {
                serde_json::json!(v)
            } else if let Ok(v) = row.try_get::<bool, _>(i) {
                serde_json::json!(v)
            } else if let Ok(v) = row.try_get::<f64, _>(i) {
                serde_json::json!(v)
            } else {
                serde_json::Value::Null
            };
            result_row.push(value);
        }
        result_rows.push(result_row);
    }

    let execution_time_ms = start.elapsed().as_millis();
    let row_count = result_rows.len();


    Ok(QueryResult {
        columns,
        rows: result_rows,
        row_count,
        execution_time_ms,
    })
}


#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, test_postgres_connection, execute_query])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
