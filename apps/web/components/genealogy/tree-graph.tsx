"use client";

import { useCallback, useEffect, useState } from "react";
import { Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from "@xyflow/react";
import type { Edge, Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Animal } from "@/lib/db/types";

type GraphNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  external?: boolean;
};

type GraphEdge = { id: string; source: string; target: string; label?: string };

function toRFNode(n: GraphNode) {
  return {
    id: n.id,
    position: { x: n.x, y: n.y },
    data: { label: n.label },
    style: {
      padding: 8,
      borderRadius: 12,
      border: "1px solid #cbd5e1",
      background: n.external ? "#fff7ed" : "#f8fafc",
      fontWeight: 700,
    },
  } as Node;
}

function toRFEdge(e: GraphEdge) {
  return { ...e, animated: false } as Edge;
}

export function TreeGraph({ farmId, rootAnimalId }: { farmId: string; rootAnimalId: string }) {
  const supabase = createClient();
  const [depth, setDepth] = useState(3);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const buildGraph = useCallback(
    async (animalId: string, maxDepth: number) => {
      const nodeMap = new Map<string, GraphNode>();
      const edgeMap = new Map<string, GraphEdge>();
      const visited = new Set<string>();

      const putNode = (id: string, label: string, x: number, y: number, external = false) => {
        if (!nodeMap.has(id)) nodeMap.set(id, { id, label, x, y, external });
      };

      const walk = async (id: string, level: number, col: number) => {
        if (level > maxDepth || visited.has(`${id}-${level}`)) return;
        visited.add(`${id}-${level}`);

        const { data: a } = await supabase.from("animals").select("*").eq("id", id).single();
        const animal = a as Animal | null;
        if (!animal) return;

        const label = animal.name || animal.ear_tag || animal.chip_id || id.slice(0, 6);
        putNode(animal.id, label, col * 260, level * 170);

        if (animal.sire_id) {
          edgeMap.set(`${animal.sire_id}-${animal.id}`, {
            id: `${animal.sire_id}-${animal.id}`,
            source: animal.sire_id,
            target: animal.id,
            label: "padre",
          });
          await walk(animal.sire_id, level + 1, col - 1);
        } else if (animal.sire_external) {
          const ext = `ext-sire-${animal.id}`;
          putNode(ext, `Padre externo: ${animal.sire_external}`, (col - 1) * 260, (level + 1) * 170, true);
          edgeMap.set(`${ext}-${animal.id}`, {
            id: `${ext}-${animal.id}`,
            source: ext,
            target: animal.id,
            label: "padre",
          });
        }

        if (animal.dam_id) {
          edgeMap.set(`${animal.dam_id}-${animal.id}`, {
            id: `${animal.dam_id}-${animal.id}`,
            source: animal.dam_id,
            target: animal.id,
            label: "madre",
          });
          await walk(animal.dam_id, level + 1, col + 1);
        } else if (animal.dam_external) {
          const ext = `ext-dam-${animal.id}`;
          putNode(ext, `Madre externa: ${animal.dam_external}`, (col + 1) * 260, (level + 1) * 170, true);
          edgeMap.set(`${ext}-${animal.id}`, {
            id: `${ext}-${animal.id}`,
            source: ext,
            target: animal.id,
            label: "madre",
          });
        }

        const { data: children } = await supabase
          .from("animals")
          .select("id,name,ear_tag,chip_id")
          .eq("farm_id", farmId)
          .or(`sire_id.eq.${animal.id},dam_id.eq.${animal.id}`)
          .limit(30);

        (children ?? []).forEach((child, idx) => {
          const childLabel = child.name || child.ear_tag || child.chip_id || child.id.slice(0, 6);
          putNode(child.id, childLabel, (col + idx - 1) * 260, (level - 1) * 170);
          edgeMap.set(`${animal.id}-${child.id}`, {
            id: `${animal.id}-${child.id}`,
            source: animal.id,
            target: child.id,
            label: "hijo",
          });
        });
      };

      await walk(animalId, 0, 0);
      return {
        nodes: [...nodeMap.values()].map(toRFNode),
        edges: [...edgeMap.values()].map(toRFEdge),
      };
    },
    [farmId, supabase],
  );

  useEffect(() => {
    buildGraph(rootAnimalId, depth)
      .then((g) => {
        setNodes(g.nodes);
        setEdges(g.edges);
      })
      .catch(() => undefined);
  }, [buildGraph, depth, rootAnimalId, setEdges, setNodes]);

  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => setDepth((d) => Math.max(2, d - 1))}>
          - Profundidad
        </Button>
        <span className="font-semibold">{depth}</span>
        <Button variant="secondary" onClick={() => setDepth((d) => Math.min(6, d + 1))}>
          + Profundidad
        </Button>
      </Card>
      <div className="h-[70vh] rounded-2xl border border-slate-200 bg-white">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView>
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
