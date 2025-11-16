use crate::models::{ColumnInfo, ConnectionConfig, DatabaseSchema, QueryResult, TableInfo};
use sqlx::postgres::PgPool;
use sqlx::{Column, Row};

#[tauri::command]
pub async fn test_postgres_connection(config: ConnectionConfig) -> Result<String, String> {
    let connection_string = format!(
        "postgres://{}:{}@{}:{}/{}",
        config.username, config.password, config.host, config.port, config.database
    );

    let pool = PgPool::connect(&connection_string)
        .await
        .map_err(|e| format!("Error connecting to database: {}", e))?;

    pool.close().await;

    Ok(format!(
        "Successfully connected to {}:{}/{}",
        config.host, config.port, config.database
    ))
}

#[tauri::command]
pub async fn execute_query(
    config: ConnectionConfig,
    query: String,
) -> Result<QueryResult, String> {
    // Read-only mode validation
    if config.read_only {
        let trimmed_query = query.trim().to_uppercase();
        let allowed_commands = ["SELECT", "DESCRIBE", "DESC", "SHOW", "EXPLAIN"];
        let is_allowed = allowed_commands.iter().any(|cmd| trimmed_query.starts_with(cmd));

        if !is_allowed {
            return Err(
                "Read-only mode: Only SELECT, DESCRIBE, DESC, SHOW, and EXPLAIN queries are allowed"
                    .to_string(),
            );
        }
    }

    let start = std::time::Instant::now();

    let connection_string = format!(
        "postgres://{}:{}@{}:{}/{}",
        config.username, config.password, config.host, config.port, config.database
    );

    let pool = PgPool::connect(&connection_string)
        .await
        .map_err(|e| format!("Error connecting to database: {}", e))?;

    let rows = sqlx::query(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Error executing query: {}", e))?;

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
pub async fn get_database_schema(config: ConnectionConfig) -> Result<DatabaseSchema, String> {
    let connection_string = format!(
        "postgres://{}:{}@{}:{}/{}",
        config.username, config.password, config.host, config.port, config.database
    );

    let pool = PgPool::connect(&connection_string)
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    let table_rows = sqlx::query(
        "SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'
         ORDER BY table_name",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to fetch tables: {}", e))?;

    let mut tables = Vec::new();

    for table_row in table_rows {
        let table_name: String = table_row
            .try_get("table_name")
            .map_err(|e| format!("Failed to get table name: {}", e))?;

        let column_rows = sqlx::query(
            "SELECT column_name, data_type, is_nullable
             FROM information_schema.columns
             WHERE table_schema = 'public'
             AND table_name = $1
             ORDER BY ordinal_position",
        )
        .bind(&table_name)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to fetch columns: {}", e))?;

        let mut columns = Vec::new();
        for col_row in column_rows {
            columns.push(ColumnInfo {
                column_name: col_row
                    .try_get("column_name")
                    .map_err(|e| format!("Failed to get column name: {}", e))?,
                data_type: col_row
                    .try_get("data_type")
                    .map_err(|e| format!("Failed to get data type: {}", e))?,
                is_nullable: col_row
                    .try_get("is_nullable")
                    .map_err(|e| format!("Failed to get is_nullable: {}", e))?,
            });
        }

        tables.push(TableInfo {
            table_name,
            columns,
        });
    }

    pool.close().await;

    Ok(DatabaseSchema { tables })
}
