import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./components/ui/sidebar";
import { AppSidebar } from "./components/layout/AppSidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";
import { Badge } from "./components/ui/badge";
import { ScrollArea } from "./components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Play, Database, Save, Settings as SettingsIcon, Plus } from "lucide-react";
import { SqlEditor } from "./components/editor/SqlEditor";
import { ResultsTableEnhanced } from "./components/results/ResultsTableEnhanced";
import { SaveQueryModal } from "./components/modals/SaveQueryModal";
import { CommandPalette } from "./components/modals/CommandPalette";
import { ProjectSettings } from "./components/modals/ProjectSettings";
import { ConnectionModal } from "./components/modals/ConnectionModal";
import type {
  DatabaseSchema,
  ConnectionConfig,
  QueryResult,
  QueryHistoryEntry,
  SavedQuery,
} from "./types";
import { DEFAULT_CONNECTION } from "./constants";

export default function AppNew() {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [connections, setConnections] = useState<ConnectionConfig[]>([]);
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [vimMode] = useState(false);
  const [compactView] = useState(false);
  const [currentProjectPath, setCurrentProjectPath] = useState<string | null>(
    null,
  );
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const [config, setConfig] = useState<ConnectionConfig>(DEFAULT_CONNECTION);

  const [connected, setConnected] = useState(false);
  const connectedRef = useRef(false);
  const [query, setQuery] = useState("SELECT * FROM users LIMIT 100;");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [insertAtCursor, setInsertAtCursor] = useState<
    ((text: string) => void) | null
  >(null);

  useEffect(() => {
    async function initialize() {
      try {
        await invoke("load_project_settings");
      } catch (error) {
        console.error("Failed to load project settings:", error);
      }

      loadSavedConnections();
      loadQueryHistory();
      loadSavedQueries();
      loadCurrentProjectPath();
    }
    initialize();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K: Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadCurrentProjectPath = useCallback(async () => {
    try {
      const path = await invoke<string | null>("get_current_project_path");
      setCurrentProjectPath(path);
    } catch (error) {
      console.error("Failed to load project path:", error);
    }
  }, []);

  const loadSavedConnections = useCallback(async () => {
    try {
      const saved = await invoke<ConnectionConfig[]>("load_connections");
      setConnections(saved);
    } catch (error) {
      console.error("Failed to load connections:", error);
    }
  }, []);

  const loadQueryHistory = useCallback(async () => {
    try {
      const hist = await invoke<QueryHistoryEntry[]>("get_query_history", {
        limit: 20,
      });
      setHistory(hist);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  }, []);

  const loadSavedQueries = useCallback(async () => {
    try {
      const queries = await invoke<SavedQuery[]>("get_saved_queries");
      setSavedQueries(queries);
    } catch (error) {
      console.error("Failed to load saved queries:", error);
    }
  }, []);

  const handleSaveQuery = useCallback(async (name: string, description: string) => {
    try {
      await invoke("save_query", {
        name,
        query,
        description: description || null,
      });
      await loadSavedQueries();
      setStatus(`Query "${name}" saved successfully`);
      setShowSaveModal(false);
    } catch (error) {
      setStatus(`Failed to save query: ${error}`);
    }
  }, [query, loadSavedQueries]);

  const handleDeleteSavedQuery = useCallback(async (id: number) => {
    try {
      await invoke("delete_saved_query", { id });
      await loadSavedQueries();
      setStatus("Query deleted");
    } catch (error) {
      setStatus(`Failed to delete query: ${error}`);
    }
  }, [loadSavedQueries]);

  const handleTogglePin = useCallback(async (id: number) => {
    try {
      await invoke("toggle_pin_query", { id });
      await loadSavedQueries();
    } catch (error) {
      setStatus(`Failed to toggle pin: ${error}`);
    }
  }, [loadSavedQueries]);

  const handleSaveConnection = useCallback(async (connection: ConnectionConfig) => {
    try {
      // Save password to keychain if provided
      if (connection.password) {
        await invoke("save_connection_password", {
          name: connection.name,
          password: connection.password,
        });
      }

      // Add or update connection in list
      const existing = connections.find((c) => c.name === connection.name);
      let updated: ConnectionConfig[];

      if (existing) {
        updated = connections.map((c) =>
          c.name === connection.name ? { ...connection, password: "" } : c
        );
      } else {
        updated = [...connections, { ...connection, password: "" }];
      }

      await invoke("save_connections", { connections: updated });
      setConnections(updated);
      setConfig(connection);
      setStatus(`Connection "${connection.name}" saved successfully`);
      setShowConnectionModal(false);
    } catch (error) {
      setStatus(`Failed to save connection: ${error}`);
    }
  }, [connections]);

  const testConnection = useCallback(async () => {
    setLoading(true);
    setStatus("");

    try {
      const result = await invoke<string>("test_postgres_connection", {
        config,
      });
      setStatus(result);
      setConnected(true);
      connectedRef.current = true;

      // Load schema after successful connection
      const schemaData = await invoke<DatabaseSchema>("get_database_schema", {
        config,
      });
      setSchema(schemaData);
    } catch (error) {
      setStatus(`${error}`);
      setConnected(false);
      connectedRef.current = false;
      setSchema(null);
    } finally {
      setLoading(false);
    }
  }, [config]);

  const runQuery = useCallback(async () => {
    if (!connectedRef.current) {
      setStatus("Please connect to a database first");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const queryResult = await invoke<QueryResult>("execute_query", {
        config,
        query,
      });

      setResult(queryResult);
      setStatus(
        `Query executed successfully - ${queryResult.row_count} rows in ${queryResult.execution_time_ms}ms`,
      );

      // Save to history
      await invoke("save_query_to_history", {
        query,
        connectionName: config.name,
        executionTimeMs: queryResult.execution_time_ms,
        rowCount: queryResult.row_count,
      });

      await loadQueryHistory();
    } catch (error) {
      setStatus(`Error executing query: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [config, query, loadQueryHistory]);

  const handleProjectPathChanged = useCallback(async () => {
    await loadCurrentProjectPath();
    await loadSavedConnections();
    await loadQueryHistory();
    await loadSavedQueries();
    setStatus("Project location changed - data reloaded");
  }, [loadCurrentProjectPath, loadSavedConnections, loadQueryHistory, loadSavedQueries]);

  const handleTableClick = useCallback((tableName: string) => {
    setQuery(`SELECT * FROM ${tableName} LIMIT 100;`);
  }, []);

  const handleTableDoubleClick = useCallback(async (tableName: string) => {
    const newQuery = `SELECT * FROM ${tableName} LIMIT 100;`;
    setQuery(newQuery);

    if (!connectedRef.current) {
      setStatus("Please connect to a database first");
      return;
    }

    setLoading(true);
    try {
      const queryResult = await invoke<QueryResult>("execute_query", {
        config,
        query: newQuery,
      });

      setResult(queryResult);
      setStatus(
        `Query executed - ${queryResult.row_count} rows in ${queryResult.execution_time_ms}ms`,
      );

      await invoke("save_query_to_history", {
        query: newQuery,
        connectionName: config.name,
        executionTimeMs: queryResult.execution_time_ms,
        rowCount: queryResult.row_count,
      });

      await loadQueryHistory();
    } catch (error) {
      setStatus(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [config, loadQueryHistory]);

  const handleColumnClick = useCallback((tableName: string, columnName: string) => {
    if (insertAtCursor) {
      insertAtCursor(`${tableName}.${columnName}`);
    }
  }, [insertAtCursor]);

  const handleClearHistory = useCallback(async () => {
    try {
      await invoke("clear_query_history");
      await loadQueryHistory();
      setStatus("History cleared");
    } catch (error) {
      setStatus(`Failed to clear history: ${error}`);
    }
  }, [loadQueryHistory]);

  const handleOpenSettings = useCallback(() => {
    setShowProjectPicker(true);
  }, []);

  const handleConnectionChange = useCallback((value: string) => {
    const conn = connections.find((c) => c.name === value);
    if (conn) {
      setConfig(conn);
    }
  }, [connections]);

  const handleExecuteFromPalette = useCallback((q: string) => {
    setQuery(q);
    setShowCommandPalette(false);
    runQuery();
  }, [runQuery]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar
          schema={schema}
          history={history}
          savedQueries={savedQueries}
          onTableClick={handleTableClick}
          onTableDoubleClick={handleTableDoubleClick}
          onColumnClick={handleColumnClick}
          onSelectQuery={setQuery}
          onDeleteQuery={handleDeleteSavedQuery}
          onTogglePin={handleTogglePin}
          onClearHistory={handleClearHistory}
          onOpenSettings={handleOpenSettings}
        />

        <SidebarInset className="flex flex-col">
          {/* Header */}
          <header className="flex h-14 items-center gap-4 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="font-semibold">Query</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Select
                value={config.name}
                onValueChange={handleConnectionChange}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select connection" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((conn) => (
                    <SelectItem key={conn.name} value={conn.name}>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`h-2 w-2 rounded-full p-0 ${
                            connected && config.name === conn.name
                              ? "bg-green-500"
                              : "bg-gray-500"
                          }`}
                        />
                        {conn.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowConnectionModal(true)}
                title="Add new connection"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={loading}
              >
                Connect
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowProjectPicker(true)}
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Main Content with Resizable Panels */}
          <div className="flex-1 overflow-hidden">
            <ResizablePanelGroup direction="vertical">
              {/* SQL Editor Panel */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b px-4 py-2">
                    <h3 className="text-sm font-medium">Query Editor</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSaveModal(true)}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        onClick={runQuery}
                        disabled={loading}
                        className="gap-2"
                      >
                        <Play className="h-3 w-3" />
                        Run Query
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <SqlEditor
                      value={query}
                      onChange={setQuery}
                      onRunQuery={runQuery}
                      schema={schema}
                      onEditorReady={setInsertAtCursor}
                      vimMode={vimMode}
                    />
                  </div>
                  {status && (
                    <div className="border-t px-4 py-2 text-xs text-muted-foreground">
                      {status}
                    </div>
                  )}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Results Panel */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b px-4 py-2">
                    <h3 className="text-sm font-medium">Results</h3>
                    {result && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {result.row_count} rows
                        </Badge>
                        <Badge variant="secondary">
                          {result.execution_time_ms}ms
                        </Badge>
                      </div>
                    )}
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4">
                      <ResultsTableEnhanced
                        result={result}
                        compact={compactView}
                      />
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </SidebarInset>
      </div>

      {/* Modals */}
      <SaveQueryModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveQuery}
        currentQuery={query}
      />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        schema={schema}
        history={history}
        onExecuteQuery={handleExecuteFromPalette}
      />

      <ProjectSettings
        isOpen={showProjectPicker}
        onClose={() => setShowProjectPicker(false)}
        onPathChanged={handleProjectPathChanged}
        currentPath={currentProjectPath}
      />

      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onSave={handleSaveConnection}
      />
    </SidebarProvider>
  );
}
