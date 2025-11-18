import { useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
} from '@xyflow/react';
import dagre from 'dagre';
import type { DatabaseSchema } from '../../types';
import '@xyflow/react/dist/style.css';

interface ErdDiagramProps {
  schema: DatabaseSchema | null;
}

// Layout configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 40; // Base height per table

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

export function ErdDiagram({ schema }: ErdDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);

  useEffect(() => {
    if (!schema || !schema.tables || schema.tables.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Create nodes from tables
    const newNodes: Node[] = schema.tables.map((table) => ({
      id: table.table_name,
      type: 'default',
      data: {
        label: table.table_name,
      },
      position: { x: 0, y: 0 },
      style: {
        background: '#18181b',
        color: '#fafafa',
        border: '1px solid #3f3f46',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '14px',
        fontWeight: '600',
        width: nodeWidth,
      },
    }));

    // Create edges from foreign keys
    const newEdges: Edge[] = [];
    schema.tables.forEach((table) => {
      if (table.foreign_keys && table.foreign_keys.length > 0) {
        table.foreign_keys.forEach((fk) => {
          newEdges.push({
            id: `${fk.table_name}-${fk.column_name}-${fk.foreign_table_name}`,
            source: fk.table_name,
            target: fk.foreign_table_name,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: '#a78bfa',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#a78bfa',
              width: 20,
              height: 20,
            },
            label: `${fk.column_name} → ${fk.foreign_column_name}`,
            labelStyle: {
              fill: '#a78bfa',
              fontSize: 11,
              fontWeight: 500,
            },
            labelBgStyle: {
              fill: '#0a0a0f',
              fillOpacity: 0.9,
            },
          });
        });
      }
    });

    // Apply Dagre layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      newNodes,
      newEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [schema, setNodes, setEdges]);

  if (!schema || !schema.tables || schema.tables.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No schema available</p>
          <p className="text-sm mt-2">Connect to a database to view the ERD</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#0a0a0f]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Background
          color="#3f3f46"
          gap={16}
          size={1}
          style={{ backgroundColor: '#0a0a0f' }}
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
