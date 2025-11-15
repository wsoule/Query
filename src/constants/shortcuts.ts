// Keyboard shortcuts used throughout the application
export const SHORTCUTS = {
  // Command Palette
  COMMAND_PALETTE: {
    key: "k",
    modifier: "Cmd",
    description: "Open command palette",
  },

  // Connection Picker
  CONNECTION_PICKER: {
    key: "C",
    modifier: "Cmd+Shift",
    description: "Quick switch connections",
  },

  // Editor
  EXECUTE_QUERY: {
    key: "Enter",
    modifier: "Cmd",
    description: "Execute query",
  },

  COMMENT_LINE: {
    key: "/",
    modifier: "Cmd",
    description: "Toggle comment",
  },
} as const;

// Default connection configuration
export const DEFAULT_CONNECTION = {
  name: "New Connection",
  host: "localhost",
  port: 5432,
  database: "querytest",
  username: "postgres",
  password: "",
} as const;

// Default limits
export const DEFAULTS = {
  HISTORY_LIMIT: 20,
  QUERY_LIMIT: 100,
  DEFAULT_PORT: 5432,
} as const;
