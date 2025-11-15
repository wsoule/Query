import { invoke } from "@tauri-apps/api/core";
import type {
  ConnectionConfig,
  DatabaseSchema,
  QueryResult,
  QueryHistoryEntry,
  SavedQuery,
} from "../types";

// Connection Management
export async function testPostgresConnection(
  config: ConnectionConfig
): Promise<string> {
  return await invoke<string>("test_postgres_connection", { config });
}

export async function getDatabaseSchema(
  config: ConnectionConfig
): Promise<DatabaseSchema> {
  return await invoke<DatabaseSchema>("get_database_schema", { config });
}

export async function executeQuery(
  config: ConnectionConfig,
  query: string
): Promise<QueryResult> {
  return await invoke<QueryResult>("execute_query", { config, query });
}

// Connection Storage
export async function loadConnections(): Promise<ConnectionConfig[]> {
  return await invoke<ConnectionConfig[]>("load_connections");
}

export async function saveConnections(
  connections: ConnectionConfig[]
): Promise<void> {
  await invoke("save_connections", { connections });
}

export async function saveConnectionPassword(
  connectionName: string,
  password: string
): Promise<void> {
  await invoke("save_connection_password", { connectionName, password });
}

export async function getConnectionPassword(
  connectionName: string
): Promise<string | null> {
  return await invoke<string | null>("get_connection_password", {
    connectionName,
  });
}

export async function deleteConnectionPassword(
  connectionName: string
): Promise<void> {
  await invoke("delete_connection_password", { connectionName });
}

// Query History
export async function saveQueryToHistory(
  query: string,
  connectionName: string,
  executionTimeMs: number,
  rowCount: number
): Promise<void> {
  await invoke("save_query_to_history", {
    query,
    connectionName,
    executionTimeMs,
    rowCount,
  });
}

export async function getQueryHistory(
  limit: number = 20
): Promise<QueryHistoryEntry[]> {
  return await invoke<QueryHistoryEntry[]>("get_query_history", { limit });
}

export async function clearQueryHistory(): Promise<void> {
  await invoke("clear_query_history");
}

// Saved Queries
export async function saveQuery(
  name: string,
  query: string,
  description: string | null
): Promise<void> {
  await invoke("save_query", { name, query, description });
}

export async function getSavedQueries(): Promise<SavedQuery[]> {
  return await invoke<SavedQuery[]>("get_saved_queries");
}

export async function deleteSavedQuery(id: number): Promise<void> {
  await invoke("delete_saved_query", { id });
}

export async function togglePinQuery(id: number): Promise<void> {
  await invoke("toggle_pin_query", { id });
}

// Settings/Project
export async function loadProjectSettings(): Promise<void> {
  await invoke("load_project_settings");
}

export async function getCurrentProjectPath(): Promise<string | null> {
  return await invoke<string | null>("get_current_project_path");
}

export async function setProjectPath(path: string): Promise<void> {
  await invoke("set_project_path", { path });
}
