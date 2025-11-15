# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Query is a desktop SQL database client built with Tauri 2.0, React 19, and TypeScript. It provides a Monaco-based SQL editor with IntelliSense, schema browsing, query history, and saved queries. The application uses PostgreSQL for remote databases and SQLite for local data storage (history, saved queries). Passwords are stored securely in the OS keychain.

**Tech Stack:**
- **Frontend**: React 19.1 + TypeScript 5.8 + Vite 7 + Tailwind CSS 4
- **Backend**: Tauri 2.0 + Rust (async with Tokio)
- **Database**: SQLx 0.8.6 (PostgreSQL, SQLite, MySQL support)
- **Editor**: Monaco Editor 4.7 with SQL IntelliSense and optional Vim mode
- **Data Tables**: TanStack Table 8.21 with sorting, filtering, virtual scrolling

## Development Commands

### Running the Application
```bash
# Development mode (hot reload for both frontend and backend)
bun run tauri dev

# Or with bun (as configured in tauri.conf.json)
bun run dev  # Frontend only
bun run tauri dev  # Full Tauri app

# Build production version
bun run build      # Build frontend
cargo build        # Build Rust backend
bun run tauri build  # Build complete desktop app
```

### Testing Compilation
```bash
# TypeScript compilation check
bun run build

# Rust compilation check
cd src-tauri && cargo build

# Run Rust tests (if any)
cd src-tauri && cargo test
```

### Frontend Development
```bash
bun run dev      # Start Vite dev server (port 1420)
bun run preview  # Preview production build
```

## Architecture

### Frontend Structure (src/)

The frontend follows a domain-driven organization:

```
src/
├── types/          # Centralized TypeScript types
│   ├── database.ts  # ConnectionConfig, DatabaseSchema, TableInfo, ColumnInfo
│   ├── query.ts     # QueryResult, QueryHistoryEntry, SavedQuery
│   └── index.ts     # Re-exports all types
├── utils/
│   ├── tauri.ts     # Type-safe wrappers for all Tauri commands
│   └── format.ts    # Formatting utilities
├── constants/
│   └── shortcuts.ts # Keyboard shortcuts and default values
└── components/
    ├── editor/      # SqlEditor with Monaco + Vim mode
    ├── results/     # ResultsTableEnhanced (TanStack), ResultsTable (legacy)
    ├── sidebar/     # SchemaExplorer, QueryHistory, SavedQueries
    └── modals/      # CommandPalette (Cmd+K), SaveQueryModal, ProjectSettings
```

**Key Frontend Patterns:**
- All Tauri commands are called through `src/utils/tauri.ts` wrappers (never invoke directly)
- Types are imported from `src/types` (never define inline in components)
- Components are one level deep in domain folders (editor/, results/, sidebar/, modals/)

### Backend Structure (src-tauri/src/)

The Rust backend is organized into domain modules (refactored from a 683-line monolith):

```
src-tauri/src/
├── lib.rs          # Minimal entry point (~50 lines), registers all Tauri commands
├── models/         # Data structures shared across modules
│   ├── connection.rs  # ConnectionConfig
│   ├── query.rs       # QueryResult, QueryHistoryEntry, SavedQuery
│   └── schema.rs      # DatabaseSchema, TableInfo, ColumnInfo
├── commands/       # Tauri command handlers (public API)
│   ├── connection.rs       # test_postgres_connection, execute_query, get_database_schema
│   ├── history.rs          # save_query_to_history, get_query_history, clear_query_history
│   ├── saved_queries.rs    # save_query, get_saved_queries, delete_saved_query, toggle_pin_query
│   └── settings.rs         # Project path, connection storage, keychain wrappers
├── storage/        # Data persistence layer
│   ├── history_db.rs       # SQLite schema and connection for query history
│   ├── saved_queries_db.rs # SQLite schema and connection for saved queries
│   ├── keychain.rs         # OS keychain integration (passwords never touch disk)
│   └── connections.rs      # connections.json file I/O
└── utils/
    └── app_dir.rs  # Project path management, settings persistence
```

**Key Backend Patterns:**
- Each module is focused and small (50-150 lines)
- Commands in `commands/` are public and registered in `lib.rs`
- Storage layer abstracts database/file operations
- Global state: `PROJECT_PATH` mutex in `utils/app_dir.rs` for custom project directories

### Data Storage Architecture

**Local Storage (SQLite):**
- `{project_path}/history.db` - Query execution history (last 20 by default)
- `{project_path}/saved_queries.db` - Named/pinned queries
- `{project_path}/connections.json` - Connection configs (WITHOUT passwords)
- `~/.query/settings.json` - Global app settings (project path preference)

**Secure Storage (OS Keychain):**
- Service: "Query"
- Account: connection name
- Stores: database passwords only

**Project Path Logic:**
- Default: `~/.query/`
- Custom: User-selected directory (set via ProjectSettings modal)
- Changing project path reloads all data from new location

### Frontend-Backend Communication

All communication happens through Tauri commands defined in `src/utils/tauri.ts`:

**Connection Commands:**
- `testPostgresConnection(config)` → Test connection validity
- `getDatabaseSchema(config)` → Fetch tables and columns from information_schema
- `executeQuery(config, query)` → Run SQL and return results with timing

**Storage Commands:**
- `loadConnections()` / `saveConnections(connections)` → Connection list persistence
- `saveConnectionPassword(name, password)` → Store in OS keychain
- `getConnectionPassword(name)` → Retrieve from keychain
- `deleteConnectionPassword(name)` → Remove from keychain

**History Commands:**
- `saveQueryToHistory(query, connectionName, timeMs, rowCount)`
- `getQueryHistory(limit)` → Returns array of QueryHistoryEntry
- `clearQueryHistory()`

**Saved Queries Commands:**
- `saveQuery(name, query, description)`
- `getSavedQueries()` → Returns sorted (pinned first, then by name)
- `deleteSavedQuery(id)`
- `togglePinQuery(id)`

**Settings Commands:**
- `setProjectPath(path)` → Changes active data directory
- `getCurrentProjectPath()` → Returns current project path
- `loadProjectSettings()` → Called on app startup

### Key Features Implementation

**Monaco SQL Editor with IntelliSense:**
- Component: `src/components/editor/SqlEditor.tsx`
- Provides keyword completion, table name completion, and column completion after `table.`
- Schema passed as prop and used by completion provider
- Keybindings: Cmd+Enter (execute), Cmd+/ (comment)
- Optional Vim mode via `monaco-vim` package

**Schema Browser:**
- Component: `src/components/sidebar/SchemaExplorer.tsx`
- Fetches schema via `get_database_schema` command (queries information_schema.tables/columns)
- Single click on table: loads `SELECT * FROM table LIMIT 100;` into editor
- Double click on table: executes the query immediately
- Click column: inserts `table.column` at cursor position in editor

**Command Palette (Cmd+K):**
- Component: `src/components/modals/CommandPalette.tsx`
- Generates quick commands for each table (SELECT, UPDATE, DESCRIBE, COUNT)
- Shows recent query history with fuzzy search
- Keyboard navigation with arrow keys + Enter

**TanStack Table with Sorting/Filtering:**
- Component: `src/components/results/ResultsTableEnhanced.tsx`
- Uses TanStack Table v8 with virtual scrolling for large datasets
- Column sorting (click header) and filtering (input per column)
- Compact view toggle to reduce row height
- Handles null values with italic gray "null" display

## Important Constraints

### Database Support
- **Currently Implemented**: PostgreSQL (fully functional)
- **Dependencies Added**: MySQL (sqlx feature enabled but no commands yet)
- **Future**: MongoDB mentioned in todo.md but requires different architecture

### TypeScript/Rust Type Alignment
When adding new Tauri commands:
1. Define Rust structs in `src-tauri/src/models/`
2. Mark with `#[derive(Serialize, Deserialize)]`
3. Define matching TypeScript interfaces in `src/types/`
4. Add command to appropriate `src-tauri/src/commands/` module
5. Export from `src-tauri/src/commands/mod.rs`
6. Register in `src-tauri/src/lib.rs` invoke_handler
7. Add typed wrapper to `src/utils/tauri.ts`

### Vim Mode Implementation
- Vim mode uses `monaco-vim` package
- Toggle button in UI controls `vimMode` state
- When enabled, `initVimMode(editor, statusNode)` is called
- Status bar (vim-status div) shows mode indicator
- Must properly dispose vim mode instance on unmount or mode change

### Query Execution Pattern
1. User edits query in Monaco Editor
2. Cmd+Enter or "Run Query" button clicked
3. Frontend calls `executeQuery(config, query)` via tauri.ts wrapper
4. Rust backend connects to PostgreSQL, executes query, times execution
5. Results returned as QueryResult (columns, rows as JSON values, timing, count)
6. Query saved to history asynchronously
7. Results displayed in TanStack Table

## Adding New Database Types

To add MySQL support (partially ready):
1. Create `src-tauri/src/commands/mysql.rs` with `test_mysql_connection`, `execute_mysql_query`, etc.
2. Connection form needs `db_type` field (dropdown: PostgreSQL, MySQL, MongoDB)
3. Route commands based on `db_type` in frontend
4. MySQL schema query differs from PostgreSQL's information_schema
5. Update ConnectionConfig model to include db_type field

## File Locations

**Main App Logic**: `src/App.tsx` (800+ lines, manages all state and coordination)
**Tauri Config**: `src-tauri/tauri.conf.json` (uses bun)
**Database Setup**: SQLite tables auto-created in `storage/history_db.rs` and `storage/saved_queries_db.rs`
**Keyboard Shortcuts**: Defined in `src/constants/shortcuts.ts` and used in components

## Notes on Recent Refactoring

The codebase was recently restructured (all tests passing):
- **Before**: Monolithic 683-line `lib.rs`, scattered types in components
- **After**: Modular architecture with clear separation of concerns
- **Migration**: All imports updated, no breaking changes to Tauri commands
- If you encounter old patterns (inline types, direct storage calls), they should be refactored to use the new structure
