import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

interface ProjectSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string | null;
  onPathChanged: () => void;
}

export function ProjectSettings({
  isOpen,
  onClose,
  currentPath,
  onPathChanged,
}: ProjectSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log("ProjectSettings render - isOpen:", isOpen);

  if (!isOpen) return null;

  const handleOpenProject = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use Tauri dialog to pick directory
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Project Directory",
      });

      if (selected && typeof selected === 'string') {
        // Set the project path
        await invoke("set_project_path", { path: selected });
        onPathChanged();
        onClose();
      }
    } catch (err) {
      setError(`Failed to open project: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefault = async () => {
    setLoading(true);
    setError(null);

    try {
      const homeDir = await invoke<string>("get_app_dir");
      await invoke("set_project_path", { path: homeDir });
      onPathChanged();
      onClose();
    } catch (err) {
      setError(`Failed to reset to default: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-lg"
        onKeyDown={handleKeyDown}
      >
        <h2 className="text-xl font-semibold mb-4">Project Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Current Project Location
            </label>
            <div className="px-3 py-2 bg-gray-900 rounded border border-gray-700 text-sm font-mono text-gray-300">
              {currentPath || "~/.query (default)"}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              All connections, queries, and history are stored in this directory
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="border-t border-gray-700 pt-4">
            <p className="text-sm text-gray-400 mb-3">Change Project Location:</p>
            <div className="space-y-2">
              <button
                onClick={handleOpenProject}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium disabled:opacity-50 transition"
              >
                {loading ? "Opening..." : "Open Different Project..."}
              </button>
              {currentPath && (
                <button
                  onClick={handleUseDefault}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium disabled:opacity-50 transition"
                >
                  Reset to Default Location
                </button>
              )}
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
            <p className="text-xs text-blue-300">
              <strong>💡 Tip:</strong> Use different project directories to organize connections by environment (dev, staging, prod) or by client/project.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition"
          >
            Close
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-gray-900 rounded border border-gray-700">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
