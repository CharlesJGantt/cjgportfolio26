"use client";

import type { Edge, Node, ReactFlowInstance } from "reactflow";

import dynamic from "next/dynamic";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import "reactflow/dist/style.css";

const ReactFlow = dynamic(() => import("reactflow"), { ssr: false });
const Background = dynamic(
  () => import("reactflow").then((mod) => mod.Background),
  { ssr: false }
);

interface CsvNode {
  id: string;
  label: string;
  type: "domain" | "skill";
}
interface CsvLink {
  source: string;
  target: string;
}

export default function SkillMap({
  nodesCsv = "/skills/nodes.csv",
  linksCsv = "/skills/links.csv",
}: {
  nodesCsv?: string;
  linksCsv?: string;
}) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [instance, setInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    const loadNodes = new Promise<CsvNode[]>((resolve) =>
      Papa.parse(nodesCsv, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve(res.data as CsvNode[]),
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
      const domains = nodeData.filter((n) => n.type === "domain");
      const skills = nodeData.filter((n) => n.type === "skill");

      // Determine home category for each skill
      const home = new Map<string, string>();

      linkData.forEach((l) => {
        const s = nodeData.find((n) => n.id === l.source);
        const t = nodeData.find((n) => n.id === l.target);

        if (!s || !t) return;
        if (s.type === "domain" && t.type === "skill" && !home.has(t.id))
          home.set(t.id, s.id);
        if (t.type === "domain" && s.type === "skill" && !home.has(s.id))
          home.set(s.id, t.id);
      });

      // Group skills by domain
      const grouped: Record<string, CsvNode[]> = {};

      skills.forEach((s) => {
        const dom = home.get(s.id);

        if (!dom) return;
        grouped[dom] = grouped[dom] || [];
        grouped[dom].push(s);
      });

      // Layout constants
      const domainWidth = 320;
      const skillWidth = 280;
      const domainHeight = 84;
      const rowHeight = 84;
      const rowGap = 18;
      const colGap = 64;

      // Positions map
      const positions: Record<string, { x: number; y: number }> = {};

      domains.forEach((d, i) => {
        const x = i * (domainWidth + colGap);

        positions[d.id] = { x, y: 0 };
        const group = grouped[d.id] || [];

        group.forEach((s, j) => {
          const sx = x + (domainWidth - skillWidth) / 2;
          const sy = domainHeight + j * (rowHeight + rowGap);

          positions[s.id] = { x: sx, y: sy };
        });
      });

      // React Flow nodes
      const rfNodes: Node[] = nodeData.map((n) => {
        const pos = positions[n.id] || { x: 0, y: 0 };

        if (n.type === "domain") {
          return {
            id: n.id,
            position: pos,
            data: { label: n.label },
            draggable: false,
            selectable: false,
            className:
              "w-[320px] rounded-xl border border-emerald-500/40 bg-emerald-600/15 px-4 py-2 text-emerald-300 font-semibold tracking-tight shadow-sm backdrop-blur-sm",
          };
        }

        return {
          id: n.id,
          position: pos,
          data: { label: n.label },
          draggable: false,
          selectable: true,
          className:
            "w-[280px] rounded-lg border border-slate-700/70 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 shadow-sm [&.selected]:ring-2 [&.selected]:ring-slate-400",
        };
      });

      // React Flow edges
      const rfEdges: Edge[] = linkData.map((l, i) => {
        const s = nodeData.find((n) => n.id === l.source);
        const t = nodeData.find((n) => n.id === l.target);
        const membership =
          (s?.type === "domain" && t?.type === "skill") ||
          (s?.type === "skill" && t?.type === "domain");

        return {
          id: `e-${i}`,
          source: l.source,
          target: l.target,
          type: "smoothstep",
          animated: !membership,
          selectable: false,
          style: membership
            ? { stroke: "hsl(var(--border-stronger))", strokeWidth: 0.5 }
            : {
                stroke: "hsl(var(--border-stronger))",
                strokeWidth: 0.5,
                strokeDasharray: 4,
              },
        };
      });

      setNodes(rfNodes);
      setEdges(rfEdges);
    });
  }, [nodesCsv, linksCsv]);

  useEffect(() => {
    if (instance && nodes.length > 0) {
      instance.fitView({ padding: 0.2 });
    }
  }, [instance, nodes]);

  useEffect(() => {
    if (!instance) return;
    const handler = () => instance.fitView({ padding: 0.2 });

    window.addEventListener("resize", handler);

    return () => window.removeEventListener("resize", handler);
  }, [instance]);

  return (
    <div
      className="h-[560px] w-full overflow-hidden rounded-xl border bg-[#0B1020]"
      style={{ maskImage: "linear-gradient(to right, transparent 2%, black 13%)" }}
    >
      {nodes.length > 0 && (
        <ReactFlow
          fitView
          panOnScroll
          edges={edges}
          maxZoom={1.8}
          minZoom={0.8}
          nodes={nodes}
          nodesConnectable={false}
          nodesDraggable={false}
          panOnScrollSpeed={1}
          proOptions={{ hideAttribution: true }}
          onInit={setInstance}
        >
          <Background
            color="hsl(var(--foreground-muted))"
            gap={16}
            size={1}
            style={{ opacity: 0.5 }}
            variant="dots"
          />
        </ReactFlow>
      )}
    </div>
  );
}
