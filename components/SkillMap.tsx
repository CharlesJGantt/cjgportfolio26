"use client";

import type { Node, Edge } from "reactflow";

import dynamic from "next/dynamic";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import { Card } from "@heroui/react";
import "reactflow/dist/style.css";

const ReactFlow = dynamic(() => import("reactflow").then((mod) => mod.default), {
  ssr: false,
});
const Background = dynamic(
  () => import("reactflow").then((mod) => mod.Background),
  { ssr: false }
);
const Controls = dynamic(
  () => import("reactflow").then((mod) => mod.Controls),
  { ssr: false }
);

type CsvNode = {
  id: string;
  label: string;
  type: "domain" | "skill";
  fx?: number;
  fy?: number;
};
type CsvLink = { source: string; target: string };

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;

  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export default function SkillMap({
  nodesCsv = "/skills/nodes.csv",
  linksCsv = "/skills/links.csv",
  dark = true,
}: {
  nodesCsv?: string;
  linksCsv?: string;
  dark?: boolean;
}) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    const loadNodes = new Promise<CsvNode[]>((resolve) =>
      Papa.parse(nodesCsv, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (res) =>
          resolve(
            (res.data as CsvNode[]).map((n) => ({ ...n, type: n.type as any }))
          ),
      })
    );
    const loadLinks = new Promise<CsvLink[]>((resolve) =>
      Papa.parse(linksCsv, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve(res.data as CsvLink[]),
      })
    );

    Promise.all([loadNodes, loadLinks]).then(([nodeData, linkData]) => {
      const W = 1200,
        H = 720,
        cx = W / 2,
        cy = H / 2;
      const domains = nodeData.filter((n) => n.type === "domain");
      const skills = nodeData.filter((n) => n.type === "skill");

      const step = 360 / domains.length;

      domains.forEach((d, i) => {
        const { x, y } = polar(cx, cy, 220, i * step - 90);

        d.fx = x;
        d.fy = y;
      });

      const home = new Map<string, string>();

      linkData.forEach((l) => {
        const s = nodeData.find((n) => n.id === l.source);
        const t = nodeData.find((n) => n.id === l.target);

        if (s && t) {
          if (s.type === "domain" && t.type === "skill") home.set(t.id, s.id);
          if (t.type === "domain" && s.type === "skill") home.set(s.id, t.id);
        }
      });

      const grouped: Record<string, CsvNode[]> = {};

      skills.forEach((s) => {
        const key = home.get(s.id) || domains[0].id;

        grouped[key] = grouped[key] || [];
        grouped[key].push(s);
      });
      Object.entries(grouped).forEach(([domId, arr]) => {
        const d = domains.find((x) => x.id === domId)!;
        const r1 = 95,
          r2 = 145;

        arr.forEach((s, i) => {
          const r = i % 2 === 0 ? r1 : r2;
          const angle = (360 / arr.length) * i;
          const { x, y } = polar(d.fx!, d.fy!, r, angle);

          s.fx = x;
          s.fy = y;
        });
      });

      const rfNodes: Node[] = nodeData.map((n) => ({
        id: n.id,
        position: { x: n.fx || 0, y: n.fy || 0 },
        data: { label: n.label },
        draggable: false,
        selectable: false,
        className:
          n.type === "domain"
            ? "rounded-lg px-3 py-2 text-sm font-medium text-white bg-indigo-600 shadow"
            : "rounded-md px-2 py-1 text-xs text-white bg-emerald-500 shadow-sm",
      }));

      const rfEdges: Edge[] = linkData.map((l, i) => ({
        id: `e-${i}`,
        source: l.source,
        target: l.target,
        type: "smoothstep",
        animated: false,
        selectable: false,
        style: { stroke: dark ? "#334155" : "#CBD5E1" },
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
    });
  }, [nodesCsv, linksCsv, dark]);

  return (
    <Card className="h-[560px] w-full overflow-hidden border-slate-700 bg-white/90 dark:bg-black/40">
      {nodes.length > 0 && (
        <ReactFlow
          fitView
          className="w-full h-full"
          edges={edges}
          elementsSelectable={false}
          nodes={nodes}
          nodesConnectable={false}
          nodesDraggable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color={dark ? "#1f2937" : "#e5e7eb"} gap={24} />
          <Controls showFitView={false} showZoom={false} />
        </ReactFlow>
      )}
    </Card>
  );
}
