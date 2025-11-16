import { useState, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { ConnectionConfig } from "../../types";

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (connection: ConnectionConfig) => void;
  editConnection?: ConnectionConfig | null;
}

export const ConnectionModal = memo(function ConnectionModal({
  isOpen,
  onClose,
  onSave,
  editConnection,
}: ConnectionModalProps) {
  const [config, setConfig] = useState<ConnectionConfig>(
    editConnection || {
      name: "",
      host: "localhost",
      port: 5432,
      database: "",
      username: "",
      password: "",
    }
  );

  const handleSave = () => {
    if (!config.name || !config.host || !config.database || !config.username) {
      alert("Please fill in all required fields");
      return;
    }
    onSave(config);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editConnection ? "Edit Connection" : "New Connection"}
          </DialogTitle>
          <DialogDescription>
            Configure your PostgreSQL database connection. Password will be
            stored securely in your OS keychain.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Connection Name *</Label>
            <Input
              id="name"
              placeholder="My Database"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="host">Host *</Label>
              <Input
                id="host"
                placeholder="localhost"
                value={config.host}
                onChange={(e) =>
                  setConfig({ ...config, host: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="port">Port *</Label>
              <Input
                id="port"
                type="number"
                placeholder="5432"
                value={config.port}
                onChange={(e) =>
                  setConfig({ ...config, port: parseInt(e.target.value) || 5432 })
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="database">Database *</Label>
            <Input
              id="database"
              placeholder="postgres"
              value={config.database}
              onChange={(e) =>
                setConfig({ ...config, database: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              placeholder="postgres"
              value={config.username}
              onChange={(e) =>
                setConfig({ ...config, username: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={config.password}
              onChange={(e) =>
                setConfig({ ...config, password: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Connection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
