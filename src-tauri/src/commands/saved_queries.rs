use crate::models::SavedQuery;
use crate::storage::get_saved_queries_db;
use crate::utils::get_app_dir;

#[tauri::command]
pub async fn save_query(
    name: String,
    query: String,
    description: Option<String>,
) -> Result<SavedQuery, String> {
    let app_dir = get_app_dir()?;
    let pool = get_saved_queries_db(app_dir).await?;

    let now = chrono::Utc::now().to_rfc3339();

    let result = sqlx::query(
        "INSERT INTO saved_queries (name, query, description, is_pinned, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)"
    )
    .bind(&name)
    .bind(&query)
    .bind(&description)
    .bind(&now)
    .bind(&now)
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to save query: {}", e))?;

    let id = result.last_insert_rowid();

    pool.close().await;

    Ok(SavedQuery {
        id,
        name,
        query,
        description,
        is_pinned: false,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub async fn get_saved_queries() -> Result<Vec<SavedQuery>, String> {
    let app_dir = get_app_dir()?;
    let pool = get_saved_queries_db(app_dir).await?;

    let rows = sqlx::query_as::<_, (i64, String, String, Option<String>, bool, String, String)>(
        "SELECT id, name, query, description, is_pinned, created_at, updated_at
         FROM saved_queries
         ORDER BY is_pinned DESC, name ASC",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to fetch saved queries: {}", e))?;

    pool.close().await;

    let queries = rows
        .into_iter()
        .map(
            |(id, name, query, description, is_pinned, created_at, updated_at)| SavedQuery {
                id,
                name,
                query,
                description,
                is_pinned,
                created_at,
                updated_at,
            },
        )
        .collect();

    Ok(queries)
}

#[tauri::command]
pub async fn delete_saved_query(id: i64) -> Result<(), String> {
    let app_dir = get_app_dir()?;
    let pool = get_saved_queries_db(app_dir).await?;

    sqlx::query("DELETE FROM saved_queries WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to delete query: {}", e))?;

    pool.close().await;

    Ok(())
}

#[tauri::command]
pub async fn toggle_pin_query(id: i64) -> Result<bool, String> {
    let app_dir = get_app_dir()?;
    let pool = get_saved_queries_db(app_dir).await?;

    let row = sqlx::query_as::<_, (bool,)>("SELECT is_pinned FROM saved_queries WHERE id = ?")
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to fetch query: {}", e))?;

    let new_pin_status = !row.0;

    sqlx::query("UPDATE saved_queries SET is_pinned = ? WHERE id = ?")
        .bind(new_pin_status)
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to update pin status: {}", e))?;

    pool.close().await;

    Ok(new_pin_status)
}
