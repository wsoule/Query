import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ResultsTable } from './components/ResultsTable';

interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

interface QueryResult {
  columns: string[];
  rows: any[][];
  row_count: number;
  execution_time_ms: number;
}

function App() {
  const [config, setConfig] = useState<ConnectionConfig>({
    host: 'localhost',
    port: 5433,
    database: 'querytest',
    username: 'postgres',
    password: '',
  });
  
  const [connected, setConnected] = useState(false);
  const [query, setQuery] = useState('SELECT * FROM users;');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function testConnection() {
    setLoading(true);
    setStatus('');
    
    try {
      const result = await invoke<string>('test_postgres_connection', { config });
      setStatus(result);
      setConnected(true);
    } catch (error) {
      setStatus(`${error}`);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  async function executeQuery() {
    if (!connected) {
      setStatus('Please connect to a database first');
      return;
    }

    setLoading(true);
    setStatus('');
    
    try {
      const queryResult = await invoke<QueryResult>('execute_query', {
        config,
        query,
      });
      setResult(queryResult);
      setStatus(`Query executed successfully - ${queryResult.row_count} rows in ${queryResult.execution_time_ms}ms`);
    } catch (error) {
      setStatus(`${error}`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Query</h1>
          <p className="text-gray-400 text-sm">Fast database client</p>
        </div>
        
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Connection */}
          <div className="col-span-3">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Connection</h2>
                {connected && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Host</label>
                  <input
                    type="text"
                    value={config.host}
                    onChange={(e) => setConfig({ ...config, host: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-900 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Port</label>
                  <input
                    type="number"
                    value={config.port}
                    onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 5432 })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-900 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Database</label>
                  <input
                    type="text"
                    value={config.database}
                    onChange={(e) => setConfig({ ...config, database: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-900 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-900 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={config.password}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-gray-900 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <button
                  onClick={testConnection}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium disabled:opacity-50 transition"
                >
                  {loading ? 'Connecting...' : connected ? 'Reconnect' : 'Connect'}
                </button>
              </div>
            </div>
          </div>

          {/* Main Area - Query Editor & Results */}
          <div className="col-span-9 space-y-4">
            {/* Query Editor */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Query Editor</h2>
                <button
                  onClick={executeQuery}
                  disabled={loading || !connected}
                  className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-medium disabled:opacity-50 transition"
                >
                  {loading ? 'Running...' : 'Run Query'}
                </button>
              </div>
              
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-32 px-4 py-3 bg-gray-900 rounded border border-gray-700 focus:border-blue-500 focus:outline-none font-mono text-sm resize-none"
                placeholder="SELECT * FROM users;"
              />
              
              {status && (
                <div className={`mt-3 p-3 rounded text-sm ${
                  status.includes('Error') || status.includes('failed') || status.includes('Please')
                    ? 'bg-red-900/20 border border-red-700 text-red-300' 
                    : 'bg-blue-900/20 border border-blue-700 text-blue-300'
                }`}>
                  {status}
                </div>
              )}
            </div>

            {/* Results */}
            <div>
              <h2 className="font-semibold mb-3">Results</h2>
              <ResultsTable result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
