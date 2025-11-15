// Date/Time formatting utilities
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export function formatExecutionTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatRowCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(2)}M rows`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(2)}K rows`;
  }
  return `${count} rows`;
}
