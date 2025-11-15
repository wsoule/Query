use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ColumnInfo {
    pub column_name: String,
    pub data_type: String,
    pub is_nullable: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TableInfo {
    pub table_name: String,
    pub columns: Vec<ColumnInfo>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseSchema {
    pub tables: Vec<TableInfo>,
}
