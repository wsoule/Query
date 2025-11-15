export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

export interface TableInfo {
  table_name: string;
  columns: ColumnInfo[];
}

export interface DatabaseSchema {
  tables: TableInfo[];
}

export interface ConnectionConfig {
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}
