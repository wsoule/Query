export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  is_primary_key: boolean;
}

export interface ForeignKeyInfo {
  constraint_name: string;
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

export interface TableInfo {
  table_name: string;
  columns: ColumnInfo[];
  foreign_keys: ForeignKeyInfo[];
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
  readOnly?: boolean;
}
