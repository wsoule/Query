import { Editor } from '@monaco-editor/react';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRunQuery: () => void;
  schema?: {
    tables: Array<{
      table_name: string;
      columns: Array<{
        column_name: string;
        data_type: string;
      }>;
    }>;
  } | null;
}

export function SqlEditor({ value, onChange, onRunQuery, schema }: SqlEditorProps) {
  function handleEditorChange(newValue: string | undefined) {
    onChange(newValue || '');
  }

  function handleEditorMount(editor: any, monaco: any) {
    // Cmd+Enter to run query
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunQuery();
    });

    // Cmd+/ to comment
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.trigger('keyboard', 'editor.action.commentLine', {});
    });

    // Register completion provider with schema
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        }).toLowerCase();

        const suggestions: any[] = [];

        // SQL Keywords
        const keywords = [
          'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
          'INNER JOIN', 'ON', 'AND', 'OR', 'ORDER BY', 'GROUP BY',
          'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO', 'UPDATE', 'DELETE',
          'CREATE', 'ALTER', 'DROP', 'AS', 'DISTINCT', 'COUNT', 'SUM',
          'AVG', 'MIN', 'MAX', 'IN', 'NOT IN', 'LIKE', 'BETWEEN',
        ];

        keywords.forEach(kw => {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range: range,
          });
        });

        // Add table names from schema
        if (schema?.tables) {
          schema.tables.forEach(table => {
            suggestions.push({
              label: table.table_name,
              kind: monaco.languages.CompletionItemKind.Class,
              detail: `Table (${table.columns.length} columns)`,
              insertText: table.table_name,
              range: range,
            });
          });

          // If typing after "table." suggest columns
          const dotMatch = /(\w+)\.(\w*)$/.exec(textUntilPosition);
          if (dotMatch) {
            const tableName = dotMatch[1];
            const table = schema.tables.find(t => 
              t.table_name.toLowerCase() === tableName.toLowerCase()
            );
            
            if (table) {
              // Clear suggestions and only show columns
              suggestions.length = 0;
              table.columns.forEach(col => {
                suggestions.push({
                  label: col.column_name,
                  kind: monaco.languages.CompletionItemKind.Field,
                  detail: col.data_type,
                  insertText: col.column_name,
                  range: range,
                });
              });
            }
          }
        }

        return { suggestions };
      },
    });
  }

  return (
    <Editor
      height="300px"
      language="sql"
      theme="vs-dark"
      value={value}
      onChange={handleEditorChange}
      onMount={handleEditorMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
      }}
    />
  );
}
