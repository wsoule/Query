use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<serde_json::Value>>,
    pub row_count: usize,
    pub execution_time_ms: u128,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct QueryHistoryEntry {
    pub id: i64,
    pub query: String,
    pub connection_name: String,
    pub execution_time_ms: i64,
    pub row_count: i64,
    pub executed_at: String, // ISO timestamp
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SavedQuery {
    pub id: i64,
    pub name: String,
    pub query: String,
    pub description: Option<String>,
    pub is_pinned: bool,
    pub created_at: String, // ISO timestamp
    pub updated_at: String, // ISO timestamp
}
