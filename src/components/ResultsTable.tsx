interface QueryResult {
  columns: string[];
  rows: any[][];
  row_count: number;
  execution_time_ms: number;
}

interface ResultsTableProps {
  result: QueryResult | null;
}

export function ResultsTable({ result }: ResultsTableProps) {
  if (!result) {
    return (
      <div className="text-gray-500 text-center py-12 border border-gray-700 rounded-lg bg-gray-800">
        <p className="text-lg">No results yet</p>
        <p className="text-sm mt-2">
          Connect to a database and run a query to see results
        </p>
      </div>
    );
  }

  if (result.row_count === 0) {
    return (
      <div className="border border-gray-700 rounded-lg bg-gray-800">
        <div className="p-4 text-gray-400 text-center">
          <p>Query executed successfully</p>
          <p className="text-sm mt-1">
            0 rows returned • {result.execution_time_ms}ms
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800">
      <div className="overflow-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 sticky top-0">
            <tr>
              {result.columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left font-semibold text-gray-300 border-b border-gray-700"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-gray-800 hover:bg-gray-900/50 transition"
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2 font-mono text-xs">
                    {cell === null ? (
                      <span className="text-gray-500 italic">NULL</span>
                    ) : typeof cell === "boolean" ? (
                      <span
                        className={cell ? "text-green-400" : "text-red-400"}
                      >
                        {cell.toString()}
                      </span>
                    ) : typeof cell === "number" ? (
                      <span className="text-blue-400">{cell}</span>
                    ) : (
                      <span className="text-gray-200">{String(cell)}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-gray-900 border-t border-gray-700 flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {result.row_count} row{result.row_count !== 1 ? "s" : ""}
        </span>
        <span className="text-gray-400">{result.execution_time_ms}ms</span>
      </div>
    </div>
  );
}
