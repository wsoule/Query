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

// Enhanced schema types for schema comparison feature

export interface IndexInfo {
  index_name: string;
  table_name: string;
  columns: string[];
  is_unique: boolean;
  is_primary: boolean;
  definition: string;
}

export interface ViewInfo {
  view_name: string;
  definition: string;
}

export interface RoutineInfo {
  routine_name: string;
  routine_type: string; // 'FUNCTION' or 'PROCEDURE'
  definition?: string;
  return_type?: string;
}

export interface EnhancedColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  is_primary_key: boolean;
  column_default?: string;
  character_maximum_length?: number;
  numeric_precision?: number;
  numeric_scale?: number;
  ordinal_position: number;
}

export interface EnhancedTableInfo {
  table_name: string;
  columns: EnhancedColumnInfo[];
  foreign_keys: ForeignKeyInfo[];
  indexes: IndexInfo[];
}

export interface EnhancedDatabaseSchema {
  tables: EnhancedTableInfo[];
  views: ViewInfo[];
  routines: RoutineInfo[];
}
