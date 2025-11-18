import { useState, memo, useEffect } from "react";
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
import { ScrollArea } from "../ui/scroll-area";
import type { GitStatus } from "../../types";
import { gitCommit, getGitStatus } from "../../utils/tauri";

interface GitCommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  gitStatus: GitStatus | null;
  onCommitSuccess: (newStatus: GitStatus, message: string) => void;
}

export const GitCommitModal = memo(function GitCommitModal({
  isOpen,
  onClose,
  gitStatus,
  onCommitSuccess,
}: GitCommitModalProps) {
  const [commitMessage, setCommitMessage] = useState("");
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCommitMessage("");
      setError(null);
    }
  }, [isOpen]);

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      setError("Commit message is required");
      return;
    }

    setCommitting(true);
    setError(null);

    try {
      const successMessage = await gitCommit(commitMessage);

      // Fetch updated git status
      const newStatus = await getGitStatus();
      onCommitSuccess(newStatus, successMessage);

      // Close modal
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCommitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleCommit();
    }
  };

  const totalChanges = gitStatus
    ? gitStatus.staged + gitStatus.unstaged + gitStatus.untracked
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Commit Changes</DialogTitle>
          <DialogDescription>
            Stage and commit {totalChanges} changed file{totalChanges !== 1 ? "s" : ""} to the repository
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Commit Message Input */}
          <div className="space-y-2">
            <Label htmlFor="commit-message">Commit Message</Label>
            <Input
              id="commit-message"
              placeholder="Update database schema..."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Press Cmd+Enter to commit
            </p>
          </div>

          {/* Changed Files List */}
          {gitStatus && gitStatus.files.length > 0 && (
            <div className="space-y-2">
              <Label>Changed Files ({gitStatus.files.length})</Label>
              <ScrollArea className="h-[200px] rounded border border-border bg-card p-3">
                <div className="space-y-1">
                  {gitStatus.files.map((file, index) => (
                    <div
                      key={index}
                      className="text-sm font-mono text-muted-foreground px-2 py-1 rounded hover:bg-muted/50"
                    >
                      {file}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded bg-destructive/10 border border-destructive text-destructive text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={committing}>
            Cancel
          </Button>
          <Button
            onClick={handleCommit}
            disabled={committing || !commitMessage.trim()}
          >
            {committing ? "Committing..." : "Commit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
