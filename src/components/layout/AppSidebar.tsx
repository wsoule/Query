import { memo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Settings } from "lucide-react";
import { SchemaExplorer } from "../sidebar/SchemaExplorer";
import { QueryHistory } from "../sidebar/QueryHistory";
import { SavedQueries } from "../sidebar/SavedQueries";
import type {
  DatabaseSchema,
  QueryHistoryEntry,
  SavedQuery,
} from "../../types";

interface AppSidebarProps {
  schema: DatabaseSchema | null;
  history: QueryHistoryEntry[];
  savedQueries: SavedQuery[];
  onTableClick: (tableName: string) => void;
  onTableDoubleClick: (tableName: string) => void;
  onColumnClick: (tableName: string, columnName: string) => void;
  onSelectQuery: (query: string) => void;
  onDeleteQuery: (id: number) => void;
  onTogglePin: (id: number) => void;
  onClearHistory: () => void;
  onOpenSettings: () => void;
}

export const AppSidebar = memo(function AppSidebar({
  schema,
  history,
  savedQueries,
  onTableClick,
  onTableDoubleClick,
  onColumnClick,
  onSelectQuery,
  onDeleteQuery,
  onTogglePin,
  onClearHistory,
  onOpenSettings,
}: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Query</h2>
      </SidebarHeader>

      <SidebarContent>
        <Tabs defaultValue="schema" className="flex-1">
          <div className="border-b px-2">
            <TabsList className="grid w-full grid-cols-3 bg-transparent">
              <TabsTrigger
                value="schema"
                className="gap-2 data-[state=active]:bg-muted"
              >
                Schema
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="gap-2 data-[state=active]:bg-muted"
              >
                Saved
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="gap-2 data-[state=active]:bg-muted"
              >
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="schema" className="mt-0 flex-1">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="p-4">
                <SchemaExplorer
                  schema={schema}
                  onTableClick={onTableClick}
                  onTableDoubleClick={onTableDoubleClick}
                  onColumnClick={onColumnClick}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="saved" className="mt-0 flex-1">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="p-4">
                <SavedQueries
                  queries={savedQueries}
                  onSelectQuery={onSelectQuery}
                  onDeleteQuery={onDeleteQuery}
                  onTogglePin={onTogglePin}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-0 flex-1">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="p-4">
                <QueryHistory
                  history={history}
                  onSelectQuery={onSelectQuery}
                  onClearHistory={onClearHistory}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onOpenSettings}>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
});
