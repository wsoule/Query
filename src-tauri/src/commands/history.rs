use crate::models::QueryHistoryEntry;
use crate::storage::get_history_db;
use crate::utils::get_app_dir;

#[tauri::command]
pub async fn save_query_to_history(
    query: String,
    connection_name: String,
    execution_time_ms: i64,
    row_count: i64,
) -> Result<(), String> {
    let app_dir = get_app_dir()?;
    let pool = get_history_db(app_dir).await?;

    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO query_history (query, connection_name, execution_time_ms, row_count, executed_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&query)
    .bind(&connection_name)
    .bind(execution_time_ms)
    .bind(row_count)
    .bind(&now)
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to save query: {}", e))?;

    pool.close().await;

    Ok(())
}

#[tauri::command]
pub async fn get_query_history(limit: i64) -> Result<Vec<QueryHistoryEntry>, String> {
    let app_dir = get_app_dir()?;
    let pool = get_history_db(app_dir).await?;

    let rows = sqlx::query_as::<_, (i64, String, String, i64, i64, String)>(
        "SELECT id, query, connection_name, execution_time_ms, row_count, executed_at
         FROM query_history
         ORDER BY executed_at DESC
         LIMIT ?",
    )
    .bind(limit)
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to fetch history: {}", e))?;

    pool.close().await;

    let history = rows
        .into_iter()
        .map(
            |(id, query, connection_name, execution_time_ms, row_count, executed_at)| {
                QueryHistoryEntry {
                    id,
                    query,
                    connection_name,
                    execution_time_ms,
                    row_count,
                    executed_at,
                }
            },
        )
        .collect();

    Ok(history)
}

#[tauri::command]
pub async fn clear_query_history() -> Result<(), String> {
    let app_dir = get_app_dir()?;
    let pool = get_history_db(app_dir).await?;

    sqlx::query("DELETE FROM query_history")
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to clear history: {}", e))?;

    pool.close().await;

    Ok(())
}
