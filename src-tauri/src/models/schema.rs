use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ColumnInfo {
    pub column_name: String,
    pub data_type: String,
    pub is_nullable: String,
    pub is_primary_key: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ForeignKeyInfo {
    pub constraint_name: String,
    pub table_name: String,
    pub column_name: String,
    pub foreign_table_name: String,
    pub foreign_column_name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TableInfo {
    pub table_name: String,
    pub columns: Vec<ColumnInfo>,
    pub foreign_keys: Vec<ForeignKeyInfo>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseSchema {
    pub tables: Vec<TableInfo>,
}
