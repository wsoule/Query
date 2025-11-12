import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

function App() {
  const [config, setConfig] = useState<ConnectionConfig>({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password: '',
  });
  
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function testConnection() {
    setLoading(true);
    setStatus('');
    setIsSuccess(false);
    
    try {
      const result = await invoke<string>('test_postgres_connection', {
        config,
      });
      setStatus(result);
      setIsSuccess(true);
    } catch (error) {
      setStatus(`${error}`);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Query</h1>
        <p className="text-gray-400 mb-8">Fast database client for developers</p>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-6">Test PostgreSQL Connection</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Host</label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="localhost"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Port</label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 5432 })}
                className="w-full px-4 py-2 bg-gray-900 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="5432"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Database</label>
              <input
                type="text"
                value={config.database}
                onChange={(e) => setConfig({ ...config, database: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="postgres"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="postgres"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="Enter password"
              />
            </div>
            
            <button
              onClick={testConnection}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Testing Connection...' : 'Test Connection'}
            </button>
            
            {status && (
              <div className={`p-4 rounded-lg border ${
                isSuccess 
                  ? 'bg-green-900/20 border-green-700 text-green-300' 
                  : 'bg-red-900/20 border-red-700 text-red-300'
              }`}>
                <p className="font-mono text-sm">{status}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">
            💡 <strong>Tip:</strong> Make sure PostgreSQL is running locally, or use a remote connection.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            To test locally: <code className="bg-gray-900 px-2 py-1 rounded">psql -U postgres</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
